"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/screen";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/push";

const HINT: Partial<Record<PushState, string>> = {
  unsupported: "이 브라우저는 알림을 지원하지 않아요.",
  needs_install: "아이폰은 사파리 공유 → '홈 화면에 추가'한 앱에서 알림을 켤 수 있어요.",
  denied: "알림이 차단돼 있어요. 브라우저 설정에서 RANPICK 알림을 허용해 주세요.",
};

// 정오 매칭 발표 알림 켜기
//   variant="row": 내 정보 설정 줄 (토글) · variant="button": 신청 완료 화면 버튼
export default function PushToggle({ variant = "row", preview = false }: { variant?: "row" | "button"; preview?: boolean }) {
  const [state, setState] = useState<PushState | null>(preview ? "off" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) getPushState().then(setState);
  }, [preview]);

  async function change(on: boolean) {
    if (preview) return setState(on ? "on" : "off");
    setBusy(true);
    setError(null);
    try {
      if (on) setState(await enablePush());
      else {
        await disablePush();
        setState("off");
      }
    } catch {
      setError("알림 설정을 저장하지 못했어요. 다시 시도해 주세요.");
    }
    setBusy(false);
  }

  const hint = state ? HINT[state] : undefined;

  if (variant === "button") {
    if (state === "on") return <p className="text-center text-[13px] font-bold">정오 알림이 켜져 있어요</p>;
    return (
      <div className="text-center">
        {!hint && (
          <button
            type="button"
            disabled={busy || state === null}
            onClick={() => change(true)}
            className="h-[44px] rounded-[22px] border border-ink bg-card px-6 text-[14px] font-bold"
          >
            정오 알림 켜기
          </button>
        )}
        {(hint || error) && <p className="mt-2 text-[12px] text-muted">{error ?? hint}</p>}
      </div>
    );
  }

  return (
    <div className="border-b border-ink py-[19px]">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium">정오 매칭 알림</span>
        <Toggle
          on={state === "on"}
          label="정오 매칭 알림"
          disabled={busy || state === null || Boolean(hint)}
          onChange={change}
        />
      </div>
      {(hint || error) && <p className="mt-[6px] text-[11px] text-muted">{error ?? hint}</p>}
    </div>
  );
}
