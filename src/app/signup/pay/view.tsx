"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { payAndConfirm, payMessage } from "@/lib/pay";
import { formatPhone, isPhone, rememberPhone } from "@/lib/phone";

// 가입비 결제 (학교 메일 인증 다음, 휴대폰 본인인증 전)
// 1,000원 = 본인인증 비용 + 매칭 1회. 만 19세 미만이거나 이미 가입된 휴대폰이면 자동 환불된다.
export default function PayView({ userId, email, preview = false }: { userId?: string; email?: string; preview?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  async function pay() {
    if (preview || !userId) return router.push("/signup/phone");
    if (!isPhone(phone)) return setError("휴대폰 번호를 입력해 주세요.");
    setError(null);
    setBusy(true);
    rememberPhone(phone);
    try {
      const result = await payAndConfirm("signup", userId, "/signup/pay/complete", { email, phone });
      const msg = payMessage(result);
      if (!msg) return router.push("/signup/phone");
      setError(msg);
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
      <Card className="mt-[20px] pt-3 pb-[18px]">
        <label className="block">
          <span className="block text-[12px] font-medium text-muted">휴대폰 번호 (결제 안내용)</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="010-0000-0000"
            maxLength={13}
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            className="mt-[14px] w-full bg-transparent text-[16px] font-medium placeholder:text-ink/40 focus:outline-none"
          />
        </label>
      </Card>
      <p className="mt-4 text-[12px] text-muted">
        만 19세 미만이거나 이미 가입된 휴대폰이면 결제한 1,000원은 자동으로 환불돼요.
      </p>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
