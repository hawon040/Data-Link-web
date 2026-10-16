import { loadMatch } from "@/lib/match";
import EndedView from "./view";

export const dynamic = "force-dynamic";

export default async function EndedPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { partnerName } = await loadMatch(matchId);
  return <EndedView base={`/chat/${matchId}`} matchId={matchId} partnerName={partnerName} />;
}
