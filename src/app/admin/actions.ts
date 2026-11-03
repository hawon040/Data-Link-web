"use server";

import { createClient as createAdmin } from "@supabase/supabase-js";
import { AVATAR_BUCKET, avatarPath } from "@/lib/avatar";
import { adminErrorMessage } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

// 프로필 사진 삭제: 권한 검사와 기록은 DB 함수(admin_clear_avatar)가 하고,
// 통과하면 남의 폴더 파일이라 service role 로 지운다
export async function clearAvatar(userId: string, note: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_clear_avatar", { p_user_id: userId, p_note: note || null });
  if (error) return { error: adminErrorMessage(error.message) };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: "사진 표시는 막았지만 파일은 지우지 못했어요. (SUPABASE_SERVICE_ROLE_KEY 없음)" };
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: removeError } = await admin.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)]);
  if (removeError) return { error: "사진 표시는 막았지만 파일은 지우지 못했어요. 다시 시도해 주세요." };
  return { error: null };
}
