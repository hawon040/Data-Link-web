"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { WITHDRAW_GRACE_DAYS } from "@/lib/config";
import { AVATAR_BUCKET, avatarPath } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";

// 회원 탈퇴 확인 — 23번(학우 차단) 화면 틀을 따른다
export default function WithdrawView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    if (preview) return router.push("/preview/01");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // 프로필 사진 파일은 탈퇴 전에 지운다 (실패해도 탈퇴는 진행, DB가 표시를 끊는다)
    if (user) await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(user.id)]);
    const { error } = await supabase.rpc("withdraw_account");
    if (error) {
      setBusy(false);
      return setError("탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Screen
      title="회원 탈퇴"
      badge="YOU"
      backHref={preview ? "/preview/08" : "/me"}
      footer={
        <>
          <BlockButton onClick={withdraw} disabled={busy}>
            탈퇴하기
          </BlockButton>
          <BlockButton tone="card" href={preview ? "/preview/08" : "/me"}>
            취소
          </BlockButton>
        </>
      }
    >
      <CircleArt tone="pink" className="mt-[74px]" />
      <Headline
        center
        title={
          <>
            RANPICK을
            <br />
            탈퇴하시겠어요?
          </>
        }
        desc={
          <span className="mt-[20px] block text-[15px]">
            진행 중인 대화는 바로 종료되고
            <br />
            탈퇴는 되돌릴 수 없어요.
          </span>
        }
      />
      <div className="mt-[34px] rounded-[12px] border border-ink bg-card px-[17px] py-4">
        <p className="text-[14px] font-bold">탈퇴하면 이렇게 처리돼요</p>
        <p className="mt-[8px] text-[12px] leading-[1.6] text-muted">
          카카오톡 ID와 매칭 신청은 즉시 삭제합니다.
          <br />
          계정 정보는 {WITHDRAW_GRACE_DAYS}일 뒤 삭제하며, 그동안은 다시 가입할 수 없어요.
        </p>
      </div>
      {error && <p className="mt-3 text-center text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
