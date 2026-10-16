"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 15 · 카카오톡 ID 등록 (11:41)
export default function KakaoSetupView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const [kakaoId, setKakaoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function done() {
    const v = kakaoId.trim();
    if (v.length < 2) return setError("카카오톡 ID를 입력해 주세요.");
    if (preview) return router.push("/preview/04");
    setBusy(true);
    const { error } = await createClient().rpc("set_my_kakao_id", { p_kakao_id: v });
    setBusy(false);
    if (error) return setError("저장하지 못했어요. 다시 시도해 주세요.");
    router.push("/home");
  }

  return (
    <Screen
      title="연락처 비공개 등록"
      badge="ID"
      backHref="/signup/profile"
      footer={
        <>
          <BlockButton onClick={done} disabled={busy}>
            가입 완료하고 홈으로
          </BlockButton>
          <p className="pt-[5px] text-center text-[11px] text-muted">탈퇴 시 등록된 ID는 즉시 삭제됩니다.</p>
        </>
      }
    >
      <Headline
        step="03 / 03  나중에 서로 원할 때만"
        title={
          <>
            카카오톡 ID를
            <br />
            등록해주세요
          </>
        }
        desc={
          <>
            처음에는 상대에게 절대 보이지 않아요.
            <br />
            양쪽이 교환에 동의하면 공개됩니다.
          </>
        }
      />
      <label className="mt-[46px] block rounded-[12px] border border-ink bg-card px-[17px] pt-3 pb-[18px]">
        <span className="block text-[12px] font-medium text-muted">카카오톡 ID</span>
        <input
          value={kakaoId}
          onChange={(e) => setKakaoId(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="mykakao24"
          className="mt-[10px] w-full bg-transparent text-[16px] font-medium placeholder:text-ink/40 focus:outline-none"
        />
      </label>
      <div className="mt-[18px] rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
        <p className="text-[16px] font-bold">ID 검색 허용 확인</p>
        <p className="mt-[14px] text-[14px] text-muted">
          카카오톡 설정 → 프로필 관리 →
          <br />
          카카오톡 ID → ID 검색 허용을 켜주세요.
        </p>
        <Link href="/guide/kakao-search?from=/signup/kakao" className="mt-[6px] block text-[13px] font-bold whitespace-pre">
          {"설정 방법 자세히 보기  →"}
        </Link>
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
