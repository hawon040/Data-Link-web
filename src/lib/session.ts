import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type Status =
  | "signed_out"
  | "need_identity"
  | "need_profile"
  | "need_kakao"
  | "suspended"
  | "active";

const NEXT_STEP: Record<Exclude<Status, "active">, string> = {
  signed_out: "/",
  need_identity: "/signup/phone",
  need_profile: "/signup/profile",
  need_kakao: "/signup/kakao",
  suspended: "/me/privacy",
};

// 가입이 끝난 사용자만 통과. 아니면 다음 가입 단계로 보낸다.
export async function requireActive() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: status } = await supabase.rpc("my_status");
  if (status !== "active") redirect(NEXT_STEP[(status as Exclude<Status, "active">) ?? "need_identity"]);
  return { supabase, user };
}

// 로그인만 확인 (가입 단계 화면용)
export async function requireUser() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");
  const { data: status } = await supabase.rpc("my_status");
  return { supabase, user, status: (status as Status) ?? "need_identity" };
}

export function nextStepFor(status: Status) {
  return status === "active" ? "/home" : NEXT_STEP[status];
}
