-- 운영자 권한 · 신고 처리 · 공지
--
--   * 운영자는 별도 로그인이 아니라 일반 계정에 권한을 붙이는 방식 (private.admin_grants)
--   * 권한 종류
--       reports  신고 목록과 신고된 대화 기록 열람
--       suspend  이용 정지·해제
--       avatars  프로필 사진 삭제
--       notices  공지 작성·삭제
--       admins   운영자 권한 부여·회수
--   * 운영자도 실명·학번·전화번호·생년월일·카카오톡 ID는 볼 수 없다 (닉네임·학과·학년만)
--   * 대화 기록은 신고가 접수된 대화만 열 수 있고, 열람·처리는 모두 private.admin_log에 남는다
--   * 클라이언트는 테이블을 직접 다루지 않고 아래 security definer 함수로만 접근한다
--
-- 첫 운영자 지정 (SQL Editor에서, 가입을 마친 계정의 로그인 이메일로):
--   select private.bootstrap_admin('운영자@이메일');

-- ---------------------------------------------------------------------------
-- 신고 사유: 부적절한 프로필 사진
-- ---------------------------------------------------------------------------
alter type public.report_reason add value if not exists 'photo';

-- ---------------------------------------------------------------------------
-- 권한과 기록
-- ---------------------------------------------------------------------------
create table private.admin_grants (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  permission text not null check (permission in ('reports', 'suspend', 'avatars', 'notices', 'admins')),
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, permission)
);

create table private.admin_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  target_id  uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
create index admin_log_created_idx on private.admin_log (created_at desc);

create or replace function private.has_admin_perm(p_perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from private.admin_grants g
      join public.profiles p on p.id = g.user_id and p.status = 'active'
     where g.user_id = (select auth.uid()) and g.permission = p_perm
  );
$$;

create or replace function private.require_admin_perm(p_perm text)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_admin_perm(p_perm) then
    raise exception 'FORBIDDEN';
  end if;
end;
$$;

create or replace function private.admin_log_add(p_action text, p_target uuid, p_detail jsonb default null)
returns void language sql security definer set search_path = '' as $$
  insert into private.admin_log (actor_id, action, target_id, detail)
  values ((select auth.uid()), p_action, p_target, p_detail);
$$;

revoke execute on function private.has_admin_perm(text) from public, anon, authenticated;
revoke execute on function private.require_admin_perm(text) from public, anon, authenticated;
revoke execute on function private.admin_log_add(text, uuid, jsonb) from public, anon, authenticated;

-- 첫 운영자 (SQL Editor 전용)
create or replace function private.bootstrap_admin(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select u.id into v_id from auth.users u join public.profiles p on p.id = u.id where lower(u.email) = lower(p_email);
  if v_id is null then
    raise exception 'no profile for %', p_email;
  end if;
  insert into private.admin_grants (user_id, permission)
  select v_id, perm from unnest(array['reports', 'suspend', 'avatars', 'notices', 'admins']) perm
  on conflict do nothing;
end;
$$;
revoke execute on function private.bootstrap_admin(text) from public, anon, authenticated;

-- 내 운영자 권한 (화면에서 메뉴를 보여줄지 결정. 실제 검사는 각 함수에서 다시 한다)
create or replace function public.my_admin_permissions()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(g.permission order by g.permission), '{}')
    from private.admin_grants g
    join public.profiles p on p.id = g.user_id and p.status = 'active'
   where g.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 신고 (reports)
