"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { confirmPayment, payMessage } from "@/lib/pay";

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
      const back = params.get("next") === "me" ? "/me/credits" : "/signup/pay";
      const m = payMessage(result);
      if (!m) router.replace(params.get("next") === "me" ? "/me/credits" : "/signup/phone");
      else {
        setMsg(m);
        // 재확인 버튼이 있는 화면으로 돌려보낸다
        setTimeout(() => router.replace(back), 2500);
      }
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
