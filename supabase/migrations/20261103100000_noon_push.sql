-- 정오 매칭 발표 알림 (Web Push)
--
--   * 시간은 DB가 관리한다: 11:50 run_daily_matching() → 12:00 private.trigger_noon_push()
--   * trigger_noon_push()는 pg_net으로 앱 서버 /api/push/noon 을 호출하고,
--     서버가 VAPID 키로 푸시를 암호화해 보낸다 (Web Push 암호화는 SQL로 할 수 없음)
--   * 매칭 결과는 발표 시각(정오) 전에는 당사자에게도 보이지 않는다
--   * 알림 문구에는 상대 정보를 넣지 않는다 (잠금 화면 노출 방지)
--
-- 설정 (README 참고):
--   select vault.create_secret('https://<배포 주소>', 'app_url');
--   select vault.create_secret('<PUSH_CRON_SECRET과 같은 값>', 'push_cron_secret');
--   select cron.schedule('noon-push', '0 3 * * *', $$select private.trigger_noon_push()$$);  -- 03:00 UTC = 12:00 KST

create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- 카카오톡 ID 암호화 보강 (20261103001749)
--   * 키가 없으면 null 로 암호화되지 않게 바로 실패
--   * 새로 저장하는 값은 AES-256 (기존 값도 pgp_sym_decrypt 로 그대로 읽힘)
-- ---------------------------------------------------------------------------
create or replace function private.kakao_key()
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'kakao_id_key';
  if v_key is null then
    raise exception 'kakao_id_key missing in vault';
  end if;
  return v_key;
end;
$$;

create or replace function private.encrypt_kakao(p_plain text)
returns bytea language sql volatile security definer set search_path = '' as $$
  select extensions.pgp_sym_encrypt(p_plain, private.kakao_key(), 'cipher-algo=aes256')
$$;

revoke execute on function private.kakao_key() from public, anon, authenticated;
revoke execute on function private.encrypt_kakao(text) from public, anon, authenticated;

insert into private.settings (key, value) values
  ('announce_hour_kst', '12')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 발표 시각 게이트
-- ---------------------------------------------------------------------------
create or replace function public.match_announced(p_date date)
returns boolean language sql stable security definer set search_path = public as $$
  select p_date < (now() at time zone 'Asia/Seoul')::date
      or (p_date = (now() at time zone 'Asia/Seoul')::date
          and extract(hour from now() at time zone 'Asia/Seoul') >= private.setting_int('announce_hour_kst'));
$$;

drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select
  using ((select auth.uid()) in (user_a, user_b) and public.match_announced(match_date));

drop policy if exists leftovers_select on public.match_leftovers;
create policy leftovers_select on public.match_leftovers for select
  using (user_id = (select auth.uid()) and public.match_announced(match_date));

create or replace function public.was_leftover_today()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.match_leftovers
    where user_id = auth.uid()
      and match_date = (now() at time zone 'Asia/Seoul')::date
      and public.match_announced(match_date)
  );
$$;

-- 대화방도 발표 전에는 열리지 않게 (매칭 id를 알아내더라도)
create or replace function public.is_match_member(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches
    where id = p_match_id
      and auth.uid() in (user_a, user_b)
      and public.match_announced(match_date)
  );
$$;

-- ---------------------------------------------------------------------------
-- 푸시 구독 (브라우저마다 하나, 사용자는 RPC로만 등록·해제)
-- ---------------------------------------------------------------------------
-- 테이블은 20261103001753 에서 만들었다. 클라이언트 직접 읽기·쓰기 정책을 없애고 RPC로만 다룬다
drop policy if exists push_select on public.push_subscriptions;
drop policy if exists push_insert on public.push_subscriptions;
drop policy if exists push_update on public.push_subscriptions;
drop policy if exists push_delete on public.push_subscriptions;
revoke all on public.push_subscriptions from anon, authenticated;

alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_https check (endpoint like 'https://%');
-- 정책 없음: 클라이언트는 직접 읽거나 쓸 수 없다

-- 같은 브라우저에서 다른 계정으로 로그인하면 구독 주인이 바뀐다
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
revoke execute on function public.delete_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 발송 대상 (서버 /api/push/noon 이 service_role 로만 호출)
-- ---------------------------------------------------------------------------
create table private.push_runs (
  run_date date not null,
  kind     text not null,
  ran_at   timestamptz not null default now(),
  primary key (run_date, kind)
);

-- 같은 날 두 번 보내지 않도록 먼저 기록한다. 처음이면 true
create or replace function public.claim_push_run(p_date date, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into private.push_runs (run_date, kind) values (p_date, p_kind);
  return true;
exception when unique_violation then
  return false;
end;
$$;

-- kind: matched (오늘 짝이 생김) | leftover (짝이 없어 내일 우선 매칭)
create or replace function public.noon_push_targets(p_date date)
returns table (endpoint text, p256dh text, auth text, kind text)
language sql stable security definer set search_path = public as $$
  with t as (
    select m.user_a as user_id, 'matched' as kind from public.matches m where m.match_date = p_date
    union
    select m.user_b, 'matched' from public.matches m where m.match_date = p_date
    union
    select l.user_id, 'leftover' from public.match_leftovers l where l.match_date = p_date
  )
  select s.endpoint, s.p256dh, s.auth, t.kind
  from t
  join public.profiles p on p.id = t.user_id and p.status = 'active'
  join public.push_subscriptions s on s.user_id = t.user_id;
$$;

-- 만료된 구독 정리 (푸시 서비스가 404/410을 돌려준 endpoint)
create or replace function public.drop_push_subscriptions(p_endpoints text[])
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = any (p_endpoints);
$$;

revoke execute on function public.claim_push_run(date, text) from public, anon, authenticated;
revoke execute on function public.noon_push_targets(date) from public, anon, authenticated;
revoke execute on function public.drop_push_subscriptions(text[]) from public, anon, authenticated;
grant execute on function public.claim_push_run(date, text) to service_role;
grant execute on function public.noon_push_targets(date) to service_role;
grant execute on function public.drop_push_subscriptions(text[]) to service_role;

-- ---------------------------------------------------------------------------
-- 정오 발송 호출 (pg_cron)
-- ---------------------------------------------------------------------------
create or replace function private.trigger_noon_push()
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'app_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_cron_secret';
  if v_url is null or v_secret is null then
    raise exception 'vault secrets app_url / push_cron_secret missing';
  end if;

  return net.http_post(
    url := rtrim(v_url, '/') || '/api/push/noon',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body := jsonb_build_object('date', (now() at time zone 'Asia/Seoul')::date),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function private.trigger_noon_push() from public, anon, authenticated;
