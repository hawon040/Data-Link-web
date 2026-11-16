"use client";

import { Suspense } from "react";
import { PayComplete } from "@/components/pay-complete";

// 가입비 결제창이 페이지 이동 방식으로 끝났을 때 돌아오는 곳
export default function CompletePage() {
  return (
    <Suspense>
      <PayComplete okPath="/signup/phone" backPath="/signup/pay" />
    </Suspense>
  );
}
