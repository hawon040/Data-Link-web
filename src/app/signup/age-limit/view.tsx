"use client";

import { useRouter } from "next/navigation";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 03 · 연령 제한 (2:43)
export default function AgeLimitView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();

  async function goHome() {
    if (!preview) await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <Screen
      title="이용 안내"
      badge="19+"
      backHref="/"
      footer={
        <BlockButton tone="card" onClick={goHome}>
          처음으로 돌아가기
        </BlockButton>
      }
    >
      <div className="relative mx-auto mt-[76px] size-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/lock-backdrop.svg" width={128} height={128} alt="" />
        <span className="absolute inset-0 flex items-center justify-center text-[43px] font-bold">19</span>
      </div>
      <Headline
        center
        title={
          <>
            아직 매칭을
            <br />
            이용할 수 없어요
          </>
        }
        desc={
          <span className="text-[15px]">
            휴대폰 본인 인증 결과 만 19세 미만으로
            <br />
            확인되었습니다. 만 19세가 된 뒤 다시 찾아주세요.
          </span>
        }
      />
      <div className="mt-[34px] rounded-[12px] border-[1.4px] border-ink bg-card px-4 py-5 text-center text-[15px] font-medium">
        매칭 신청·채팅·카카오톡 ID 교환은
        <br />
        진행되지 않습니다.
      </div>
    </Screen>
  );
}
