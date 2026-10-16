import { notFound } from "next/navigation";
import { requireActive } from "@/lib/session";

// 대화·교환·신고 화면 공통: 내 매칭인지 확인하고 상대 닉네임을 가져온다
export async function loadMatch(matchId: string) {
  const { supabase, user } = await requireActive();
  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a, user_b, expires_at, status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();
  const partnerId: string = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: partner } = await supabase.from("profiles").select("nickname").eq("id", partnerId).maybeSingle();
  return {
    supabase,
    user,
    match,
    partnerId,
    partnerName: (partner?.nickname as string | undefined) ?? "학우",
    expired: new Date(match.expires_at).getTime() < Date.now(),
  };
}
