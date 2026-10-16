import { requireActive } from "@/lib/session";
import BlocksView from "./view";

export const dynamic = "force-dynamic";

export default async function BlocksPage() {
  const { supabase } = await requireActive();
  const { data } = await supabase.rpc("my_blocks");
  const rows = (data as { blocked_at: string }[] | null) ?? [];
  return <BlocksView blockedAt={rows.map((r) => r.blocked_at)} />;
}
