-- Figma 전체 화면 반영에 필요한 변경
--   * 가입 순서: 학교 메일 → 휴대폰 본인인증(만 19세 확인) → 프로필 → 카카오톡 ID → 활성화
--   * 매칭 조건: 같은 학과 포함 여부, 학년 필터 (서로의 조건이 맞을 때만 매칭)
--   * 신고 사유: 개인정보 요구·유출 추가

alter type public.report_reason add value if not exists 'privacy';

insert into private.settings (key, value) values ('min_age', '19')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 프로필: 본인인증 직후 행을 만들고, 프로필 입력은 다음 단계에서 채운다
-- ---------------------------------------------------------------------------
alter table public.profiles
  alter column nickname drop not null,
  alter column dept drop not null,
  alter column grade drop not null,
  add column pref_purpose public.match_purpose not null default 'friend',
  add column pref_same_gender_only boolean not null default false,
  add column pref_include_same_dept boolean not null default true,
  add column pref_target_grade smallint check (pref_target_grade between 1 and 4); -- null = 학년 무관, 4 = 4학년 이상

grant update (pref_purpose, pref_same_gender_only, pref_include_same_dept, pref_target_grade)
  on public.profiles to authenticated;

alter table public.match_pool
  add column include_same_dept boolean not null default true,
  add column target_grade smallint check (target_grade between 1 and 4);

-- 신청은 RPC로만 (조건을 프로필 설정에서 복사)
drop policy if exists pool_insert on public.match_pool;

