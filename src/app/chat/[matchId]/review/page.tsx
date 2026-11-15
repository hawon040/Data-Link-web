import { loadMatch } from "@/lib/match";
import ReviewView from "./view";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user, partnerName } = await loadMatch(matchId);
  // 이미 남긴 후기가 있으면 그 선택으로 열어 바꿀 수 있게 한다
  const { data: mine } = await supabase
    .from("reviews")
    .select("rating")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (
    <ReviewView
      base={`/chat/${matchId}`}
      matchId={matchId}
      myId={user.id}
      partnerName={partnerName}
      initialRating={(mine?.rating as "good" | "meh" | undefined) ?? null}
    />
  );
}
