import { kstDate } from "@/lib/date";
import { PREF_COLUMNS, toPrefs } from "@/lib/prefs";
import { requireActive } from "@/lib/session";
import ConditionsView from "./view";

export const dynamic = "force-dynamic";

export default async function ConditionsPage() {
  const { supabase, user } = await requireActive();
  const [{ data: me }, { data: pool }] = await Promise.all([
    supabase.from("profiles").select(PREF_COLUMNS).eq("id", user.id).maybeSingle(),
    supabase.from("match_pool").select("user_id").eq("user_id", user.id).eq("match_date", kstDate(1)).maybeSingle(),
  ]);
  return <ConditionsView initial={toPrefs(me)} applied={Boolean(pool)} />;
}