-- ---------------------------------------------------------------------------
-- 활성화: 본인인증 + 프로필 + 카카오톡 ID가 모두 있으면 active
-- ---------------------------------------------------------------------------
create or replace function private.try_activate(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p
  set status = 'active'
  where p.id = p_user
    and p.status = 'pending'
    and p.identity_verified_at is not null
    and p.nickname is not null and p.dept is not null and p.grade is not null
    and exists (select 1 from private.contacts c where c.user_id = p_user);
end;
$$;

create or replace function private.on_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' then
    perform private.try_activate(new.id);
  end if;
  return null;
end;
$$;

create trigger profiles_try_activate
  after update of nickname, dept, grade on public.profiles
  for each row execute function private.on_profile_update();

create or replace function public.set_my_kakao_id(p_kakao_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  insert into private.contacts (user_id, kakao_id) values (auth.uid(), trim(p_kakao_id))
  on conflict (user_id) do update set kakao_id = excluded.kakao_id, updated_at = now();
  perform private.try_activate(auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- 본인인증 결과 저장 (서버 /api/identity 에서 service_role 로만 호출)
-- 반환: ok | underage | duplicate
-- ---------------------------------------------------------------------------
create or replace function public.complete_identity(
  p_user uuid, p_birth date, p_gender public.gender, p_ci_hash text
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_age int := extract(year from age((now() at time zone 'Asia/Seoul')::date, p_birth));
begin
  if v_age < private.setting_int('min_age') then
    return 'underage'; -- 만 19세 미만: 아무것도 저장하지 않음
  end if;

  if exists (select 1 from private.identity where ci_hash = p_ci_hash and user_id <> p_user) then
    return 'duplicate';
  end if;

  insert into public.profiles (id, gender, identity_verified_at, school_verified_at)
  values (p_user, p_gender, now(), now())
  on conflict (id) do update
    set gender = excluded.gender, identity_verified_at = now();

  insert into private.identity (user_id, birth_date, ci_hash)
  values (p_user, p_birth, p_ci_hash)
  on conflict (user_id) do update
    set birth_date = excluded.birth_date, ci_hash = excluded.ci_hash, verified_at = now();

  perform private.try_activate(p_user);
  return 'ok';
end;
$$;

revoke execute on function public.complete_identity(uuid, date, public.gender, text)
  from public, anon, authenticated;

-- 가입 단계 확인 (화면 이동용)
create or replace function public.my_status()
returns text language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then 'signed_out'
    when p.id is null or p.identity_verified_at is null then 'need_identity'
    when p.status = 'suspended' then 'suspended'
    when p.nickname is null or p.dept is null or p.grade is null then 'need_profile'
    when not exists (select 1 from private.contacts c where c.user_id = p.id) then 'need_kakao'
    else 'active'
  end
  from (select auth.uid() as uid) u
  left join public.profiles p on p.id = u.uid;
$$;

-- ---------------------------------------------------------------------------
-- 매칭 신청 / 취소 (내일 KST)
-- ---------------------------------------------------------------------------
create or replace function public.apply_match(p_purpose public.match_purpose default null)
returns date language plpgsql security definer set search_path = public as $$
declare
  v_date date := (now() at time zone 'Asia/Seoul')::date + 1;
  v_me public.profiles;
begin
  select * into v_me from public.profiles where id = auth.uid();
  if v_me.id is null or v_me.status <> 'active' then
    raise exception 'NOT_ACTIVE';
  end if;

  if p_purpose is not null then
    update public.profiles set pref_purpose = p_purpose where id = v_me.id;
    v_me.pref_purpose := p_purpose;
  end if;

  insert into public.match_pool
    (user_id, match_date, purpose, same_gender_only, include_same_dept, target_grade)
  values
    (v_me.id, v_date, v_me.pref_purpose, v_me.pref_same_gender_only,
     v_me.pref_include_same_dept, v_me.pref_target_grade)
  on conflict (user_id, match_date) do update set
    purpose = excluded.purpose,
    same_gender_only = excluded.same_gender_only,
    include_same_dept = excluded.include_same_dept,
    target_grade = excluded.target_grade;

  return v_date;
end;
$$;

create or replace function public.cancel_match()
returns void language sql security definer set search_path = public as $$
  delete from public.match_pool
  where user_id = auth.uid()
    and match_date = (now() at time zone 'Asia/Seoul')::date + 1;
$$;

-- 차단 목록 (상대 정보는 보여주지 않음)
create or replace function public.my_blocks()
returns table (blocked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select created_at from public.blocks where blocker_id = auth.uid() order by created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- 매일 매칭: 학과·학년 조건을 서로 확인하도록 교체
-- ---------------------------------------------------------------------------
create or replace function private.grade_ok(p_target smallint, p_grade smallint)
returns boolean language sql immutable as $$
  select p_target is null or (p_target = 4 and p_grade >= 4) or p_target = p_grade
$$;

create or replace function public.run_daily_matching(p_date date default (now() at time zone 'Asia/Seoul')::date)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_me      record;
  v_partner uuid;
  v_pairs   int := 0;
  v_expires timestamptz :=
    ((p_date::timestamp + interval '12 hours') at time zone 'Asia/Seoul')
    + make_interval(hours => private.setting_int('chat_hours'));
begin
  create temporary table tmp_pool on commit drop as
  select
    p.user_id, p.purpose, p.same_gender_only, p.include_same_dept, p.target_grade,
    pr.gender, pr.dept, pr.grade, pr.interests,
    exists (
      select 1 from public.match_leftovers l
      where l.user_id = p.user_id and l.match_date = p_date - 1
    ) as waited,
    false as done
  from public.match_pool p
  join public.profiles pr on pr.id = p.user_id and pr.status = 'active'
  where p.match_date = p_date;

  for v_me in
    select * from tmp_pool order by waited desc, random()
  loop
    continue when (select done from tmp_pool where user_id = v_me.user_id);

    select c.user_id into v_partner
    from tmp_pool c
    where not c.done
      and c.user_id <> v_me.user_id
      -- 같은 성별만: 양쪽 모두 존중
      and (not v_me.same_gender_only or c.gender = v_me.gender)
      and (not c.same_gender_only or c.gender = v_me.gender)
      -- 같은 학과 제외: 한쪽이라도 끄면 같은 학과끼리는 매칭하지 않음
      and (c.dept is distinct from v_me.dept or (v_me.include_same_dept and c.include_same_dept))
      -- 학년: 서로의 조건을 모두 만족
      and private.grade_ok(v_me.target_grade, c.grade)
      and private.grade_ok(c.target_grade, v_me.grade)
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_me.user_id and b.blocked_id = c.user_id)
           or (b.blocker_id = c.user_id and b.blocked_id = v_me.user_id)
      )
      and not exists (
        select 1 from public.matches m
        where ((m.user_a = v_me.user_id and m.user_b = c.user_id)
            or (m.user_a = c.user_id and m.user_b = v_me.user_id))
          and m.match_date > p_date - private.setting_int('rematch_cooldown_days')
      )
    order by
      (c.purpose = v_me.purpose) desc,
      cardinality(array(select unnest(c.interests)
                        intersect select unnest(v_me.interests))) desc,
      random()
    limit 1;

    if v_partner is null then
      continue;
    end if;

    insert into public.matches (match_date, user_a, user_b, purpose, expires_at)
    values (p_date, v_me.user_id, v_partner, v_me.purpose, v_expires);

    update tmp_pool set done = true where user_id in (v_me.user_id, v_partner);
    v_pairs := v_pairs + 1;
  end loop;

  insert into public.match_leftovers (user_id, match_date)
  select user_id, p_date from tmp_pool where not done
  on conflict do nothing;

  -- 매일 자동 참여: 프로필의 현재 설정으로 다음날 신청
  insert into public.match_pool
    (user_id, match_date, purpose, same_gender_only, include_same_dept, target_grade)
  select pr.id, p_date + 1, pr.pref_purpose, pr.pref_same_gender_only,
         pr.pref_include_same_dept, pr.pref_target_grade
  from public.profiles pr
  where pr.auto_join and pr.status = 'active'
  on conflict do nothing;

  update public.matches set status = 'ended'
  where status = 'active' and expires_at < now();

  return v_pairs;
end;
$$;

revoke execute on function public.run_daily_matching(date) from public, anon, authenticated;

-- 오늘 매칭이 없었던 이유 표시용
create or replace function public.was_leftover_today()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.match_leftovers
    where user_id = auth.uid() and match_date = (now() at time zone 'Asia/Seoul')::date
  );
$$;