-- ---------------------------------------------------------------------------
create or replace function public.admin_reports(p_limit int default 100)
returns table (
  id bigint, created_at timestamptz, reason public.report_reason, detail text, match_id uuid,
  reporter_id uuid, reporter_nickname text,
  reported_id uuid, reported_nickname text, reported_status text, reported_count bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  perform private.require_admin_perm('reports');
  return query
  select r.id, r.created_at, r.reason, r.detail, r.match_id,
         r.reporter_id, coalesce(a.nickname, '(탈퇴)'),
         r.reported_id, coalesce(b.nickname, '(탈퇴)'), b.status::text,
         (select count(distinct r2.reporter_id) from public.reports r2 where r2.reported_id = r.reported_id)
    from public.reports r
    join public.profiles a on a.id = r.reporter_id
    join public.profiles b on b.id = r.reported_id
   order by r.created_at desc
   limit least(greatest(p_limit, 1), 500);
end;
$$;

-- 신고된 대화만 열람할 수 있다. 열람은 기록된다
create or replace function public.admin_match_messages(p_match_id uuid)
returns table (id bigint, sender_id uuid, sender_nickname text, body text, masked boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform private.require_admin_perm('reports');
  if not exists (select 1 from public.reports where match_id = p_match_id) then
    raise exception 'NOT_REPORTED';
  end if;
  perform private.admin_log_add('view_messages', null, jsonb_build_object('match_id', p_match_id));
  return query
  select m.id, m.sender_id, coalesce(p.nickname, '(탈퇴)'), m.body, m.masked, m.created_at
    from public.messages m
    join public.profiles p on p.id = m.sender_id
   where m.match_id = p_match_id
   order by m.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 회원 조회 · 정지 (suspend) · 사진 삭제 (avatars)
-- ---------------------------------------------------------------------------
create or replace function public.admin_find_users(p_query text)
returns table (id uuid, nickname text, dept text, grade smallint, status text, created_at timestamptz,
               has_avatar boolean, reported_count bigint, permissions text[])
language plpgsql stable security definer set search_path = public as $$
begin
  if not (private.has_admin_perm('suspend') or private.has_admin_perm('avatars') or private.has_admin_perm('admins')) then
    raise exception 'FORBIDDEN';
  end if;
  return query
  select p.id, p.nickname, p.dept, p.grade, p.status::text, p.created_at,
         p.avatar_updated_at is not null,
         (select count(distinct r.reporter_id) from public.reports r where r.reported_id = p.id),
         coalesce((select array_agg(g.permission order by g.permission) from private.admin_grants g where g.user_id = p.id), '{}')
    from public.profiles p
   where p.id::text = lower(trim(p_query))   -- 신고 화면에서 넘어온 회원 id
      or (char_length(trim(p_query)) >= 1 and p.nickname ilike '%' || trim(p_query) || '%')
   order by p.created_at desc
   limit 30;
end;
$$;

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspend boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_status text;
begin
  perform private.require_admin_perm('suspend');
  if p_user_id = (select auth.uid()) then
    raise exception 'CANNOT_TARGET_SELF';
  end if;
  select status::text into v_status from public.profiles where id = p_user_id for update;
  if v_status is null then
    raise exception 'NOT_FOUND';
  end if;

  if p_suspend then
    if v_status <> 'active' then raise exception 'NOT_ACTIVE'; end if;
    update public.profiles set status = 'suspended' where id = p_user_id;
    delete from public.match_pool where user_id = p_user_id;
    update public.matches
       set status = 'ended', expires_at = least(expires_at, now())
     where status = 'active' and p_user_id in (user_a, user_b);
  else
    if v_status <> 'suspended' then raise exception 'NOT_SUSPENDED'; end if;
    -- 정지 중에 탈퇴했다면 탈퇴 상태로 돌린다
    update public.profiles
       set status = case when withdrawn_at is null then 'active' else 'withdrawn' end::public.user_status
     where id = p_user_id;
  end if;

  perform private.admin_log_add(case when p_suspend then 'suspend' else 'unsuspend' end, p_user_id,
                                jsonb_build_object('note', left(p_note, 500)));
end;
$$;

-- 표시를 끊는다. 파일은 서버(service role)가 이어서 지운다
create or replace function public.admin_clear_avatar(p_user_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.require_admin_perm('avatars');
  update public.profiles set avatar_updated_at = null where id = p_user_id;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  perform private.admin_log_add('clear_avatar', p_user_id, jsonb_build_object('note', left(p_note, 500)));
end;
$$;

-- ---------------------------------------------------------------------------
-- 운영자 권한 관리 (admins)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_permission(p_user_id uuid, p_perm text, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.require_admin_perm('admins');
  -- 마지막 권한 관리자가 스스로 권한을 지워 아무도 관리할 수 없게 되는 것을 막는다
  if not p_on and p_perm = 'admins' and p_user_id = (select auth.uid()) then
    raise exception 'CANNOT_TARGET_SELF';
  end if;
  if p_on then
    if not exists (select 1 from public.profiles where id = p_user_id and status = 'active') then
      raise exception 'NOT_ACTIVE';
    end if;
    insert into private.admin_grants (user_id, permission, granted_by)
    values (p_user_id, p_perm, (select auth.uid()))
    on conflict do nothing;
  else
    delete from private.admin_grants where user_id = p_user_id and permission = p_perm;
  end if;
  perform private.admin_log_add(case when p_on then 'grant' else 'revoke' end, p_user_id,
                                jsonb_build_object('permission', p_perm));
end;
$$;

create or replace function public.admin_recent_log(p_limit int default 50)
returns table (id bigint, created_at timestamptz, actor_nickname text, action text, target_id uuid,
               target_nickname text, detail jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  perform private.require_admin_perm('admins');
  return query
  select l.id, l.created_at, a.nickname, l.action, l.target_id, t.nickname, l.detail
    from private.admin_log l
    left join public.profiles a on a.id = l.actor_id
    left join public.profiles t on t.id = l.target_id
   order by l.created_at desc
   limit least(greatest(p_limit, 1), 200);
end;
$$;

-- ---------------------------------------------------------------------------
-- 공지 (notices)
-- ---------------------------------------------------------------------------
create table public.notices (
  id         bigint generated always as identity primary key,
  title      text not null check (char_length(title) between 1 and 60),
  body       text not null check (char_length(body) between 1 and 2000),
  pinned     boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notices_list_idx on public.notices (pinned desc, created_at desc);

alter table public.notices enable row level security;
-- 누구나 읽기 (로그인 전 화면에서도 안내용으로 쓴다). 쓰기는 아래 함수로만
create policy notices_select on public.notices for select using (true);
revoke insert, update, delete on public.notices from anon, authenticated;

create or replace function public.admin_save_notice(p_id bigint, p_title text, p_body text, p_pinned boolean)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  perform private.require_admin_perm('notices');
  if p_id is null then
    insert into public.notices (title, body, pinned, created_by)
    values (trim(p_title), trim(p_body), p_pinned, (select auth.uid()))
    returning id into v_id;
  else
    update public.notices
       set title = trim(p_title), body = trim(p_body), pinned = p_pinned, updated_at = now()
     where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'NOT_FOUND'; end if;
  end if;
  perform private.admin_log_add('save_notice', null, jsonb_build_object('notice_id', v_id));
  return v_id;
end;
$$;

create or replace function public.admin_delete_notice(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform private.require_admin_perm('notices');
  delete from public.notices where id = p_id;
  perform private.admin_log_add('delete_notice', null, jsonb_build_object('notice_id', p_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- 실행 권한: 로그인한 사용자만 (권한 검사는 함수 안에서)
-- ---------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.my_admin_permissions()',
    'public.admin_reports(int)',
    'public.admin_match_messages(uuid)',
    'public.admin_find_users(text)',
    'public.admin_set_suspended(uuid, boolean, text)',
    'public.admin_clear_avatar(uuid, text)',
    'public.admin_set_permission(uuid, text, boolean)',
    'public.admin_recent_log(int)',
    'public.admin_save_notice(bigint, text, text, boolean)',
    'public.admin_delete_notice(bigint)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
