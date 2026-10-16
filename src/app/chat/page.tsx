import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { kstDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 하단 탭 "대화": 오늘 매칭이 있으면 그 대화로, 없으면 오늘의 학우 화면으로
export default async function ChatIndex() {
  if (!isSupabaseConfigured()) redirect("/signup");
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("match_date", kstDate())
    .maybeSingle();
  redirect(match ? `/chat/${match.id}` : "/today");
}
