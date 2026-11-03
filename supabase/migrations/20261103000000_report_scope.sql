-- 신고·메시지 가림 보완
--   * 신고는 같은 매칭의 상대만 가능 (가짜 신고 3건으로 남을 정지시키는 것 방지)
--   * '카톡' 단어만 있고 실제로 가린 내용이 없으면 masked 표시를 붙이지 않음

alter policy reports_insert on public.reports
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.matches m
      where m.id = reports.match_id
        and ((m.user_a = (select auth.uid()) and m.user_b = reports.reported_id)
          or (m.user_b = (select auth.uid()) and m.user_a = reports.reported_id))
    )
  );

create or replace function private.enforce_message_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_match public.matches;
  v_sent  int;
  v_body  text;
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

  -- 교환 전에는 전화번호·오픈채팅 링크를 가린다
  v_body := regexp_replace(new.body, '01[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}', '***', 'g');
  v_body := regexp_replace(v_body, 'open\.kakao\.com/\S+', '***', 'gi');
  if v_body <> new.body then
    new.body := v_body;
    new.masked := true;
  end if;

  return new;
end;
$$;
