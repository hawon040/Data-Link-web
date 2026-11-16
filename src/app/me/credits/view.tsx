"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PayRetry from "@/components/pay-retry";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { payAndConfirm, payMessage } from "@/lib/pay";
import { formatPhone, isPhone, recallPhone } from "@/lib/phone";

// 내 정보 → 남은 매칭 · 매칭 2회 구매
export default function CreditsView({
  userId,
  email,
  nickname,
  credits,
  packPrice,
  packCredits,
  preview = false,
}: {
  userId?: string;
  email?: string;
  nickname?: string;
  credits: number;
  packPrice: number;
  packCredits: number;
  preview?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    const saved = recallPhone();
    if (saved) setPhone(saved);
  }, []);

  async function buy() {
    if (preview || !userId) return;
    if (!isPhone(phone)) return setError("휴대폰 번호를 입력해 주세요.");
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const result = await payAndConfirm("pack", userId, "/me/credits/complete", { email, phone, name: nickname });
      const msg = payMessage(result);
      if (!msg) {
        setDone(true);
        router.refresh();
      } else setError(msg);
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
      {done && <p className="mt-3 text-[12px]">구매가 완료됐어요. 매칭 {packCredits}회가 추가됐어요.</p>}
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
      <PayRetry
        onStart={() => setError(null)}
        onDone={() => {
          setError(null);
          setDone(true);
          router.refresh();
        }}
      />
    </Screen>
  );
}
