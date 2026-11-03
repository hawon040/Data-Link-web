-- Supabase Advisor 점검 반영 (20261103100000_noon_push 적용 후)
--
--   1. match_announced: 로그인 전(anon)에는 호출할 수 없게 (RLS 정책에서 쓰므로 authenticated는 유지)
--   2. pg_net 확장을 public 스키마에서 extensions 스키마로
--      (SET SCHEMA를 지원하지 않아 다시 설치. 함수는 계속 net.http_post 로 쓴다.
--       아직 pg_net을 쓰는 cron이 없을 때 적용할 것)

revoke execute on function public.match_announced(date) from public, anon;
grant execute on function public.match_announced(date) to authenticated;

drop extension if exists pg_net;
create extension pg_net with schema extensions;

-- 3. 외래키 인덱스 (운영자 기록·공지 작성자, 계정 삭제 시 on delete set null 속도)
create index if not exists admin_grants_granted_by_idx on private.admin_grants (granted_by);
create index if not exists admin_log_actor_idx on private.admin_log (actor_id);
create index if not exists notices_created_by_idx on public.notices (created_by);
