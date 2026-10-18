-- 회원 탈퇴 · 보관 기간 정리 · 약관 동의 기록
--
--   * 탈퇴 즉시: 카카오톡 ID·매칭 신청 삭제, 프로필 소개 정보 비움, 진행 중 대화 종료
--   * 탈퇴 30일 뒤: 계정 완전 삭제 (그 전까지는 같은 휴대폰으로 재가입 불가 → 신고 회피 방지)
--   * 채팅: 대화 종료 30일 뒤 삭제. 신고된 대화는 검토를 위해 365일 보관
--   * 정지된 계정과 신고 대상 계정은 탈퇴해도 보관 기간 동안 지우지 않는다
--
-- 정리 작업은 pg_cron으로 매일 실행 (README 참고):
--   select cron.schedule('daily-cleanup', '0 19 * * *', $$select private.daily_cleanup()$$);  -- 04:00 KST

alter type public.user_status add value if not exists 'withdrawn';

alter table public.profiles
  add column if not exists withdrawn_at    timestamptz,
  add column if not exists terms_agreed_at timestamptz;

insert into private.settings (key, value) values
  ('chat_retention_days', '30'),
  ('withdraw_grace_days', '30'),
  ('report_retention_days', '365')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 탈퇴
-- ---------------------------------------------------------------------------
create or replace function public.withdraw_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not signed in';
  end if;

  -- 카카오톡 ID는 즉시 파기
  delete from private.contacts where user_id = v_me;
  delete from public.match_pool where user_id = v_me;

  -- 진행 중인 대화는 바로 끝낸다
  update public.matches
     set status = 'ended', expires_at = least(expires_at, now())
   where status = 'active' and v_me in (user_a, user_b);

  -- 상대 화면에 남는 소개 정보를 비운다. 정지 상태는 유지 (재가입 차단용)
  update public.profiles
     set nickname = null, bio = null, interests = '{}', auto_join = false,
         withdrawn_at = now(),
         status = case when status::text = 'suspended' then status else 'withdrawn'::public.user_status end
   where id = v_me;
end;
$$;

revoke execute on function public.withdraw_account() from public, anon;
grant execute on function public.withdraw_account() to authenticated;

-- 가입 단계 확인: 탈퇴한 계정 상태 추가
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

-- ---------------------------------------------------------------------------
-- 매일 정리 (pg_cron)
-- ---------------------------------------------------------------------------
create or replace function private.daily_cleanup()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_chat_days   int := private.setting_int('chat_retention_days');
  v_grace_days  int := private.setting_int('withdraw_grace_days');
  v_report_days int := private.setting_int('report_retention_days');
  v_messages    int;
  v_reported    int;
  v_accounts    int;
begin
  -- 1) 신고 없는 대화: 종료 30일 뒤 메시지 삭제
  delete from public.messages msg
   using public.matches m
   where msg.match_id = m.id
     and m.expires_at < now() - make_interval(days => v_chat_days)
     and not exists (select 1 from public.reports r where r.match_id = m.id);
  get diagnostics v_messages = row_count;

  -- 2) 신고된 대화: 365일 뒤 삭제
  delete from public.messages msg
   using public.matches m
   where msg.match_id = m.id
     and m.expires_at < now() - make_interval(days => v_report_days);
  get diagnostics v_reported = row_count;

  -- 3) 탈퇴 30일이 지난 계정 삭제 (프로필·인증·대화 기록이 함께 지워짐)
  --    최근 365일 안에 신고를 받은 계정은 검토를 위해 남긴다
  delete from auth.users u
   using public.profiles p
   where p.id = u.id
     and p.status::text = 'withdrawn'
     and p.withdrawn_at < now() - make_interval(days => v_grace_days)
     and not exists (
       select 1 from public.reports r
        where r.reported_id = p.id
          and r.created_at > now() - make_interval(days => v_report_days)
     );
  get diagnostics v_accounts = row_count;

  return jsonb_build_object('messages', v_messages, 'reported_messages', v_reported, 'accounts', v_accounts);
end;
$$;

revoke execute on function private.daily_cleanup() from public, anon, authenticated;
