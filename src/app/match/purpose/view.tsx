"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, RadioDot, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { PURPOSES, PURPOSE_INFO, type Purpose } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Figma 17 · 만남 목적 (11:82)
//       35 · 밥 목적 선택 (13:120) / 36 · 스터디 목적 선택 (13:136) — 목적 상세 확인
export default function PurposeView({
  initial,
  preview = false,
  initialDetail = null,
}: {
  initial: Purpose;
  preview?: boolean;
  initialDetail?: Purpose | null;
}) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<Purpose>(initial);
  const [detail, setDetail] = useState<Purpose | null>(initialDetail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(p: Purpose) {
    if (preview) return router.push("/preview/18");
    setBusy(true);
    const { error } = await createClient().rpc("apply_match", { p_purpose: p });
    setBusy(false);
    if (error) return setError("신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    router.push("/match/applied");
  }

  if (detail && detail !== "friend") {
    const info = PURPOSE_INFO[detail];
    return (
      <Screen
        title="만남 목적 선택"
        badge="1:1"
        backHref="/home"
        footer={
          <>
            <BlockButton onClick={() => apply(detail)} disabled={busy}>
              {detail === "meal" ? "밥 목적으로 신청" : "스터디로 신청"}
            </BlockButton>
            <BlockButton tone="card" onClick={() => setDetail(null)}>
              다른 목적 보기
            </BlockButton>
          </>
        }
      >
        <Headline
          title={info.detailTitle}
          desc={
            <span className="mt-[18px] block">
              {detail === "meal" ? (
                <>
                  먼저 익명 채팅으로 대화해요.
                  <br />
                  오프라인 만남은 서로 동의할 때만 진행합니다.
                </>
              ) : (
                <>
                  관심사가 맞는 학우와
                  <br />
                  스터디 이야기를 시작해요.
                </>
              )}
            </span>
          }
        />
        <div className="mt-[54px] flex h-[155px] gap-[18px] rounded-[12px] border border-ink bg-card px-[17px] pt-[19px]">
          <span className="flex size-[62px] shrink-0 items-center justify-center rounded-full bg-mint text-[31px] font-bold">
            {info.glyph}
          </span>
          <div className="pt-[6px]">
            <p className="text-[20px] font-bold">{info.label}</p>
            <p className="mt-[14px] text-[13px] text-muted">{info.detailDesc}</p>
          </div>
        </div>
        {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
      </Screen>
    );
  }

  return (
    <Screen
      title="만남 목적 선택"
      badge="1:1"
      backHref="/home"
      footer={
        <BlockButton onClick={() => apply(purpose)} disabled={busy}>
          {`${PURPOSE_INFO[purpose].label}${purpose === "friend" ? "로" : purpose === "meal" ? "으로" : "로"} 신청하기`}
        </BlockButton>
      }
    >
      <Headline
        size={26}
        title={
          <>
            오늘은 어떤 만남을
            <br />
            원하나요?
          </>
        }
        desc="목적이 같은 학우를 먼저 연결해드려요."
      />
      <div role="radiogroup" aria-label="만남 목적" className="mt-[53px] flex flex-col gap-[17px]">
        {PURPOSES.map((p) => {
          const on = purpose === p.value;
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setPurpose(p.value);
                if (p.value !== "friend") setDetail(p.value);
              }}
              className="flex h-[94px] items-center gap-[13px] rounded-[12px] border border-ink bg-card px-[17px] text-left"
            >
              <RadioDot on={on} size={36} check />
              <span>
                <span className="block text-[17px] font-bold">{PURPOSE_INFO[p.value].label}</span>
                <span className="block text-[12px] text-muted">{PURPOSE_INFO[p.value].desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
