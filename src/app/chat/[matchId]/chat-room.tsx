"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MESSAGE_LIMIT_PER_USER } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export type Message = {
  id: number;
  sender_id: string;
  body: string;
  created_at: string;
};

const ICEBREAKERS = [
  "요즘 학교에서 제일 좋아하는 장소는?",
  "백석대 근처 맛집 하나만 추천한다면?",
  "이번 학기 제일 기대되는 수업은?",
];

export default function ChatRoom({
  matchId,
  myId,
  partnerId,
  partnerName,
  expiresAt,
  initialMessages,
  initialChoice,
  initialContact,
}: {
  matchId: string;
  myId: string;
  partnerId: string;
  partnerName: string;
  expiresAt: string;
  initialMessages: Message[];
  initialChoice: boolean | null;
  initialContact: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [choice, setChoice] = useState<boolean | null>(initialChoice);
  const [contact, setContact] = useState<string | null>(initialContact);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sentByMe = messages.filter((m) => m.sender_id === myId).length;
  const remaining = Math.max(0, MESSAGE_LIMIT_PER_USER - sentByMe);
  const expired = new Date(expiresAt).getTime() < Date.now();
  const exchangeOpen = remaining === 0 || expired;

  // 실시간 수신
  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
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

  async function send(body: string) {
    setError(null);
    const trimmed = body.trim();
    if (!trimmed || remaining === 0) return;
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: myId, body: trimmed })
      .select("id, sender_id, body, created_at")
      .single<Message>();
    if (error) {
      setError(
        error.message.includes("MESSAGE_LIMIT_REACHED")
          ? "대화 한도에 도달했어요."
          : "대화가 종료됐어요.",
      );
      return;
    }
    setMessages((prev) =>
      prev.some((p) => p.id === data.id) ? prev : [...prev, data],
    );
    setText("");
  }

  async function chooseExchange(accept: boolean) {
    if (
      accept &&
      !confirm("카카오톡 ID를 교환할까요? 한 번 공개하면 되돌릴 수 없어요.")
    )
      return;
    const { data, error } = await supabase.rpc("choose_exchange", {
      p_match_id: matchId,
      p_accept: accept,
    });
    if (error) {
      setError("아직 교환할 수 없어요.");
      return;
    }
    setChoice(accept);
    setContact((data as string | null) ?? null);
  }

  async function report() {
    const reason = prompt(
      "신고 사유를 적어 주세요 (예: 욕설, 성희롱, 본인 ID가 아님)",
    );
    if (!reason) return;
    await supabase.from("reports").insert({
      match_id: matchId,
      reporter_id: myId,
      reported_id: partnerId,
      reason: "other",
      detail: reason,
    });
    alert("신고가 접수됐어요.");
  }

  async function block() {
    if (!confirm("차단하면 대화가 끝나고 다시는 매칭되지 않아요.")) return;
    await supabase
      .from("blocks")
      .insert({ blocker_id: myId, blocked_id: partnerId });
    setError("차단했어요.");
  }

  return (
    <div className="flex min-h-[90dvh] flex-col gap-3">
      <header className="flex items-center justify-between border-b pb-3">
        <div>
          <div className="font-bold">{partnerName}</div>
          <div className="text-xs text-muted">
            남은 메시지 {remaining}/{MESSAGE_LIMIT_PER_USER}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={report} className="rounded border px-2 py-1">
            신고
          </button>
          <button onClick={block} className="rounded border px-2 py-1">
            차단
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">이런 질문으로 시작해 보세요</p>
            {ICEBREAKERS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-lg border px-3 py-2 text-left text-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.sender_id === myId
                ? "self-end bg-accent text-white"
                : "self-start border"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {exchangeOpen ? (
        <section className="rounded-2xl border p-4 text-sm">
          {contact ? (
            <p>
              서로 교환했어요! 카카오톡 ID: <b>{contact}</b>
              <br />
              <span className="text-xs text-muted">
                본인 ID가 아니었다면 7일 안에 신고해 주세요.
              </span>
            </p>
          ) : choice === null ? (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">카카오톡 ID를 교환할까요?</p>
              <p className="text-xs text-muted">
                둘 다 &quot;교환&quot;을 골라야 서로의 ID가 보여요.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => chooseExchange(true)}
                  className="flex-1 rounded-lg bg-accent py-2 font-semibold text-white"
                >
                  교환
                </button>
                <button
                  onClick={() => chooseExchange(false)}
                  className="flex-1 rounded-lg border py-2"
                >
                  괜찮아요
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted">
              {choice
                ? "상대의 선택을 기다리고 있어요."
                : "대화가 끝났어요. 내일 새로운 학우를 만나 보세요."}
            </p>
          )}
        </section>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="메시지 입력"
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="rounded-lg bg-accent px-4 font-semibold text-white">
            전송
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
