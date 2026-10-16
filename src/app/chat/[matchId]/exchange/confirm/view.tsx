"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, Screen, Toggle } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { chooseExchange } from "../exchange-view";

// Figma 24 · 카카오톡 ID 수정 (12:95) — 교환 직전 내 ID 확인·수정
export default function ConfirmIdView({
  matchId,
  myKakaoId,
  preview = false,
}: {
  matchId: string;
  myKakaoId: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [kakaoId, setKakaoId] = useState(myKakaoId);
  // 카카오톡 앱 설정은 우리가 바꿀 수 없으므로, 사용자가 직접 확인했다는 체크
  const [searchOn, setSearchOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/chat/${matchId}`;

  async function confirm() {
    setError(null);
    const v = kakaoId.trim();
    if (v.length < 2) return setError("카카오톡 ID를 입력해 주세요.");
    if (!searchOn) return setError("카카오톡에서 ID 검색 허용을 켠 뒤 체크해 주세요.");
    if (preview) return router.push("/preview/25");
    setBusy(true);
    const supabase = createClient();
    if (v !== myKakaoId) {
      const { error } = await supabase.rpc("set_my_kakao_id", { p_kakao_id: v });
      if (error) {
        setBusy(false);
        return setError("ID를 저장하지 못했어요.");
      }
    }
    const err = await chooseExchange(matchId, true);
    setBusy(false);
    if (err) return setError(err);
    router.push(`${base}/exchange`);
    router.refresh();
  }

  return (
    <Screen
      title="내 ID 확인"
      badge="ID"
      backHref={`${base}/exchange`}
      footer={
        <>
          <BlockButton onClick={confirm} disabled={busy}>
            확인하고 교환 선택
          </BlockButton>
          <BlockButton tone="card" href={`${base}/exchange`}>
            취소
          </BlockButton>
        </>
      }
    >
      <div className="pt-[12px]" />
      <Headline
        size={26}
        title={
          <>
            공개 전 마지막으로
            <br />
            확인해주세요
          </>
        }
        desc="교환 후에는 공개를 되돌릴 수 없어요."
      />
      <label className="mt-[53px] block h-[98px] rounded-[12px] border border-ink bg-card px-[17px] pt-3">
        <span className="block text-[12px] font-medium text-muted">내 카카오톡 ID</span>
        <input
          value={kakaoId}
          onChange={(e) => setKakaoId(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          className="mt-[10px] w-full bg-transparent text-[18px] font-bold focus:outline-none"
        />
      </label>
      <div className="mt-[23px] h-[90px] rounded-[12px] border border-ink bg-card px-[17px] pt-[18px]">
        <div className="flex items-start justify-between">
          <p className="text-[15px] font-medium">ID 검색 허용</p>
          <Toggle on={searchOn} onChange={setSearchOn} label="ID 검색 허용을 켰어요" />
        </div>
        <Link href={`/guide/kakao-search?from=${base}/exchange/confirm`} className="mt-[4px] block text-[12px] text-muted">
          상대가 ID로 나를 검색할 수 있도록
        </Link>
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
