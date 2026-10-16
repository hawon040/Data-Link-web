import { PURPOSE_INFO, type Purpose } from "@/lib/config";
import { kstDate } from "@/lib/date";
import { requireActive } from "@/lib/session";
import AppliedView from "./view";

export const dynamic = "force-dynamic";

export default async function AppliedPage() {
  const { supabase, user } = await requireActive();
  const { data: pool } = await supabase
    .from("match_pool")
    .select("purpose, same_gender_only, include_same_dept")
    .eq("user_id", user.id)
    .eq("match_date", kstDate(1))
    .maybeSingle();

  const summary = pool
    ? [
        PURPOSE_INFO[pool.purpose as Purpose].label,
        pool.same_gender_only ? "같은 성별만" : "성별 무관",
        pool.include_same_dept ? "학과 포함" : "학과 제외",
      ].join(" · ")
    : "아직 신청하지 않았어요";

  return <AppliedView summary={summary} />;
}
