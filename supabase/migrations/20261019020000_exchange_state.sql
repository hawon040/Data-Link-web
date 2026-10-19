-- 카카오톡 ID 교환 진행 상태 (교환 화면이 어떤 화면을 보여줄지)
--   not_open : 아직 교환을 고를 수 없음 (내 메시지 20개 전이고 24시간 전)
--   choose   : 고를 수 있음
--   waiting  : 나는 교환을 골랐고 상대 선택을 기다리는 중
--   mutual   : 둘 다 교환 → ID 공개
--   closed   : 내가 거절했거나, 상대가 거절했거나, 대화 종료 24시간 안에 상대가 고르지 않음
-- 상대가 거절했는지와 시간이 지났는지는 구분해서 알려주지 않는다 (둘 다 closed).

insert into private.settings (key, value) values ('exchange_wait_hours', '24')
on conflict (key) do nothing;

create or replace function public.my_exchange_state(p_match_id uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  v_me      uuid := (select auth.uid());
  v_match   public.matches;
  v_partner uuid;
  v_mine    boolean;
  v_theirs  boolean;
  v_sent    int;
begin
  select * into v_match from public.matches where id = p_match_id;
  if v_match.id is null or v_me is null or v_me not in (v_match.user_a, v_match.user_b) then
    return 'not_found';
  end if;
  v_partner := case when v_match.user_a = v_me then v_match.user_b else v_match.user_a end;

  select accepted into v_mine from public.exchange_choices where match_id = p_match_id and user_id = v_me;
  select accepted into v_theirs from public.exchange_choices where match_id = p_match_id and user_id = v_partner;

  if v_mine is null then
    select count(*) into v_sent from public.messages where match_id = p_match_id and sender_id = v_me;
    if v_sent < private.setting_int('message_limit_per_user') and now() < v_match.expires_at then
      return 'not_open';
    end if;
    return 'choose';
  end if;

  if not v_mine or v_theirs is false then
    return 'closed';
  end if;
  if v_theirs then
    return 'mutual';
  end if;
  if now() > v_match.expires_at + make_interval(hours => private.setting_int('exchange_wait_hours')) then
    return 'closed';
  end if;
  return 'waiting';
end;
$$;

revoke execute on function public.my_exchange_state(uuid) from public, anon;
grant execute on function public.my_exchange_state(uuid) to authenticated;
