import { loadMatch } from "@/lib/match";
import BlockView from "./view";

export const dynamic = "force-dynamic";

export default async function BlockPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { user, partnerId, partnerName } = await loadMatch(matchId);
  return <BlockView base={`/chat/${matchId}`} myId={user.id} partnerId={partnerId} partnerName={partnerName} />;
}
