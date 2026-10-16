"use client";

import { type Prefs, toRow } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";

// 매칭 조건 저장. 이미 내일 매칭을 신청했다면 새 조건으로 다시 신청한다.
export async function savePrefs(prefs: Prefs, applied: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("profiles").update(toRow(prefs)).eq("id", user.id);
  if (error) return false;
  if (applied) await supabase.rpc("apply_match");
  return true;
}
