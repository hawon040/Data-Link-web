import { redirect } from "next/navigation";
import { isSupabaseConfigured, type Purpose } from "@/lib/config";
import { kstDate, kstDateLabelEn } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import HomeView from "./home-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) redirect("/signup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const matchDate = kstDate(1);
  const [{ data: me }, { data: pool }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
    supabase
      .from("match_pool")
      .select("purpose, same_gender_only")
      .eq("user_id", user.id)
      .eq("match_date", matchDate)
      .maybeSingle(),
    supabase.rpc("public_stats").maybeSingle<{ week_connections: number }>(),
  ]);

  return (
    <HomeView
      data={{
        nickname: me?.nickname ?? "학우",
        dateLabel: kstDateLabelEn(),
        matchDate,
        applied: Boolean(pool),
        purpose: (pool?.purpose as Purpose) ?? "friend",
        sameGenderOnly: pool?.same_gender_only ?? false,
        weekConnections: stats?.week_connections ?? null,
      }}
    />
  );
}
