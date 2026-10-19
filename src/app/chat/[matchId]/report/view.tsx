"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, RadioDot, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { REPORT_REASONS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";

// Figma 22 · 신고 사유 (12:58) → 40 · 신고 사유 선택됨 (15:41)
const REASONS = REPORT_REASONS;
type Reason = (typeof REASONS)[number]["value"];

export default function ReportView({
  base,
  matchId,
  myId,
  partnerId,
  initialReason = null,
  preview = false,
}: {
  base: string;
  matchId: string;
  myId: string;
  partnerId: string;
  initialReason?: Reason | null;
  preview?: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState<Reason | null>(initialReason);
  const [confirming, setConfirming] = useState(Boolean(initialReason));
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason) return setError("신고 사유를 골라 주세요.");
    if (preview) return router.push("/preview/31");
    setBusy(true);
    const { error } = await createClient().from("reports").insert({
      match_id: matchId,
      reporter_id: myId,
      reported_id: partnerId,
      reason,
      detail: detail.trim() || null,
    });
    setBusy(false);
    if (error) return setError("신고를 접수하지 못했어요. 다시 시도해 주세요.");
    router.push(`${base}/report/done`);
  }

  if (confirming && reason) {
    const label = REASONS.find((r) => r.value === reason)!.label;
    return (
      <Screen
        title="대화 신고"
        badge="SAFE"
        backHref={base}
        footer={
          <>
            <BlockButton onClick={submit} disabled={busy}>
              신고 제출
            </BlockButton>
            <BlockButton tone="card" onClick={() => setConfirming(false)}>
              사유 다시 선택
            </BlockButton>
          </>
        }
      >
        <Headline size={24} title="신고 내용을 확인해주세요" desc={<span className="mt-[10px] block">선택한 사유와 대화 기록을 검토합니다.</span>} />
        <div className="mt-[67px] flex h-[112px] gap-[14px] rounded-[12px] border border-ink bg-card px-4 pt-[21px]">
          <RadioDot on size={27} check />
          <div>
            <p className="text-[16px] font-bold">{label}</p>
            <p className="mt-[18px] text-[12px] text-muted">상대에게 신고 사실은 알려지지 않습니다.</p>
          </div>
        </div>
        <label className="mt-[33px] block h-[103px] rounded-[12px] border border-ink bg-card px-4 pt-3">
          <span className="block text-[12px] font-medium text-muted">추가 설명 (선택)</span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="대화 도중 불쾌한 메시지가 있었어요."
            className="mt-[14px] w-full resize-none bg-transparent text-[14px] placeholder:text-ink/40 focus:outline-none"
          />
        </label>
        {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
      </Screen>
    );
  }

  return (
    <Screen
      title="대화 신고"
      badge="SAFE"
      backHref={`${base}/safety`}
      footer={
        <>
          <BlockButton onClick={() => (reason ? setConfirming(true) : setError("신고 사유를 골라 주세요."))}>
            신고 제출
          </BlockButton>
          <p className="pt-[3px] text-center text-[11px] text-muted">신고 내용은 상대에게 공개되지 않습니다.</p>
        </>
      }
    >
      <Headline size={26} title="무슨 일이 있었나요?" desc={<span className="mt-[6px] block">신고된 대화 기록은 운영자가 검토합니다.</span>} />
      <div role="radiogroup" aria-label="신고 사유" className="mt-[42px] flex flex-col gap-[13px]">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={reason === r.value}
            onClick={() => {
              setReason(r.value);
              setConfirming(true);
            }}
            className="flex h-[70px] items-center gap-[7px] rounded-[12px] border border-ink bg-card px-[17px] text-left text-[14px] font-medium"
          >
            <RadioDot on={reason === r.value} size={24} />
            {r.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
