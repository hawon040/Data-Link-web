"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 19 · 대화 주제 선택 (12:3)
export const TOPICS = [
  "백석대에서 가장 좋아하는 장소는?",
  "요즘 가장 자주 듣는 노래는?",
  "다른 학과 친구에게 궁금한 점은?",
];

export default function TopicsView({
  matchId,
  myId,
  preview = false,
}: {
  matchId: string;
  myId: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const chatHref = preview ? "/preview/06" : `/chat/${matchId}`;

  async function send(q: string) {
    if (preview) return router.push(chatHref);
    setBusy(true);
    await createClient().from("messages").insert({ match_id: matchId, sender_id: myId, body: q });
    router.push(chatHref);
  }

  return (
    <Screen
      title="대화 주제 카드"
      badge="CHAT"
      backHref="/today"
      footer={
        <BlockButton tone="card" href={chatHref}>
          그냥 대화 시작하기
        </BlockButton>
      }
    >
      <Headline
        size={26}
        title={
          <>
            첫 인사를
            <br />
            시작해볼까요?
          </>
        }
        desc="질문을 누르면 채팅에 바로 전송돼요."
      />
      <div className="mt-[61px] flex flex-col gap-4">
        {TOPICS.map((q, i) => (
          <button
            key={q}
            type="button"
            disabled={busy}
            onClick={() => send(q)}
            className="flex h-24 items-start gap-[7px] rounded-[12px] border-[1.5px] border-ink bg-card px-[16.5px] pt-[16.5px] text-left"
          >
            <span className="flex size-[35px] shrink-0 items-center justify-center rounded-full bg-mint text-[14px] font-bold">
              {i + 1}
            </span>
            <span className="pt-[7px] text-[14px] font-medium">{q}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}
