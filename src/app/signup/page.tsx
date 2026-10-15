"use client";

import { useState } from "react";
import { SCHOOL_EMAIL_DOMAIN, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// 가입 3단계: 학교 이메일 인증 → 휴대폰 본인인증 → 카카오톡 ID
type Step = "email" | "identity" | "kakao" | "done";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [kakaoId, setKakaoId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const domainOk = email.toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`);

  async function sendCode() {
    setError(null);
    if (!domainOk) {
      setError(`@${SCHOOL_EMAIL_DOMAIN} 학교 메일만 가입할 수 있어요.`);
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase 환경변수가 설정되지 않았어요 (.env.local).");
      return;
    }
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) setError(error.message);
    else setCodeSent(true);
  }

  async function verifyCode() {
    setError(null);
    const { error } = await createClient().auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) setError("인증번호가 맞지 않아요.");
    else setStep("identity");
  }

  async function startIdentityVerification() {
    // TODO: 포트원(PortOne) 통합 본인인증 연동
    //   1) 브라우저에서 포트원 SDK로 본인인증 창 호출
    //   2) 받은 identityVerificationId를 /api/identity로 보내 서버에서 결과 조회
    //   3) 서버(서비스 키)가 profiles 행 생성 + private.identity에 생년월일·CI 해시 저장
    setStep("kakao");
  }

  async function saveKakaoId() {
    setError(null);
    const trimmed = kakaoId.trim();
    if (trimmed.length < 2) {
      setError("카카오톡 ID를 입력해 주세요.");
      return;
    }
    const { error } = await createClient().rpc("set_my_kakao_id", {
      p_kakao_id: trimmed,
    });
    if (error) setError(error.message);
    else setStep("done");
  }

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-bold">가입하기</h1>
      <StepBar step={step} />

      {step === "email" && (
        <section className="flex flex-col gap-3">
          <label className="text-sm font-medium">학교 이메일</label>
          <input
            className="rounded-lg border px-3 py-2"
            type="email"
            placeholder={`학번@${SCHOOL_EMAIL_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {codeSent && (
            <input
              className="rounded-lg border px-3 py-2"
              inputMode="numeric"
              placeholder="메일로 받은 인증번호"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
          <button
            className="rounded-xl bg-accent py-3 font-semibold text-white"
            onClick={codeSent ? verifyCode : sendCode}
          >
            {codeSent ? "인증하기" : "인증번호 받기"}
          </button>
        </section>
      )}

      {step === "identity" && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            안전한 1:1 대화를 위해 휴대폰 본인인증을 한 번 진행해요. 이름과
            전화번호는 상대에게 절대 공개되지 않아요.
          </p>
          <button
            className="rounded-xl bg-accent py-3 font-semibold text-white"
            onClick={startIdentityVerification}
          >
            본인인증 하기
          </button>
        </section>
      )}

      {step === "kakao" && (
        <section className="flex flex-col gap-3">
          <label className="text-sm font-medium">카카오톡 ID</label>
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="카카오톡 ID"
            value={kakaoId}
            onChange={(e) => setKakaoId(e.target.value)}
          />
          <p className="text-xs text-muted">
            서로 &quot;교환&quot;을 골랐을 때만 상대에게 보여요. 카카오톡 설정 →
            프로필 관리에서 &quot;ID 검색 허용&quot;을 켜 주세요.
          </p>
          <button
            className="rounded-xl bg-accent py-3 font-semibold text-white"
            onClick={saveKakaoId}
          >
            저장하고 시작하기
          </button>
        </section>
      )}

      {step === "done" && (
        <section className="flex flex-col gap-3">
          <p>가입이 끝났어요. 오늘 밤 12시까지 매칭을 신청해 보세요.</p>
          <a
            href="/today"
            className="rounded-xl bg-accent py-3 text-center font-semibold text-white"
          >
            매칭 신청하러 가기
          </a>
        </section>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "email", label: "학교 메일" },
    { key: "identity", label: "본인인증" },
    { key: "kakao", label: "카톡 ID" },
  ];
  const order: Step[] = ["email", "identity", "kakao", "done"];
  const current = order.indexOf(step);
  return (
    <ol className="flex gap-2 text-xs">
      {steps.map((s, i) => (
        <li
          key={s.key}
          className={`flex-1 rounded-full py-1 text-center ${
            i <= current ? "bg-accent text-white" : "border text-muted"
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
