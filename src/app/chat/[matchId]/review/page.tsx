import { loadMatch } from "@/lib/match";
import ReviewView from "./view";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { user, partnerName } = await loadMatch(matchId);
  return <ReviewView base={`/chat/${matchId}`} matchId={matchId} myId={user.id} partnerName={partnerName} />;
}
