"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { confirmPayment, PAY_ERRORS } from "@/lib/pay";

// 모바일에서 결제창이 페이지 이동 방식으로 끝났을 때 돌아오는 곳 (가입비·매칭 구매 공통)
function Complete() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("결제를 확인하고 있어요…");

  useEffect(() => {
    const id = params.get("paymentId");
    if (!id || params.get("code")) {
      const reason = params.get("message");
      setMsg(reason ? `결제가 취소됐거나 실패했어요. (${reason})` : "결제가 취소됐거나 실패했어요.");
      return;
    }
    confirmPayment(id).then((result) => {
      if (result === "ok" || result === "duplicate") router.replace(params.get("next") === "me" ? "/me/credits" : "/signup/phone");
      else setMsg(PAY_ERRORS[result] ?? "결제를 확인하지 못했어요. 다시 시도해 주세요.");
    });
  }, [params, router]);

  return <p className="px-6 pt-32 text-center text-[14px]">{msg}</p>;
}

export default function CompletePage() {
  return (
    <Suspense>
      <Complete />
    </Suspense>
  );
}
