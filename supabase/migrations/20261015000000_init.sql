-- 백석대 학우 1:1 랜덤매칭 — 초기 스키마
-- 기획: docs/PLANNING.md
--
-- 핵심 규칙
--   * 하루 한 번(정오) 1:1 랜덤 매칭, 공강 조건 없음
--   * 기본은 성별 무관 랜덤, 옵션은 "같은 성별만" 하나 ("이성만" 옵션 없음)
--   * 매칭 채팅은 각자 메시지 20개 또는 24시간 중 먼저 오는 쪽까지
--   * 한도 후 둘 다 "교환"을 고르면 가입 시 저장한 카카오톡 ID를 서로 공개
--   * 랜덤채팅 규제 대응: 휴대폰 본인인증 + 대화 저장 + 신고 기능

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 설정값
-- ---------------------------------------------------------------------------
create schema if not exists private;

create table private.settings (
  key   text primary key,
  value text not null
);

insert into private.settings (key, value) values
  ('message_limit_per_user', '20'),
  ('chat_hours', '24'),
  ('rematch_cooldown_days', '9999'),   -- 한 번 만난 사람은 다시 매칭하지 않음
  ('school_email_domain', 'bu.ac.kr'); -- TODO: 실제 백석대 학생 메일 도메인 확인

create or replace function private.setting_int(p_key text)
returns int language sql stable as $$
  select value::int from private.settings where key = p_key
$$;

-- ---------------------------------------------------------------------------
-- 프로필
-- ---------------------------------------------------------------------------
create type public.gender as enum ('M', 'F');
create type public.match_purpose as enum ('friend', 'meal', 'study');
create type public.user_status as enum ('pending', 'active', 'suspended');

create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nickname              text not null check (char_length(nickname) between 2 and 12),
  dept                  text not null,
  grade                 smallint not null check (grade between 1 and 6),
  gender                public.gender not null,          -- 본인인증 결과로만 채움
  interests             text[] not null default '{}' check (cardinality(interests) <= 5),
  bio                   text check (char_length(bio) <= 60),
  auto_join             boolean not null default false,  -- 매일 자동 참여
  status                public.user_status not null default 'pending',
  school_verified_at    timestamptz,                     -- 학교 이메일 인증
  identity_verified_at  timestamptz,                     -- 휴대폰 본인인증
  created_at            timestamptz not null default now()
);

-- 본인인증 결과와 카카오톡 ID: API로 노출하지 않는 private 스키마에 둔다
create table private.identity (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  birth_date  date not null,
  ci_hash     text not null unique,  -- 중복 가입·재가입 방지 (CI 원문은 저장하지 않음)
  verified_at timestamptz not null default now()
);

create table private.contacts (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  kakao_id   text not null check (char_length(kakao_id) between 2 and 40),
  updated_at timestamptz not null default now()
);
-- TODO: 운영 전 Supabase Vault/pgsodium으로 kakao_id 컬럼 암호화

-- ---------------------------------------------------------------------------
-- 매칭
-- ---------------------------------------------------------------------------
create table public.match_pool (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  match_date       date not null,
  purpose          public.match_purpose not null,
  same_gender_only boolean not null default false,
  created_at       timestamptz not null default now(),
  primary key (user_id, match_date)
);

create type public.match_status as enum ('active', 'ended');

create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  match_date  date not null,
  user_a      uuid not null references public.profiles (id) on delete cascade,
  user_b      uuid not null references public.profiles (id) on delete cascade,
  purpose     public.match_purpose not null,
  expires_at  timestamptz not null,
  status      public.match_status not null default 'active',
  created_at  timestamptz not null default now(),
  check (user_a <> user_b)
);
create index matches_user_a_idx on public.matches (user_a, match_date desc);
create index matches_user_b_idx on public.matches (user_b, match_date desc);

-- 짝이 없던 사람: 다음날 우선 매칭
create table public.match_leftovers (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  match_date date not null,
  primary key (user_id, match_date)
);

create table public.messages (
  id         bigint generated always as identity primary key,
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  masked     boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);

