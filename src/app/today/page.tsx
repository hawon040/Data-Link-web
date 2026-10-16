import { redirect } from "next/navigation";
import { kstDate, kstDateLabelKo } from "@/lib/date";
import { requireActive } from "@/lib/session";
import TodayView, { type TodayData } from "./today-view";

export const dynamic = "force-dynamic";

type Partner = {
  nickname: string;
  dept: string;
  grade: number;
  interests: string[];
};

export default async function TodayPage() {
  const { supabase, user } = await requireActive();

  const [{ data: match }, { data: me }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, user_a, user_b")
      .eq("match_date", kstDate())
      .maybeSingle(),
    supabase.from("profiles").select("interests").eq("id", user.id).maybeSingle(),
  ]);

  // 신청했는데 짝이 없었던 날은 Figma 10 화면으로
  if (!match) {
    const { data: leftover } = await supabase.rpc("was_leftover_today");
    if (leftover) redirect("/match/none");
  }

  let view: TodayData["match"] = null;
  if (match) {
    const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
    const { data: p } = await supabase
      .from("profiles")
      .select("nickname, dept, grade, interests")
      .eq("id", partnerId)
      .single<Partner>();
    if (p) {
      const mine = (me?.interests as string[] | undefined) ?? [];
      view = {
        id: match.id,
        nickname: p.nickname,
        dept: p.dept,
        grade: p.grade,
        interests: p.interests,
        commonInterests: p.interests.filter((i) => mine.includes(i)),
      };
    }
  }

  return <TodayView data={{ dateLabel: kstDateLabelKo(), match: view }} />;
}
