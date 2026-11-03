-- 카카오톡 ID 암호화 저장 (Vault 키 + pgp_sym_encrypt)
-- (DB에 먼저 적용된 마이그레이션을 그대로 옮겨 적은 파일. 보강은 20261103100000_noon_push)

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'kakao_id_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'base64'),
      'kakao_id_key',
      '카카오톡 ID 암호화 키 (private.contacts.kakao_id_enc)'
    );
  end if;
end;
$$;

create or replace function private.kakao_key()
returns text language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'kakao_id_key'
$$;
revoke execute on function private.kakao_key() from public, anon, authenticated;

create or replace function private.encrypt_kakao(p_plain text)
returns bytea language sql stable security definer set search_path = '' as $$
  select extensions.pgp_sym_encrypt(p_plain, private.kakao_key())
$$;

create or replace function private.decrypt_kakao(p_enc bytea)
returns text language sql stable security definer set search_path = '' as $$
  select case when p_enc is null then null
              else extensions.pgp_sym_decrypt(p_enc, private.kakao_key()) end
$$;
revoke execute on function private.encrypt_kakao(text), private.decrypt_kakao(bytea)
  from public, anon, authenticated;

alter table private.contacts add column kakao_id_enc bytea;
update private.contacts set kakao_id_enc = private.encrypt_kakao(kakao_id);
alter table private.contacts alter column kakao_id_enc set not null;
alter table private.contacts drop column kakao_id;

create or replace function public.set_my_kakao_id(p_kakao_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id text := trim(p_kakao_id);
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if v_id is null or char_length(v_id) not between 2 and 40 then
    raise exception 'INVALID_KAKAO_ID';
  end if;
  insert into private.contacts (user_id, kakao_id_enc) values (auth.uid(), private.encrypt_kakao(v_id))
  on conflict (user_id) do update set kakao_id_enc = excluded.kakao_id_enc, updated_at = now();
  perform private.try_activate(auth.uid());
end;
$$;

create or replace function public.get_my_kakao_id()
returns text language sql stable security definer set search_path = public as $$
  select private.decrypt_kakao(kakao_id_enc) from private.contacts where user_id = auth.uid();
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
  return (select private.decrypt_kakao(kakao_id_enc) from private.contacts where user_id = v_partner);
end;
$$;