-- 카카오톡 ID 교환 선택 (상대에게는 결과만 보임)
create table public.exchange_choices (
  match_id   uuid not null references public.matches (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  accepted   boolean not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 안전
-- ---------------------------------------------------------------------------
create type public.report_reason as enum (
  'harassment', 'sexual', 'spam', 'fake_contact', 'other'
);

create table public.reports (
  id          bigint generated always as identity primary key,
  match_id    uuid references public.matches (id) on delete set null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason      public.report_reason not null,
  detail      text check (char_length(detail) <= 500),
  created_at  timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create type public.review_rating as enum ('good', 'meh');

create table public.reviews (
  match_id   uuid not null references public.matches (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  rating     public.review_rating not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 헬퍼
-- ---------------------------------------------------------------------------
create or replace function public.is_match_member(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id and auth.uid() in (m.user_a, m.user_b)
  )
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
  )
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.match_pool       enable row level security;
alter table public.matches          enable row level security;
alter table public.match_leftovers  enable row level security;
alter table public.messages         enable row level security;
alter table public.exchange_choices enable row level security;
alter table public.reports          enable row level security;
alter table public.blocks           enable row level security;
alter table public.reviews          enable row level security;

-- 프로필: 본인 + 현재/과거 매칭 상대만 조회 (실명·연락처는 이 테이블에 없음)
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.matches m
    where (m.user_a = auth.uid() and m.user_b = profiles.id)
       or (m.user_b = auth.uid() and m.user_a = profiles.id)
  )
);
-- 프로필 행은 본인인증이 끝난 뒤 서버(서비스 키)가 만든다.
-- 사용자는 아래 컬럼만 고칠 수 있다 (성별·상태·인증 시각은 서버 전용).
create policy profiles_update on public.profiles for update using (id = auth.uid());
revoke insert, update on public.profiles from anon, authenticated;
grant update (nickname, dept, grade, interests, bio, auto_join)
  on public.profiles to authenticated;

create policy pool_select on public.match_pool for select using (user_id = auth.uid());
create policy pool_insert on public.match_pool for insert
  with check (user_id = auth.uid() and public.is_active_user());
create policy pool_delete on public.match_pool for delete using (user_id = auth.uid());

create policy matches_select on public.matches for select
  using (auth.uid() in (user_a, user_b));

create policy leftovers_select on public.match_leftovers for select
  using (user_id = auth.uid());

create policy messages_select on public.messages for select
  using (public.is_match_member(match_id));
create policy messages_insert on public.messages for insert
  with check (sender_id = auth.uid() and public.is_match_member(match_id));

create policy exchange_select_own on public.exchange_choices for select
  using (user_id = auth.uid());

create policy reports_insert on public.reports for insert
  with check (reporter_id = auth.uid());

create policy blocks_all on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy reviews_insert on public.reviews for insert
  with check (user_id = auth.uid() and public.is_match_member(match_id));
create policy reviews_select on public.reviews for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 메시지 규칙: 한도·만료·연락처 가림
-- ---------------------------------------------------------------------------
create or replace function private.enforce_message_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_match public.matches;
  v_sent  int;
begin
  select * into v_match from public.matches where id = new.match_id;

  if v_match.status <> 'active' or now() > v_match.expires_at then
    raise exception 'CHAT_CLOSED';
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = v_match.user_a and b.blocked_id = v_match.user_b)
       or (b.blocker_id = v_match.user_b and b.blocked_id = v_match.user_a)
  ) then
    raise exception 'CHAT_CLOSED';
  end if;

  select count(*) into v_sent
  from public.messages
  where match_id = new.match_id and sender_id = new.sender_id;

  if v_sent >= private.setting_int('message_limit_per_user') then
    raise exception 'MESSAGE_LIMIT_REACHED';
  end if;

  -- 교환 전에는 전화번호·카톡 ID로 보이는 패턴을 가린다
  if new.body ~ '01[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}' then
    new.body := regexp_replace(new.body, '01[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}', '***', 'g');
    new.masked := true;
  end if;
  if new.body ~* '(카톡|카카오|kakao|katalk|오픈채팅|open\.kakao)' then
    new.body := regexp_replace(new.body, '(open\.kakao\.com/\S+)', '***', 'gi');
    new.masked := true;
  end if;

  return new;
end;
$$;

create trigger messages_rules
  before insert on public.messages
  for each row execute function private.enforce_message_rules();

-- ---------------------------------------------------------------------------
-- 매일 매칭 (pg_cron으로 매일 11:50 KST 실행 → 정오 발표)
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
    p.user_id, p.purpose, p.same_gender_only, pr.gender, pr.interests,
    exists (
      select 1 from public.match_leftovers l
      where l.user_id = p.user_id and l.match_date = p_date - 1
    ) as waited,
    false as done
  from public.match_pool p
  join public.profiles pr on pr.id = p.user_id and pr.status = 'active'
  where p.match_date = p_date;

  -- 전날 짝이 없던 사람부터, 나머지는 무작위 순서로
  for v_me in
    select * from tmp_pool order by waited desc, random()
  loop
    continue when (select done from tmp_pool where user_id = v_me.user_id);

    select c.user_id into v_partner
    from tmp_pool c
    where not c.done
      and c.user_id <> v_me.user_id
      -- "같은 성별만"은 양쪽 모두 존중
      and (not v_me.same_gender_only or c.gender = v_me.gender)
      and (not c.same_gender_only or c.gender = v_me.gender)
      -- 차단 관계 제외
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = v_me.user_id and b.blocked_id = c.user_id)
           or (b.blocker_id = c.user_id and b.blocked_id = v_me.user_id)
      )
      -- 과거에 만난 사람 제외
      and not exists (
        select 1 from public.matches m
        where ((m.user_a = v_me.user_id and m.user_b = c.user_id)
            or (m.user_a = c.user_id and m.user_b = v_me.user_id))
          and m.match_date > p_date - private.setting_int('rematch_cooldown_days')
      )
    order by
      (c.purpose = v_me.purpose) desc,                         -- 같은 목적 우선
      cardinality(array(select unnest(c.interests)
                        intersect select unnest(v_me.interests))) desc, -- 관심사 겹침
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

  -- 자동 참여 사용자는 다음날 풀에 미리 넣는다
  insert into public.match_pool (user_id, match_date, purpose, same_gender_only)
  select p.user_id, p_date + 1, p.purpose, p.same_gender_only
  from public.match_pool p
  join public.profiles pr on pr.id = p.user_id and pr.auto_join and pr.status = 'active'
  where p.match_date = p_date
  on conflict do nothing;

  -- 만료된 채팅 정리
  update public.matches set status = 'ended'
  where status = 'active' and expires_at < now();

  return v_pairs;
