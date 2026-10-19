import type { SupabaseClient } from "@supabase/supabase-js";

// 프로필 사진: 비공개 버킷 avatars/{user_id}/avatar 한 장 (supabase/migrations/20261019030000_avatars.sql)
// 본인과 카카오톡 ID 교환이 성사된 상대만 볼 수 있다 (DB 정책으로 강제)
export const AVATAR_BUCKET = "avatars";
export const avatarPath = (userId: string) => `${userId}/avatar`;

// 서명된 주소(1시간)를 만든다. 볼 권한이 없거나 사진이 없으면 null
export async function avatarUrl(supabase: SupabaseClient, userId: string, updatedAt: string | null | undefined) {
  if (!updatedAt) return null;
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath(userId), 3600);
  if (!data?.signedUrl) return null;
  return `${data.signedUrl}&v=${new Date(updatedAt).getTime()}`;
}
