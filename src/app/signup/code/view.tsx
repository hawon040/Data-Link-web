"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 13 · 학교 이메일 인증 (11:3) — 코드 입력 대신 메일의 로그인 링크로 인증
export default function CodeView({ email, preview = false }: { email: string; preview?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    if (!preview) {
      setBusy(true);
      const { error } = await createClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      setBusy(false);
      if (error) return setError("메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    router.push(`/signup/resent?email=${encodeURIComponent(email)}`);
  }

  return (
    <Screen
      title="학교 이메일 인증"
      badge="1:1"
      backHref="/signup"
      footer={
        <>
          <BlockButton onClick={resend} disabled={busy}>
            메일 다시 보내기
          </BlockButton>
          <BlockButton tone="card" href="/signup">
            이메일 다시 입력
          </BlockButton>
        </>
      }
    >
      <Headline
        step="01 / 03  학교 인증"
        title={
          <>
            메일함에서
            <br />
            로그인을 눌러주세요
          </>
        }
        desc={`${email || "example@bu.ac.kr"}로 로그인 링크를 보냈어요.`}
      />
      <CircleArt size={148} className="mx-auto mt-[41px] text-[42px]">
        ✉
      </CircleArt>
      <Card className="mt-[33px] px-4 py-[13px]">
        <p className="text-[14px] font-bold">링크를 누르면 바로 다음 단계로 넘어가요</p>
        <p className="mt-[2px] text-[12px] text-muted">
          메일이 안 보이면 스팸함을 확인해 주세요.
          <br />
          링크는 한 번만 쓸 수 있고 곧 만료돼요.
        </p>
      </Card>
      {error && <p className="mt-3 text-center text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
