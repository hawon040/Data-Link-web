import { redirect } from "next/navigation";
import { loadMatch } from "@/lib/match";
import CopiedView from "./view";

export const dynamic = "force-dynamic";

export default async function CopiedPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, partnerName } = await loadMatch(matchId);
  const { data: contact } = await supabase.rpc("get_partner_contact", { p_match_id: matchId });
  if (!contact) redirect(`/chat/${matchId}/exchange`);
  return <CopiedView base={`/chat/${matchId}`} partnerName={partnerName} contact={contact as string} />;
}
