import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import ChatRoom, { type Message } from "./chat-room";

export const dynamic = "force-dynamic";

export default async function ChatPage({
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

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a, user_b, expires_at, status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) notFound();

  const partnerId = match.user_a === user.id ? match.user_b : match.user_a;

  const [{ data: messages }, { data: partner }, { data: myChoice }, { data: contact }] =
    await Promise.all([
      supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("match_id", matchId)
        .order("created_at"),
      supabase.from("profiles").select("nickname").eq("id", partnerId).single(),
      supabase
        .from("exchange_choices")
        .select("accepted")
        .eq("match_id", matchId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.rpc("get_partner_contact", { p_match_id: matchId }),
    ]);

  return (
    <ChatRoom
      matchId={matchId}
      myId={user.id}
      partnerId={partnerId}
      partnerName={partner?.nickname ?? "학우"}
      expiresAt={match.expires_at}
      initialMessages={(messages ?? []) as Message[]}
      initialChoice={myChoice?.accepted ?? null}
      initialContact={(contact as string | null) ?? null}
    />
  );
}
