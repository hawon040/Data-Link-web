"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 33 · 휴대폰 인증 분기 (13:83)
// 포트원 V2 · KG이니시스 통합인증 창 → /api/identity 가 포트원에서 결과를 직접 조회하고 자동 분기
// 인증 수단은 PASS(통신사)로 고정: 카카오·네이버는 성별을 사용자가 직접 입력해 검증되지 않아 같은 성별 매칭에 쓸 수 없다.
// 만 19세 판정은 인증 결과의 생년월일로 DB(complete_identity)가 한다. 번호는 저장하지 않고, 인증한 번호와 같은지만 서버가 확인한다.

// 숫자만 남기고 010-1234-5678 형태로 표시
function formatPhone(digits: string) {
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export const IDENTITY_ERRORS: Record<string, string> = {
  duplicate: "이미 다른 계정으로 인증된 휴대폰이에요.",
  mismatch: "입력한 번호와 인증한 휴대폰 번호가 달라요.",
  unavailable: "본인인증 서비스를 준비 중이에요. 잠시 후 다시 시도해 주세요.",
};

export default function PhoneView({ userId, preview = false }: { userId?: string; preview?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const phoneValid = /^01[016789]\d{7,8}$/.test(phone);

  async function verify() {
    if (preview) return router.push("/preview/14");
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    if (!storeId || !channelKey || !userId) return setError(IDENTITY_ERRORS.unavailable);

    setError(null);
    setBusy(true);
    try {
      const PortOne = await import("@portone/browser-sdk/v2");
      const id = `identity-${crypto.randomUUID()}`;
      const res = await PortOne.requestIdentityVerification({
        storeId,
        channelKey,
        identityVerificationId: id,
        customer: { phoneNumber: phone },
        customData: JSON.stringify({ uid: userId, phone }),
        bypass: { inicisUnified: { flgFixedUser: "N", directAgency: "PASS", FRGNDInfo: "N" } },
        redirectUrl: `${window.location.origin}/signup/phone/complete`,
      });
      if (!res || res.code !== undefined) {
        setError("본인인증이 취소됐거나 실패했어요.");
        return;
      }
      const r = await fetch("/api/identity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identityVerificationId: id }),
      });
      const { result } = await r.json().catch(() => ({ result: "error" }));
      if (result === "ok") router.push("/signup/verified");
      else if (result === "underage") router.push("/signup/age-limit");
      else setError(IDENTITY_ERRORS[result] ?? "인증을 확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="휴대폰 본인 인증"
      badge="19+"
      backHref="/signup"
      footer={
        <BlockButton onClick={verify} disabled={busy || !phoneValid}>
          휴대폰으로 인증하기
        </BlockButton>
      }
    >
      <Headline
        step="02 / 03  성인 확인"
        size={25}
        title={
          <>
            본인 명의 휴대폰으로
            <br />
            인증해주세요
          </>
        }
        desc={
          <span className="text-[13px]">
            인증 결과로 만 19세 이상 여부를 확인합니다.
            <br />
            결과에 따라 자동으로 다음 단계로 이동해요.
          </span>
        }
      />
      <Card className="mt-[45px] pt-3 pb-[18px]">
        <label className="block">
          <span className="block text-[12px] font-medium text-muted">휴대폰 번호</span>
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
      {phone.length >= 10 && !phoneValid && (
        <p className="mt-2 text-[12px] text-alert">휴대폰 번호를 다시 확인해 주세요.</p>
      )}
      <p className="mt-3 text-[12px] text-muted">PASS(통신사) 인증 창이 열려요. 입력한 번호로 인증해 주세요.</p>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
