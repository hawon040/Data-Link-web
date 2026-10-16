import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import ExchangeView from "./exchange-view";

export const dynamic = "force-dynamic";

export default async function ExchangePage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  if (!isSupabaseConfigured()) redirect("/signup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: match } = await supabase.from("matches").select("id").eq("id", matchId).maybeSingle();
  if (!match) notFound();

  const [{ data: myId }, { data: myChoice }, { data: contact }] = await Promise.all([
    supabase.rpc("get_my_kakao_id"),
    supabase
      .from("exchange_choices")
      .select("accepted")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.rpc("get_partner_contact", { p_match_id: matchId }),
  ]);

  return (
    <ExchangeView
      data={{
        matchId,
        myKakaoId: (myId as string | null) ?? null,
        choice: myChoice?.accepted ?? null,
        partnerContact: (contact as string | null) ?? null,
      }}
    />
  );
}
