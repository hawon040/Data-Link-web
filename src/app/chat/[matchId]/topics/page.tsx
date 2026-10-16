import { redirect } from "next/navigation";
import { loadMatch } from "@/lib/match";
import TopicsView from "./view";

export const dynamic = "force-dynamic";

export default async function TopicsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user, expired } = await loadMatch(matchId);
  if (expired) redirect(`/chat/${matchId}/ended`);
  // 이미 대화가 시작됐으면 바로 채팅으로
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);
  if ((count ?? 0) > 0) redirect(`/chat/${matchId}`);
  return <TopicsView matchId={matchId} myId={user.id} />;
}
