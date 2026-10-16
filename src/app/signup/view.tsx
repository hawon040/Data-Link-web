"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { SCHOOL_EMAIL_DOMAIN, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Figma 02 · 본인 인증 (2:22) — 학교 이메일 입력 후 인증 코드 발송
export default function SignupStartView({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setError(null);
    const value = email.trim().toLowerCase();
    if (!value.endsWith(`@${SCHOOL_EMAIL_DOMAIN}`)) {
      setError(`@${SCHOOL_EMAIL_DOMAIN} 학교 메일만 가입할 수 있어요.`);
      return;
    }
    if (preview) return;
    if (!isSupabaseConfigured()) {
      setError("Supabase 환경변수가 설정되지 않았어요 (.env.local).");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError("인증 코드를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    router.push(`/signup/code?email=${encodeURIComponent(value)}`);
  }

  return (
    <Screen
      title="학우 인증"
      badge="19+"
      backHref="/"
      footer={
        <>
          <BlockButton onClick={start} disabled={busy}>
            인증하고 계속하기
          </BlockButton>
          <p className="pt-[5px] text-center text-[12px]">인증 결과에 따라 이용 가능 여부를 안내합니다.</p>
        </>
      }
    >
      <Headline
        step="01 / 03  안전한 시작"
        title={
          <>
            학교와 나이를
            <br />
            확인할게요
          </>
        }
        desc={
          <span className="text-[13px] text-ink">
            백석대 재학생이자 만 19세 이상인지 확인합니다.
            <br />
            휴대폰 인증 정보는 상대에게 보이지 않아요.
          </span>
        }
      />

      <div className="mt-[27px] flex flex-col gap-3">
        <label className="block rounded-[12px] border border-ink bg-card px-4 pt-3 pb-4">
          <span className="block text-[12px] font-medium text-muted">학교 이메일</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={`example@${SCHOOL_EMAIL_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-3 w-full bg-transparent text-[15px] font-medium placeholder:text-ink/40 focus:outline-none"
          />
        </label>
        <Card className="px-4 pt-3 pb-4 opacity-60">
          <span className="block text-[12px] font-medium text-muted">휴대폰 본인 인증</span>
          <span className="mt-3 block text-[15px] font-medium whitespace-pre">{"본인 명의 휴대폰으로 인증하기  →"}</span>
        </Card>
        <div className="mt-[9px] rounded-[12px] border-[1.5px] border-ink bg-card px-4 py-[13px]">
          <p className="text-[14px] font-bold">인증 후 자동으로 나이를 확인해요</p>
          <p className="mt-[2px] text-[12px] text-muted">
            만 19세 미만은 매칭을 이용할 수 없습니다.
            <br />
            인증 정보는 필요한 범위에서만 처리해요.
          </p>
        </div>
        {error && <p className="text-[12px] text-alert">{error}</p>}
      </div>
    </Screen>
  );
}
