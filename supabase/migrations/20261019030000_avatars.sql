-- 프로필 사진
--   * 비공개 버킷 avatars, 경로는 {user_id}/avatar.webp 한 장 (최대 1MB, 앱에서 512px로 줄여 올림)
--   * 보는 사람: 본인 + 카카오톡 ID 교환에 둘 다 동의한 상대 (익명 대화 중에는 안 보임)
--   * 탈퇴하면 표시를 끊고(avatar_updated_at = null), 앱이 탈퇴 직전에 파일을 지운다

alter table public.profiles add column if not exists avatar_updated_at timestamptz;
grant update (avatar_updated_at) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 이 사람의 사진을 내가 볼 수 있는가
create or replace function public.can_view_avatar(p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner = (select auth.uid())
      or exists (
        select 1
          from public.matches m
         where ((m.user_a = (select auth.uid()) and m.user_b = p_owner)
             or (m.user_b = (select auth.uid()) and m.user_a = p_owner))
           and (select count(*) from public.exchange_choices e where e.match_id = m.id and e.accepted) = 2
      );
$$;
revoke execute on function public.can_view_avatar(uuid) from public, anon;
grant execute on function public.can_view_avatar(uuid) to authenticated;

-- 본인 폴더에만 올리고 바꾸고 지울 수 있다
create policy avatars_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 읽기: 본인 또는 교환이 성사된 상대
create policy avatars_read on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
    and public.can_view_avatar(((storage.foldername(name))[1])::uuid)
  );

-- 탈퇴하면 사진 표시를 끊는다
create or replace function private.clear_avatar_on_withdraw()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.withdrawn_at is not null and old.withdrawn_at is null then
    new.avatar_updated_at := null;
  end if;
  return new;
end;
$$;
create trigger profiles_clear_avatar_on_withdraw
  before update of withdrawn_at on public.profiles
  for each row execute function private.clear_avatar_on_withdraw();
