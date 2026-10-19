import { redirect } from "next/navigation";
import { avatarUrl } from "@/lib/avatar";
import { loadMatch } from "@/lib/match";
import ExchangeView from "./exchange-view";
import { ClosedView, MutualView, WaitingView } from "./states";

export const dynamic = "force-dynamic";

// 교환 상태에 따라 Figma 07 / 25 / 26 / 11 중 하나를 보여준다
export default async function ExchangePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, partnerId, partnerName } = await loadMatch(matchId);
  const base = `/chat/${matchId}`;

  const { data: state } = await supabase.rpc("my_exchange_state", { p_match_id: matchId });
  if (state === "not_open") redirect(base);
  if (state === "mutual") {
    const [{ data: contact }, { data: partner }] = await Promise.all([
      supabase.rpc("get_partner_contact", { p_match_id: matchId }),
      supabase.from("profiles").select("avatar_updated_at").eq("id", partnerId).maybeSingle(),
    ]);
    const photo = await avatarUrl(supabase, partnerId, partner?.avatar_updated_at as string | null);
    return (
      <MutualView base={base} partnerName={partnerName} contact={(contact as string | null) ?? ""} partnerAvatar={photo} />
    );
  }
  if (state === "waiting") return <WaitingView />;
  if (state === "closed") return <ClosedView base={base} />;
  const { data: myId } = await supabase.rpc("get_my_kakao_id");
  return <ExchangeView matchId={matchId} myKakaoId={(myId as string | null) ?? null} />;
}
