import { redirect } from "next/navigation";
import { loadMatch } from "@/lib/match";
import ChatRoom, { type Message } from "./chat-room";

export const dynamic = "force-dynamic";

// Figma 06 · 익명 대화 / 20 · 메시지 전송 상태 / 46 · 채팅 입력
export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user, match, partnerName, expired } = await loadMatch(matchId);
  if (expired) redirect(`/chat/${matchId}/ended`);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("match_id", matchId)
    .order("created_at");

  return (
    <ChatRoom
      matchId={matchId}
      myId={user.id}
      partnerName={partnerName}
      expiresAt={match.expires_at}
      initialMessages={(messages ?? []) as Message[]}
    />
  );
}