end;
$$;

revoke execute on function public.run_daily_matching(date) from public, anon, authenticated;

-- Supabase 대시보드에서 pg_cron 활성화 후 실행:
-- select cron.schedule('daily-matching', '50 2 * * *', $$select public.run_daily_matching()$$);
--   (02:50 UTC = 11:50 KST)

-- ---------------------------------------------------------------------------
-- 카카오톡 ID 교환
-- ---------------------------------------------------------------------------
-- 교환 버튼은 한도(내 메시지 20개) 도달 또는 만료 후에 열린다.
-- 둘 다 accepted = true일 때만 상대 카카오톡 ID를 돌려준다.
-- 한쪽만 거절하면 상대는 "아쉽게도 연결되지 않았어요"만 본다.
create or replace function public.choose_exchange(p_match_id uuid, p_accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_match   public.matches;
  v_partner uuid;
  v_sent    int;
begin
  select * into v_match from public.matches where id = p_match_id;
  if v_match is null or auth.uid() not in (v_match.user_a, v_match.user_b) then
    raise exception 'NOT_FOUND';
  end if;

  select count(*) into v_sent from public.messages
  where match_id = p_match_id and sender_id = auth.uid();

  if v_sent < private.setting_int('message_limit_per_user') and now() < v_match.expires_at then
    raise exception 'EXCHANGE_NOT_OPEN';
  end if;

  insert into public.exchange_choices (match_id, user_id, accepted)
  values (p_match_id, auth.uid(), p_accept)
  on conflict (match_id, user_id) do nothing;  -- 한 번 고르면 변경 불가

  return public.get_partner_contact(p_match_id);
end;
$$;

create or replace function public.get_partner_contact(p_match_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  v_match   public.matches;
  v_partner uuid;
  v_yes     int;
begin
  select * into v_match from public.matches where id = p_match_id;
  if v_match is null or auth.uid() not in (v_match.user_a, v_match.user_b) then
    return null;
  end if;

  select count(*) into v_yes from public.exchange_choices
  where match_id = p_match_id and accepted;

  if v_yes < 2 then
    return null;
  end if;

  v_partner := case when v_match.user_a = auth.uid() then v_match.user_b else v_match.user_a end;
  return (select kakao_id from private.contacts where user_id = v_partner);
end;
$$;

-- 본인 카카오톡 ID 저장·수정 (교환 직전 확인용)
create or replace function public.set_my_kakao_id(p_kakao_id text)
returns void language sql security definer set search_path = public as $$
  insert into private.contacts (user_id, kakao_id) values (auth.uid(), trim(p_kakao_id))
  on conflict (user_id) do update set kakao_id = excluded.kakao_id, updated_at = now();
$$;

create or replace function public.get_my_kakao_id()
returns text language sql stable security definer set search_path = public as $$
  select kakao_id from private.contacts where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 메인 화면 숫자 (성별 구분 없이 총합만)
-- ---------------------------------------------------------------------------
create or replace function public.public_stats()
returns table (today_applicants int, week_connections int, total_connections int)
language sql stable security definer set search_path = public as $$
  with conn as (
    select m.match_date
    from public.matches m
    join public.exchange_choices e on e.match_id = m.id and e.accepted
    group by m.id, m.match_date
    having count(*) = 2
  )
  select
    (select count(*)::int from public.match_pool
      where match_date = (now() at time zone 'Asia/Seoul')::date),
    (select count(*)::int from conn
      where match_date > (now() at time zone 'Asia/Seoul')::date - 7),
    (select count(*)::int from conn);
$$;

grant execute on function public.public_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 신고 누적 시 자동 정지 (서로 다른 신고자 3명)
-- ---------------------------------------------------------------------------
create or replace function private.auto_suspend()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct reporter_id) from public.reports
      where reported_id = new.reported_id) >= 3 then
    update public.profiles set status = 'suspended' where id = new.reported_id;
  end if;
  return new;
end;
$$;

create trigger reports_auto_suspend
  after insert on public.reports
  for each row execute function private.auto_suspend();

-- 실시간 채팅
alter publication supabase_realtime add table public.messages;
