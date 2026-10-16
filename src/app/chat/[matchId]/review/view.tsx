"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 12 · 대화 후기 (4:69)
type Choice = "good" | "meh" | "report";

const OPTIONS: { value: Choice; label: string; icon: string; glyph: string; glyphCls: string }[] = [
  { value: "good", label: "좋았어요", icon: "/figma/review-good.svg", glyph: "☺", glyphCls: "text-[25px]" },
  { value: "meh", label: "별로였어요", icon: "/figma/review-neutral.svg", glyph: "•", glyphCls: "text-[25px] text-muted" },
  { value: "report", label: "신고하기", icon: "/figma/review-report.svg", glyph: "!", glyphCls: "text-[21px] text-alert" },
];

export default function ReviewView({
  base,
  matchId,
  myId,
  partnerName,
  preview = false,
}: {
  base: string;
  matchId: string;
  myId: string;
  partnerName: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function done() {
    if (!choice) return setError("하나를 골라 주세요.");
    if (choice === "report") return router.push(preview ? "/preview/22" : `${base}/report`);
    if (preview) return router.push("/preview/30");
    setBusy(true);
    const { error } = await createClient()
      .from("reviews")
      .insert({ match_id: matchId, user_id: myId, rating: choice });
    setBusy(false);
    // 23505: 이미 후기를 남긴 경우 — 완료로 처리
    if (error && error.code !== "23505") return setError("후기를 저장하지 못했어요.");
    router.push(`${base}/review/done`);
  }

  return (
    <Screen
      title="대화 후기"
      badge="CHAT"
      backHref={`${base}/exchange`}
      footer={
        <>
          <BlockButton onClick={done} disabled={busy}>
            완료
          </BlockButton>
          <p className="pt-[6px] text-center text-[12px] text-muted">차단한 학우와는 다시 매칭되지 않아요.</p>
        </>
      }
    >
      <p className="font-label pt-[55px] text-center text-[13px]">오늘의 대화가 끝났어요</p>
      <Headline
        center
        title={
          <>
            {partnerName}님과의 대화는
            <br />
            어떠셨나요?
          </>
        }
        desc={
          <>
            한 번의 선택으로 다음 매칭을 개선해요.
            <br />
            후기는 상대에게 공개되지 않습니다.
          </>
        }
      />
      <div role="radiogroup" aria-label="대화 후기" className="mt-[45px] flex flex-col gap-[14px]">
        {OPTIONS.map((o) => {
          const on = choice === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setChoice(o.value)}
              className={`flex h-20 items-center gap-[13px] rounded-[12px] bg-card px-[17px] text-left ${
                on ? "border-2 border-ink shadow-block-sm" : "border border-ink"
              }`}
            >
              <span className="relative size-[43px] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.icon} width={43} height={43} alt="" />
                <span className={`absolute inset-0 flex items-center justify-center font-bold ${o.glyphCls}`}>{o.glyph}</span>
              </span>
              <span className="text-[17px] font-bold">{o.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
