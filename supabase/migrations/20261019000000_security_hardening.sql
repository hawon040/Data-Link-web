-- 보안·성능 점검 (Supabase Advisor 결과 반영)
--
--   1. 로그인하지 않은 사용자(anon)는 public_stats 외의 RPC를 호출할 수 없게 한다
--   2. private 헬퍼 함수의 search_path 고정
--   3. RLS 정책의 auth.uid()를 (select auth.uid())로 감싸 행마다 다시 계산하지 않게 한다 (동작은 같음)
--   4. 외래키 인덱스 추가 (신고·차단·메시지 조회와 계정 삭제 속도)

-- ---------------------------------------------------------------------------
-- 1. RPC 실행 권한
-- ---------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.apply_match(public.match_purpose)',
    'public.cancel_match()',
    'public.choose_exchange(uuid, boolean)',
    'public.get_my_kakao_id()',
    'public.get_partner_contact(uuid)',
    'public.is_active_user()',
    'public.is_match_member(uuid)',
    'public.my_blocks()',
    'public.my_status()',
    'public.set_my_kakao_id(text)',
    'public.was_leftover_today()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- 앞으로 만드는 함수도 기본으로 anon에게 열리지 않게 한다 (필요하면 마이그레이션에서 명시적으로 grant)
alter default privileges in schema public revoke execute on functions from public, anon;

-- ---------------------------------------------------------------------------
-- 2. search_path 고정
-- ---------------------------------------------------------------------------
alter function private.setting_int(text) set search_path = public;
alter function private.grade_ok(smallint, smallint) set search_path = public;

-- ---------------------------------------------------------------------------
-- 3. RLS 정책 (조건은 그대로, auth.uid() 호출만 한 번으로)
-- ---------------------------------------------------------------------------
alter policy profiles_select on public.profiles using (
  id = (select auth.uid())
  or exists (
    select 1 from public.matches m
    where (m.user_a = (select auth.uid()) and m.user_b = profiles.id)
       or (m.user_b = (select auth.uid()) and m.user_a = profiles.id)
  )
);
alter policy profiles_update on public.profiles using (id = (select auth.uid()));

alter policy pool_select on public.match_pool using (user_id = (select auth.uid()));
alter policy pool_delete on public.match_pool using (user_id = (select auth.uid()));

alter policy matches_select on public.matches
  using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

alter policy leftovers_select on public.match_leftovers using (user_id = (select auth.uid()));

alter policy messages_insert on public.messages
  with check (sender_id = (select auth.uid()) and public.is_match_member(match_id));

alter policy exchange_select_own on public.exchange_choices using (user_id = (select auth.uid()));

alter policy reports_insert on public.reports with check (reporter_id = (select auth.uid()));

alter policy blocks_all on public.blocks
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

alter policy reviews_select on public.reviews using (user_id = (select auth.uid()));
alter policy reviews_insert on public.reviews
  with check (user_id = (select auth.uid()) and public.is_match_member(match_id));

-- ---------------------------------------------------------------------------
-- 4. 외래키 인덱스
-- ---------------------------------------------------------------------------
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
create index if not exists exchange_choices_user_idx on public.exchange_choices (user_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists reports_match_idx on public.reports (match_id);
create index if not exists reports_reported_idx on public.reports (reported_id, created_at);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reviews_user_idx on public.reviews (user_id);
