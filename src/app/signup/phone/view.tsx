"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { IDENTITY_MOCK } from "@/lib/config";

// Figma 33 · 휴대폰 인증 분기 (13:83)
// 실제 서비스: 포트원 본인인증 창 → /api/identity 가 결과를 확인하고 자동 분기
// 개발·데모(IDENTITY_MOCK): Figma 프로토타입처럼 결과 두 가지를 눌러볼 수 있음
export default function PhoneView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mock = preview || IDENTITY_MOCK;

  async function finish(body: object) {
    const res = await fetch("/api/identity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const { result } = await res.json().catch(() => ({ result: "error" }));
    if (result === "ok") router.push("/signup/verified");
    else if (result === "underage") router.push("/signup/age-limit");
    else if (result === "duplicate") setError("이미 다른 계정으로 인증된 휴대폰이에요.");
    else setError("인증을 확인하지 못했어요. 다시 시도해 주세요.");
  }

  async function verifyWithPortOne() {
    setError(null);
    setBusy(true);
    try {
      const PortOne = await import("@portone/browser-sdk/v2");
      const id = `identity-${crypto.randomUUID()}`;
      const res = await PortOne.requestIdentityVerification({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
        identityVerificationId: id,
        redirectUrl: `${window.location.origin}/signup/phone/complete`,
      });
      if (!res || ("code" in res && res.code)) {
        setError("본인인증이 취소됐거나 실패했어요.");
        return;
      }
      await finish({ identityVerificationId: id });
    } finally {
      setBusy(false);
    }
  }

  async function mockResult(kind: "adult" | "minor") {
    if (preview) return router.push(kind === "adult" ? "/preview/14" : "/preview/03");
    setBusy(true);
    await finish({ mock: kind });
    setBusy(false);
  }

  return (
    <Screen
      title="휴대폰 본인 인증"
      badge="19+"
      backHref="/signup"
      footer={
        mock ? (
          <>
            <BlockButton onClick={() => mockResult("adult")} disabled={busy}>
              만 19세 이상 결과
            </BlockButton>
            <BlockButton tone="card" onClick={() => mockResult("minor")} disabled={busy}>
              만 19세 미만 결과
            </BlockButton>
          </>
        ) : (
          <BlockButton onClick={verifyWithPortOne} disabled={busy}>
            휴대폰으로 인증하기
          </BlockButton>
        )
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
        <span className="block text-[12px] font-medium text-muted">휴대폰 번호</span>
        <span className="mt-[14px] block text-[16px] font-medium">010-••••-••••</span>
      </Card>
      {mock && (
        <Card className="mt-[39px] pb-[30px]">
          <p className="text-[14px] font-bold">프로토타입 결과 미리보기</p>
          <p className="mt-[14px] text-[13px] text-muted">
            화면 흐름을 확인할 수 있도록 인증 결과
            <br />두 가지를 눌러볼 수 있어요.
          </p>
        </Card>
      )}
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
