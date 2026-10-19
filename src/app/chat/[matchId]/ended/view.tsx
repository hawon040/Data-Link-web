"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { chooseExchange } from "../exchange/exchange-view";

// Figma 37 · 대화 한도 (13:152)
export default function EndedView({
  base,
  matchId,
  partnerName,
  preview = false,
}: {
  base: string;
  matchId: string;
  partnerName: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function skip() {
    if (preview) return router.push("/preview/26");
    setBusy(true);
    setError(null);
    const err = await chooseExchange(matchId, false);
    setBusy(false);
    if (err) return setError(err);
    router.push(`${base}/exchange`);
  }

  return (
    <Screen
      title="오늘의 대화 종료"
      badge="CHAT"
      backHref="/today"
      footer={
        <>
          <BlockButton href={preview ? "/preview/07" : `${base}/exchange`}>카카오톡 ID 교환 선택</BlockButton>
          <BlockButton tone="card" onClick={skip} disabled={busy}>
            교환하지 않고 마치기
          </BlockButton>
        </>
      }
    >
      <div className="pt-[18px]" />
      <Headline
        title={
          <>
            오늘의 대화가
            <br />
            끝났어요
          </>
        }
        desc={
          <span className="mt-[6px] block text-[15px]">
            24시간이 지났거나 메시지 한도에
            <br />
            도달해 채팅이 종료되었습니다.
          </span>
        }
      />
      <Card className="mt-[53px] h-[127px] pt-[17px]">
        <p className="text-[16px] font-bold">대화 요약</p>
        <p className="mt-[14px] text-[14px] whitespace-pre text-muted">{`오늘의 학우  ·  ${partnerName}님`}</p>
        <p className="text-[14px] text-muted">서로 관심 있으면 연락처를 교환해요.</p>
      </Card>
      <div className="mt-[31px] flex h-[75px] items-center justify-center rounded-[12px] border-[1.4px] border-ink bg-mint text-[13px] font-bold">
        ID는 두 분 모두 동의할 때만 공개됩니다.
      </div>
      {error && <p className="mt-3 text-center text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
