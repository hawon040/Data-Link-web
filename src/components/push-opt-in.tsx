"use client";

import { useEffect, useState } from "react";
import { enablePush, getPushState, type PushState } from "@/lib/push-client";

// 정오 매칭 발표 알림 켜기 (신청 완료 화면)
export function PushOptIn({ userId }: { userId: string }) {
  const [state, setState] = useState<PushState | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  if (state === "loading" || state === "unsupported") return null;

  if (state === "on") {
    return <p className="mt-[16px] text-center text-[12px] font-medium">정오 알림이 켜져 있어요</p>;
  }

  if (state === "denied") {
    return (
      <p className="mt-[16px] text-center text-[12px] font-medium">
        알림이 차단돼 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setState(await enablePush(userId).catch(() => "off" as const));
        setBusy(false);
      }}
      className="mt-[16px] h-[44px] w-full rounded-[12px] border border-ink bg-card text-[14px] font-bold disabled:opacity-50"
    >
      {busy ? "알림 켜는 중…" : "정오 알림 받기"}
    </button>
  );
}
