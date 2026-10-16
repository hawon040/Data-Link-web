import { kstDate, kstDateLabelEn } from "@/lib/date";
import { PREF_COLUMNS, toPrefs } from "@/lib/prefs";
import { requireActive } from "@/lib/session";
import HomeView from "./home-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user } = await requireActive();

  const [{ data: me }, { data: pool }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select(`nickname, ${PREF_COLUMNS}`).eq("id", user.id).maybeSingle(),
    supabase.from("match_pool").select("user_id").eq("user_id", user.id).eq("match_date", kstDate(1)).maybeSingle(),
    supabase.rpc("public_stats").maybeSingle<{ week_connections: number }>(),
  ]);

  return (
    <HomeView
      data={{
        nickname: me?.nickname ?? "학우",
        dateLabel: kstDateLabelEn(),
        applied: Boolean(pool),
        prefs: toPrefs(me),
        weekConnections: stats?.week_connections ?? null,
      }}
    />
  );
}
