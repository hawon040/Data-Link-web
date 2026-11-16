-- 유료 매칭 (2026-11-16 결정)
--   * 첫 가입 1,000원 → 매칭 1회 포함. 결제 → 본인인증 순서, 만 19세 미만·중복 가입이면 자동 환불
--   * 그 뒤로는 2회 묶음 1,000원
--   * 매칭을 신청해서 실제로 짝이 된 날만 1회 차감 (짝이 없던 날은 차감하지 않음)
--   * 남은 횟수가 없으면 신청할 수 없다 (apply_match, 정오 매칭, 자동 참여 모두 DB에서 확인)
-- 결제 확인·기록·환불은 서버(/api/payments/complete, /api/identity)가 service_role 로만 한다.

insert into private.settings (key, value) values
  ('signup_price', '1000'),
  ('signup_credits', '1'),
  ('pack_price', '1000'),
  ('pack_credits', '2')
on conflict (key) do nothing;

-- 남은 매칭 횟수와 가입비 결제 여부 (본인인증 전에도 있어야 해서 auth.users 기준)
create table private.wallets (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  credits        int not null default 0 check (credits >= 0),
  signup_paid_at timestamptz,
  updated_at     timestamptz not null default now()
);

-- 결제 기록 (payment_id = 포트원 paymentId)
create table private.payments (
  payment_id  text primary key,
  user_id     uuid references auth.users (id) on delete set null,
  kind        text not null check (kind in ('signup', 'pack')),
  amount      int not null,
  credits     int not null,
  status      text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at  timestamptz not null default now(),
  refunded_at timestamptz
);
create index payments_user_idx on private.payments (user_id, created_at desc);

alter table private.wallets enable row level security;
alter table private.payments enable row level security;

-- 이미 본인인증을 마친 계정은 가입비를 낸 것으로 보고 매칭 1회를 준다
insert into private.wallets (user_id, credits, signup_paid_at)
select p.id, private.setting_int('signup_credits'), now()
from public.profiles p
where p.identity_verified_at is not null
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 결제 기록 (서버 전용). 반환: ok | duplicate | already_paid | not_active | invalid
-- ---------------------------------------------------------------------------
create or replace function public.record_payment(p_user uuid, p_payment_id text, p_kind text, p_amount int)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_price   int;
  v_credits int;
  v_paid    timestamptz;
  v_owner   uuid;
begin
  if p_kind = 'signup' then
    v_price := private.setting_int('signup_price');
    v_credits := private.setting_int('signup_credits');
  elsif p_kind = 'pack' then
    v_price := private.setting_int('pack_price');
    v_credits := private.setting_int('pack_credits');
  else
    return 'invalid';
  end if;
  if p_amount <> v_price then
    return 'invalid';
  end if;

  -- 같은 결제를 두 번 보내면 한 번만 반영
  select user_id into v_owner from private.payments where payment_id = p_payment_id;
  if found then
    return case when v_owner = p_user then 'duplicate' else 'invalid' end;
  end if;

  select signup_paid_at into v_paid from private.wallets where user_id = p_user;
  if p_kind = 'signup' and v_paid is not null then
    return 'already_paid';
  end if;
  if p_kind = 'pack' and (v_paid is null or not exists (
    select 1 from public.profiles where id = p_user and status = 'active'
  )) then
    return 'not_active';
  end if;

  insert into private.payments (payment_id, user_id, kind, amount, credits)
  values (p_payment_id, p_user, p_kind, p_amount, v_credits);

  insert into private.wallets (user_id, credits, signup_paid_at)
  values (p_user, v_credits, case when p_kind = 'signup' then now() end)
  on conflict (user_id) do update set
    credits = private.wallets.credits + v_credits,
    signup_paid_at = coalesce(private.wallets.signup_paid_at, excluded.signup_paid_at),
    updated_at = now();

  return 'ok';
end;
$$;

