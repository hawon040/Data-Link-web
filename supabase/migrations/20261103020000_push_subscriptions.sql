-- Web Push 구독 (정오 매칭 발표 알림)
--   * 브라우저가 알림을 허용하면 구독 정보를 저장한다 (기기마다 1행)
--   * 발송은 서버(/api/push/daily, service_role)만 한다

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
