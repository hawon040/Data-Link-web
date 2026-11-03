import { redirect } from "next/navigation";
import type { AdminPermission } from "@/lib/labels";
import { requireActive } from "@/lib/session";

// 운영자 화면 입구. 권한이 없으면 내 정보로 돌려보낸다
// (화면을 숨기는 용도일 뿐, 실제 권한 검사는 DB 함수 admin_* 안에서 한다)
export async function requireAdmin(perm?: AdminPermission) {
  const { supabase, user } = await requireActive();
  const { data } = await supabase.rpc("my_admin_permissions");
  const perms = (data as AdminPermission[] | null) ?? [];
  if (!perms.length || (perm && !perms.includes(perm))) redirect("/me");
  return { supabase, user, perms };
}