-- 가입비 환불 표시 (서버 전용, 포트원 취소가 성공한 뒤 호출). 환불한 payment_id를 돌려준다
create or replace function public.refund_signup_payment(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_payment private.payments;
begin
  select * into v_payment from private.payments
  where user_id = p_user and kind = 'signup' and status = 'paid'
  order by created_at desc limit 1;
  if not found then
    return null;
  end if;

  update private.payments set status = 'refunded', refunded_at = now()
  where payment_id = v_payment.payment_id;
  update private.wallets set
    credits = greatest(credits - v_payment.credits, 0),
    signup_paid_at = null,
    updated_at = now()
  where user_id = p_user;
  return v_payment.payment_id;
end;
$$;

-- 환불할 가입비 결제 찾기 (서버 전용)
create or replace function public.signup_payment_to_refund(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select payment_id from private.payments
  where user_id = p_user and kind = 'signup' and status = 'paid'
  order by created_at desc limit 1;
$$;

revoke execute on function public.record_payment(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.refund_signup_payment(uuid) from public, anon, authenticated;
revoke execute on function public.signup_payment_to_refund(uuid) from public, anon, authenticated;
grant execute on function public.record_payment(uuid, text, text, int) to service_role;
grant execute on function public.refund_signup_payment(uuid) to service_role;
grant execute on function public.signup_payment_to_refund(uuid) to service_role;

-- 내 남은 횟수 (화면 표시용)
create or replace function public.my_wallet()
returns table (credits int, signup_paid boolean, signup_price int, pack_price int, pack_credits int)
language sql stable security definer set search_path = public as $$
  select
    coalesce(w.credits, 0),
    w.signup_paid_at is not null,
    private.setting_int('signup_price'),
    private.setting_int('pack_price'),
    private.setting_int('pack_credits')
  from (select (select auth.uid()) as uid) u
  left join private.wallets w on w.user_id = u.uid;
$$;
revoke execute on function public.my_wallet() from public, anon;
grant execute on function public.my_wallet() to authenticated;

-- ---------------------------------------------------------------------------
-- 가입 단계: 가입비 결제 전이면 need_payment
-- ---------------------------------------------------------------------------
create or replace function public.my_status()
returns text language plpgsql stable security definer set search_path = public as $$
declare
  p public.profiles%rowtype;
begin
  if auth.uid() is null then
    return 'signed_out';
  end if;
  select * into p from public.profiles where id = auth.uid();
  if not found or p.identity_verified_at is null then
    if not exists (
      select 1 from private.wallets w where w.user_id = auth.uid() and w.signup_paid_at is not null
    ) then
      return 'need_payment';
    end if;
    return 'need_identity';
  end if;
  if p.status::text = 'suspended' then
    return 'suspended';
  end if;
  if p.status::text = 'withdrawn' then
    return 'withdrawn';
  end if;
  if p.nickname is null or p.dept is null or p.grade is null then
    return 'need_profile';
  end if;
  if not exists (select 1 from private.contacts c where c.user_id = p.id) then
    return 'need_kakao';
  end if;
  return 'active';
end;
$$;

-- 본인인증 결과 저장: 가입비를 낸 계정만
create or replace function public.complete_identity(
  p_user uuid, p_birth date, p_gender public.gender, p_ci_hash text
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_age int := extract(year from age((now() at time zone 'Asia/Seoul')::date, p_birth));
begin
  if not exists (select 1 from private.wallets where user_id = p_user and signup_paid_at is not null) then
    return 'need_payment';
  end if;

  if v_age < private.setting_int('min_age') then
    return 'underage'; -- 만 19세 미만: 아무것도 저장하지 않음 (가입비는 서버가 환불)
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

-- ---------------------------------------------------------------------------
-- 매칭 신청: 남은 횟수가 있어야 한다
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

  if coalesce((select credits from private.wallets where user_id = v_me.id), 0) < 1 then
    raise exception 'NO_CREDITS';
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

-- ---------------------------------------------------------------------------
-- 정오 매칭: 남은 횟수가 있는 사람만, 짝이 된 두 사람에게서 1회씩 차감
-- ---------------------------------------------------------------------------
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
  join private.wallets w on w.user_id = p.user_id and w.credits > 0
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

    -- 짝이 된 날만 1회 차감
    update private.wallets set credits = credits - 1, updated_at = now()
    where user_id in (v_me.user_id, v_partner);

    update tmp_pool set done = true where user_id in (v_me.user_id, v_partner);
    v_pairs := v_pairs + 1;
  end loop;

  insert into public.match_leftovers (user_id, match_date)
  select user_id, p_date from tmp_pool where not done
  on conflict do nothing;

  -- 매일 자동 참여: 남은 횟수가 있는 사람만 다음날 신청
  insert into public.match_pool
    (user_id, match_date, purpose, same_gender_only, include_same_dept, target_grade)
  select pr.id, p_date + 1, pr.pref_purpose, pr.pref_same_gender_only,
         pr.pref_include_same_dept, pr.pref_target_grade
  from public.profiles pr
  join private.wallets w on w.user_id = pr.id and w.credits > 0
  where pr.auto_join and pr.status = 'active'
  on conflict do nothing;

  update public.matches set status = 'ended'
  where status = 'active' and expires_at < now();

  return v_pairs;
end;
$$;

revoke execute on function public.run_daily_matching(date) from public, anon, authenticated;
