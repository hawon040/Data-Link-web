"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/screen";
import { createClient } from "@/lib/supabase/client";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/push-client";

// 내 정보 → 매칭 설정: 정오 매칭 발표 알림 켜기/끄기 (이 기기 기준)
export function PushSetting({ preview = false }: { preview?: boolean }) {
  const [state, setState] = useState<PushState | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preview) return setState("off");
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, [preview]);

  if (state === "loading" || state === "unsupported") return null;

  async function change(v: boolean) {
    if (preview) return setState(v ? "on" : "off");
    setBusy(true);
    try {
      if (v) {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        setState(user ? await enablePush(user.id) : "off");
      } else {
        setState(await disablePush());
      }
    } catch {
      setState(await getPushState().catch(() => "off" as const));
    }
    setBusy(false);
  }

  return (
    <div className="flex h-[63px] items-center justify-between border-b border-ink">
      <span className="text-[15px] font-medium">
        정오 매칭 알림
        {state === "denied" && <span className="block text-[11px] text-muted">브라우저 설정에서 알림을 허용해 주세요</span>}
      </span>
      <Toggle on={state === "on"} label="정오 매칭 알림" disabled={busy || state === "denied"} onChange={change} />
    </div>
  );
}
