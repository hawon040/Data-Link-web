"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 13 · 학교 이메일 코드 (11:3)
const CODE_SECONDS = 180;

export default function CodeView({ email, preview = false }: { email: string; preview?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(CODE_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function verify() {
    setError(null);
    if (code.length !== 6) return setError("6자리 코드를 입력해 주세요.");
    if (preview) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setBusy(false);
      return setError("코드가 맞지 않거나 만료됐어요.");
    }
    const { data: status } = await supabase.rpc("my_status");
    router.push(status === "active" ? "/home" : status === "need_profile" ? "/signup/profile" : status === "need_kakao" ? "/signup/kakao" : "/signup/phone");
  }

  async function resend() {
    if (!preview) await createClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    router.push(`/signup/resent?email=${encodeURIComponent(email)}`);
  }

  const digits = Array.from({ length: 6 }, (_, i) => code[i] ?? "");
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <Screen
      title="학교 이메일 인증"
      badge="1:1"
      backHref="/signup"
      footer={
        <BlockButton onClick={verify} disabled={busy}>
          이메일 확인
        </BlockButton>
      }
    >
      <Headline
        step="01 / 03  학교 인증"
        title={
          <>
            인증 코드를
            <br />
            입력해주세요
          </>
        }
        desc={`${email || "example@bu.ac.kr"}로 보낸 6자리 코드를 입력해요.`}
      />

      {/* 숨긴 입력창 하나로 6칸을 채운다 (붙여넣기·자동완성 지원) */}
      <div className="relative mt-[41px]" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="인증 코드 6자리"
          className="absolute inset-0 opacity-0"
        />
        <div className="flex justify-between">
          {digits.map((d, i) => (
            <span
              key={i}
              className={`flex h-[62px] w-[50px] items-center justify-center rounded-[18px] border border-ink bg-card text-[23px] font-bold ${
                d ? "" : "text-muted"
              }`}
            >
              {d || "•"}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-[27px] text-center text-[12px] font-medium">
        남은 시간 {mm}:{ss}
      </p>
      <button type="button" onClick={resend} className="mx-auto mt-[23px] block text-[13px] font-medium text-muted">
        코드 다시 보내기
      </button>
      {error && <p className="mt-3 text-center text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
