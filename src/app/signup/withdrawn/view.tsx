"use client";

import { useRouter } from "next/navigation";
import { CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { WITHDRAW_GRACE_DAYS } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// 탈퇴한 계정으로 다시 로그인했을 때 — 03번(연령 제한) 화면 틀을 따른다
export default function WithdrawnView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();

  async function goHome() {
    if (!preview) await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Screen
      title="이용 안내"
      badge="YOU"
      backHref="/"
      footer={
        <BlockButton tone="card" onClick={goHome}>
          처음으로 돌아가기
        </BlockButton>
      }
    >
      <CircleArt tone="pink" className="mt-[76px]" />
      <Headline
        center
        title={
          <>
            탈퇴한
            <br />
            계정이에요
          </>
        }
        desc={
          <span className="text-[15px]">
            탈퇴 후 {WITHDRAW_GRACE_DAYS}일이 지나면
            <br />
            같은 휴대폰으로 다시 가입할 수 있어요.
          </span>
        }
      />
    </Screen>
  );
}
