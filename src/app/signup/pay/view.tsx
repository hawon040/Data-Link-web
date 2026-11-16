"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { PAY_ERRORS, payAndConfirm } from "@/lib/pay";

// 가입비 결제 (학교 메일 인증 다음, 휴대폰 본인인증 전)
// 1,000원 = 본인인증 비용 + 매칭 1회. 만 19세 미만이거나 이미 가입된 휴대폰이면 자동 환불된다.
export default function PayView({ userId, preview = false }: { userId?: string; preview?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (preview || !userId) return router.push("/signup/phone");
    setError(null);
    setBusy(true);
    try {
      const result = await payAndConfirm("signup", userId, "/signup/pay/complete");
      if (result === "ok" || result === "duplicate") return router.push("/signup/phone");
      if (result === "cancelled") return setError("결제가 취소됐어요.");
      setError(PAY_ERRORS[result] ?? "결제를 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="가입비 결제"
      badge="1,000"
      backHref="/signup"
      footer={
        <BlockButton onClick={pay} disabled={busy}>
          {busy ? "결제 확인 중…" : "1,000원 결제하기"}
        </BlockButton>
      }
    >
      <Headline
        step="02 / 03  가입비"
        size={25}
        title={
          <>
            가입비 1,000원에
            <br />
            첫 매칭 1회가 들어 있어요
          </>
        }
        desc={<span className="text-[13px]">결제 후 휴대폰 본인인증으로 넘어가요.</span>}
      />
      <Card className="mt-[40px] py-[19px] text-[14px] font-medium">
        <p>휴대폰 본인인증 1회</p>
        <p className="mt-4">매칭 1회 (실제로 짝이 된 날만 차감)</p>
        <p className="mt-4">이후 매칭 2회 1,000원</p>
      </Card>
      <p className="mt-4 text-[12px] text-muted">
        만 19세 미만이거나 이미 가입된 휴대폰이면 결제한 1,000원은 자동으로 환불돼요.
      </p>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
