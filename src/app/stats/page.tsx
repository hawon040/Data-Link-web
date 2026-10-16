import { requireActive } from "@/lib/session";
import StatsView from "./view";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const { supabase } = await requireActive();
  const { data } = await supabase.rpc("public_stats").maybeSingle<{ week_connections: number }>();
  return <StatsView week={data?.week_connections ?? null} />;
}
