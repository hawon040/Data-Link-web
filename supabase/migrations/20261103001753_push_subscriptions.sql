-- 푸시 구독 테이블 (첫 버전)
-- (DB에 먼저 적용된 마이그레이션을 그대로 옮겨 적은 파일.
--  클라이언트 직접 쓰기 정책은 20261103100000_noon_push 에서 RPC 방식으로 바뀐다)

create table public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy push_select on public.push_subscriptions for select
  using (user_id = auth.uid());
create policy push_insert on public.push_subscriptions for insert
  with check (user_id = auth.uid());
create policy push_update on public.push_subscriptions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_delete on public.push_subscriptions for delete
  using (user_id = auth.uid());

revoke all on public.push_subscriptions from anon;
