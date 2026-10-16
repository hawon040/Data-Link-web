import { loadMatch } from "@/lib/match";
import ExchangeView from "./exchange-view";
import { ClosedView, MutualView, WaitingView } from "./states";

export const dynamic = "force-dynamic";

// 교환 상태에 따라 Figma 07 / 25 / 26 / 11 중 하나를 보여준다
export default async function ExchangePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user, partnerName } = await loadMatch(matchId);
  const base = `/chat/${matchId}`;

  const [{ data: myId }, { data: myChoice }, { data: contact }] = await Promise.all([
    supabase.rpc("get_my_kakao_id"),
    supabase.from("exchange_choices").select("accepted").eq("match_id", matchId).eq("user_id", user.id).maybeSingle(),
    supabase.rpc("get_partner_contact", { p_match_id: matchId }),
  ]);

  if (contact) return <MutualView base={base} partnerName={partnerName} contact={contact as string} />;
  if (myChoice?.accepted === true) return <WaitingView />;
  if (myChoice?.accepted === false) return <ClosedView base={base} />;
  return <ExchangeView matchId={matchId} myKakaoId={(myId as string | null) ?? null} />;
}
