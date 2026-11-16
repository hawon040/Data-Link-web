"use client";

import { Suspense } from "react";
import { PayComplete } from "@/components/pay-complete";

// 매칭 2회 구매 결제창이 페이지 이동 방식으로 끝났을 때 돌아오는 곳
export default function CreditsCompletePage() {
  return (
    <Suspense>
      <PayComplete okPath="/me/credits" backPath="/me/credits" />
    </Suspense>
  );
}
