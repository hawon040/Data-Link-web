"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHeader, BlockButton } from "@/components/ui";
import { MESSAGE_LIMIT_PER_USER } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Figma 06 · 익명 대화 (2:134)
export type Message = {
  id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

const ICEBREAKERS = [
  "다른 학과 친구에게 가장 궁금한 건?",
  "백석대 근처 맛집 하나만 추천한다면?",
  "이번 학기 제일 기대되는 수업은?",
];

function remainingLabel(expiresAt: string) {
  const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function ChatRoom({
  matchId,
  myId,
  partnerName,
  expiresAt,
  initialMessages,
  preview = false,
}: {
  matchId: string;
  myId: string;
  partnerName: string;
  expiresAt: string;
  initialMessages: Message[];
  preview?: boolean;
}) {
  const supabase = useMemo(() => (preview ? null : createClient()), [preview]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [left, setLeft] = useState(() => remainingLabel(expiresAt));
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sentByMe = messages.filter((m) => m.sender_id === myId).length;
  const remaining = Math.max(0, MESSAGE_LIMIT_PER_USER - sentByMe);
  const expired = left === "00:00";
  const exchangeOpen = remaining === 0 || expired;
  const icebreaker = ICEBREAKERS[matchId.charCodeAt(0) % ICEBREAKERS.length];

  useEffect(() => {
    const t = setInterval(() => setLeft(remainingLabel(expiresAt)), 30_000);
    return () => clearInterval(t);
  }, [expiresAt]);

  // 실시간 수신
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    setError(null);
    const body = text.trim();
    if (!body || remaining === 0 || !supabase) return;
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: myId, body })
      .select("id, sender_id, body, created_at")
      .single<Message>();
    if (error) {
      setError(error.message.includes("MESSAGE_LIMIT_REACHED") ? "대화 한도에 도달했어요." : "대화가 종료됐어요.");
      return;
    }
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
    setText("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <BackHeader title={`${partnerName}님과 대화`} badge="CHAT" backHref="/today" />

      <div className="mt-[7px] flex h-12 items-center justify-center border-[1.4px] border-ink bg-mint text-[13px] font-bold whitespace-pre">
        {`남은 시간 ${left}    ·    내 메시지 ${sentByMe}/${MESSAGE_LIMIT_PER_USER}`}
      </div>

      <button
        type="button"
        onClick={() => setText(icebreaker)}
        className="mx-5 mt-[17px] flex h-[81px] flex-col items-start justify-start rounded-[8px] border-[1.5px] border-ink bg-orange px-[13px] pt-[9px] text-left shadow-block-sm"
      >
        <span className="font-label block text-[10px]">ICEBREAKER / 01</span>
        <span className="mt-[8px] block text-[14px] font-medium">{icebreaker}</span>
      </button>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-[29px] pb-4">
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <p
              key={m.id}
              className={`max-w-[247px] rounded-[16px] px-[14px] py-[15px] text-[13px] whitespace-pre-wrap ${
                mine ? "self-end bg-ink text-card" : "self-start bg-chip text-ink"
              }`}
            >
              {m.body}
            </p>
          );
        })}
        <div ref={bottomRef} />
        <p className="mt-auto text-center text-[12px] text-muted">전화번호·카톡 ID는 채팅 중 가려져요.</p>
      </div>

      <div className="px-4 pb-[18px]">
        {exchangeOpen ? (
          <BlockButton href={preview ? "/preview/37" : `/chat/${matchId}/ended`}>대화 종료 · 교환 선택하기</BlockButton>
        ) : (
          <form
            className="flex h-[55px] items-center rounded-[8px] bg-orange pr-[14px] pl-4 shadow-block-sm"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="메시지 입력"
              aria-label="메시지 입력"
              className="flex-1 bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
            />
            <button type="submit" aria-label="보내기" className="relative size-[38px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/send-button.svg" width={38} height={38} alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/send.svg" width={23} height={23} alt="" className="absolute top-[7px] left-[7px]" />
            </button>
          </form>
        )}
        {error && <p className="mt-2 text-center text-[12px] text-orange">{error}</p>}
      </div>

      <Link
        href={preview ? "/preview/21" : `/chat/${matchId}/safety`}
        className="flex h-[77px] justify-center gap-5 bg-card pt-[17px] text-[13px] font-medium whitespace-pre text-muted"
      >
        {"신고     ·     차단"}
      </Link>
    </div>
  );
}
