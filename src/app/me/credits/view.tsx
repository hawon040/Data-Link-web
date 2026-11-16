"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { PAY_ERRORS, payAndConfirm } from "@/lib/pay";

// 내 정보 → 남은 매칭 · 매칭 2회 구매
export default function CreditsView({
  userId,
  credits,
  packPrice,
  packCredits,
  preview = false,
}: {
  userId?: string;
  credits: number;
  packPrice: number;
  packCredits: number;
  preview?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function buy() {
    if (preview || !userId) return;
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const result = await payAndConfirm("pack", userId, "/signup/pay/complete?next=me");
      if (result === "ok" || result === "duplicate") {
        setDone(true);
        router.refresh();
      } else if (result === "cancelled") setError("결제가 취소됐어요.");
      else setError(PAY_ERRORS[result] ?? "결제를 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="남은 매칭"
      badge="PASS"
      backHref="/me"
      footer={
        <BlockButton onClick={buy} disabled={busy}>
          {busy ? "결제 확인 중…" : `매칭 ${packCredits}회 · ${packPrice.toLocaleString()}원 구매`}
        </BlockButton>
      }
    >
      <Headline
        center
        title={
          <>
            남은 매칭
            <br />
            {credits}회
          </>
        }
        desc={<span className="text-[13px]">매칭을 신청해서 실제로 짝이 된 날만 1회가 줄어요.</span>}
      />
      <Card className="mt-[40px] py-[19px] text-[14px] font-medium">
        <p>짝이 없던 날은 줄지 않아요</p>
        <p className="mt-4">남은 매칭이 0회면 내일 매칭을 신청할 수 없어요</p>
        <p className="mt-4">‘같은 성별만’ 등 매칭 조건은 모두 무료예요</p>
      </Card>
      {done && <p className="mt-3 text-[12px]">구매가 완료됐어요. 매칭 {packCredits}회가 추가됐어요.</p>}
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
