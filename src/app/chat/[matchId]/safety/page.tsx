import { loadMatch } from "@/lib/match";
import SafetyView from "./view";

export const dynamic = "force-dynamic";

export default async function SafetyPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  await loadMatch(matchId);
  return <SafetyView base={`/chat/${matchId}`} />;
}
