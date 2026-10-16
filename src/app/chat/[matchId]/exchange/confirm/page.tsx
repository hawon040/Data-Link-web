import { loadMatch } from "@/lib/match";
import ConfirmIdView from "./view";

export const dynamic = "force-dynamic";

export default async function ConfirmIdPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase } = await loadMatch(matchId);
  const { data: myId } = await supabase.rpc("get_my_kakao_id");
  return <ConfirmIdView matchId={matchId} myKakaoId={(myId as string | null) ?? ""} />;
}
