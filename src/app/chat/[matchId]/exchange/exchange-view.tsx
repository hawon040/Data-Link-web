"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackHeader, BlockButton } from "@/components/ui";
import { maskId } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";

// Figma 07 · 연락처 교환 (2:156)
export { maskId };

export async function chooseExchange(matchId: string, accept: boolean) {
  const { error } = await createClient().rpc("choose_exchange", { p_match_id: matchId, p_accept: accept });
  if (!error) return null;
  return error.message.includes("EXCHANGE_NOT_OPEN")
    ? "대화 한도에 도달하거나 24시간이 지나면 교환할 수 있어요."
    : "지금은 교환할 수 없어요.";
}

export default function ExchangeView({
  matchId,
  myKakaoId,
  preview = false,
}: {
  matchId: string;
  myKakaoId: string | null;
  preview?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const base = `/chat/${matchId}`;

  async function choose(accept: boolean) {
    setError(null);
    if (preview) return router.push(accept ? "/preview/25" : "/preview/26");
    setBusy(true);
    const err = await chooseExchange(matchId, accept);
    setBusy(false);
    if (err) return setError(err);
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-orange pb-10">
      <BackHeader title="카카오톡 ID 교환" badge="ID" backHref={`${base}/ended`} />

      <div className="relative mx-auto mt-[42px] size-[142px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/exchange-orb.svg" width={142} height={142} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/exchange-link.svg" width={60} height={60} alt="" className="absolute top-10 left-[41px]" />
      </div>

      <h2 className="font-display mt-[34px] text-center text-[25px]">더 이야기하고 싶나요?</h2>
      <p className="mt-[16px] px-6 text-center text-[14px]">
        두 분 모두 동의했을 때만 카카오톡 ID가
        <br />
        서로 공개돼요. 한쪽의 선택은 알려지지 않아요.
      </p>

      <div className="mx-6 mt-[36px] h-[104px] rounded-[8px] border border-ink bg-card px-[17px] pt-[14px] shadow-block">
        <p className="text-[12px] font-medium text-muted">내 카카오톡 ID 확인</p>
        <div className="mt-[10px] flex items-center justify-between">
          <p className="text-[17px] font-bold">{myKakaoId ? maskId(myKakaoId) : "등록 필요"}</p>
          <button
            type="button"
            onClick={() => router.push(preview ? "/preview/24" : `${base}/exchange/confirm`)}
            className="text-[13px] font-bold"
          >
            수정
          </button>
        </div>
      </div>

      <div className="mx-6 mt-[22px] rounded-[15px] border-[1.4px] border-ink bg-mint px-[15px] py-[13px] text-[12px]">
        공개 후에는 되돌릴 수 없어요.
        <br />
        교환 직전 ID와 검색 허용 상태를 확인하세요.
      </div>

      <div className="mx-6 mt-[25px] flex flex-col gap-[9px]">
        <BlockButton onClick={() => choose(true)} disabled={busy || !myKakaoId}>
          교환할게요
        </BlockButton>
        <BlockButton tone="card" onClick={() => choose(false)} disabled={busy}>
          이번엔 여기까지
        </BlockButton>
        {error && <p className="text-center text-[12px] font-medium">{error}</p>}
      </div>
    </div>
  );
}
