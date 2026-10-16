"use client";

import { useState } from "react";
import { BackHeader, BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 07 · 연락처 교환 (2:156)
export type ExchangeData = {
  matchId: string;
  myKakaoId: string | null;
  choice: boolean | null; // 내가 이미 고른 값
  partnerContact: string | null; // 둘 다 동의했을 때만 값이 있음
};

function mask(id: string) {
  if (id.length <= 4) return `${id[0] ?? ""}***`;
  return `${id.slice(0, 2)}****${id.slice(-2)}`;
}

export default function ExchangeView({ data, preview = false }: { data: ExchangeData; preview?: boolean }) {
  const [myId, setMyId] = useState(data.myKakaoId);
  const [choice, setChoice] = useState(data.choice);
  const [contact, setContact] = useState(data.partnerContact);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function editId() {
    const next = prompt("카카오톡 ID를 입력해 주세요", myId ?? "")?.trim();
    if (!next) return;
    if (!preview) {
      const { error } = await createClient().rpc("set_my_kakao_id", { p_kakao_id: next });
      if (error) return setError("ID를 저장하지 못했어요.");
    }
    setMyId(next);
  }

  async function choose(accept: boolean) {
    setError(null);
    if (preview) return setChoice(accept);
    setBusy(true);
    const { data: res, error } = await createClient().rpc("choose_exchange", {
      p_match_id: data.matchId,
      p_accept: accept,
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("EXCHANGE_NOT_OPEN")
          ? "대화 한도에 도달하거나 24시간이 지나면 교환할 수 있어요."
          : "지금은 교환할 수 없어요.",
      );
      return;
    }
    setChoice(accept);
    setContact((res as string | null) ?? null);
  }

  return (
    <div className="min-h-dvh bg-orange pb-10">
      <BackHeader title="카카오톡 ID 교환" badge="ID" backHref={`/chat/${data.matchId}`} />

      <div className="relative mx-auto mt-[42px] size-[142px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/exchange-orb.svg" width={142} height={142} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/exchange-link.svg" width={60} height={60} alt="" className="absolute top-10 left-[41px]" />
      </div>

      <h2 className="font-display mt-[34px] text-center text-[25px]">
        {contact ? "교점이 이어졌어요!" : "더 이야기하고 싶나요?"}
      </h2>
      <p className="mt-[16px] px-6 text-center text-[14px]">
        두 분 모두 동의했을 때만 카카오톡 ID가
        <br />
        서로 공개돼요. 한쪽의 선택은 알려지지 않아요.
      </p>

      <div className="mx-6 mt-[36px] h-[104px] rounded-[8px] border border-ink bg-card px-[17px] pt-[14px] shadow-block">
        {contact ? (
          <>
            <p className="text-[12px] font-medium text-muted">상대 카카오톡 ID</p>
            <p className="mt-[10px] text-[17px] font-bold select-all">{contact}</p>
          </>
        ) : (
          <>
            <p className="text-[12px] font-medium text-muted">내 카카오톡 ID 확인</p>
            <div className="mt-[10px] flex items-center justify-between">
              <p className="text-[17px] font-bold">{myId ? mask(myId) : "등록 필요"}</p>
              {choice === null && (
                <button type="button" onClick={editId} className="text-[13px] font-bold">
                  수정
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mx-6 mt-[22px] rounded-[15px] border-[1.4px] border-ink bg-mint px-[15px] py-[13px] text-[12px]">
        {contact ? (
          <>
            본인 ID가 아니었다면 7일 안에 신고해 주세요.
            <br />
            카카오톡에서 ID 검색으로 친구를 추가할 수 있어요.
          </>
        ) : (
          <>
            공개 후에는 되돌릴 수 없어요.
            <br />
            교환 직전 ID와 검색 허용 상태를 확인하세요.
          </>
        )}
      </div>

      <div className="mx-6 mt-[25px] flex flex-col gap-[9px]">
        {choice === null ? (
          <>
            <BlockButton onClick={() => choose(true)} disabled={busy || !myId}>
              교환할게요
            </BlockButton>
            <BlockButton tone="card" onClick={() => choose(false)} disabled={busy}>
              이번엔 여기까지
            </BlockButton>
          </>
        ) : !contact ? (
          <p className="rounded-[7px] border-[1.5px] border-ink bg-card py-4 text-center text-[14px] font-bold">
            {choice ? "상대의 선택을 기다리고 있어요" : "대화가 끝났어요. 내일 새로운 학우를 만나요"}
          </p>
        ) : null}
        {error && <p className="text-center text-[12px] font-medium">{error}</p>}
      </div>
    </div>
  );
}
