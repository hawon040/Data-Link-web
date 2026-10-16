"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// 모바일에서 포트원 인증 창이 페이지 이동 방식으로 끝났을 때 돌아오는 곳
function Complete() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("인증 결과를 확인하고 있어요…");

  useEffect(() => {
    const id = params.get("identityVerificationId");
    if (!id || params.get("code")) {
      setMsg("본인인증이 취소됐거나 실패했어요.");
      return;
    }
    fetch("/api/identity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identityVerificationId: id }),
    })
      .then((r) => r.json())
      .then(({ result }) => {
        if (result === "ok") router.replace("/signup/verified");
        else if (result === "underage") router.replace("/signup/age-limit");
        else setMsg("인증을 확인하지 못했어요. 다시 시도해 주세요.");
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
