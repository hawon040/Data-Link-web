"use client";

import { useEffect, useState } from "react";
import { payMessage, pendingPayment, retryPendingPayment } from "@/lib/pay";

// 결제는 됐는데 서버 확인에 실패했을 때: 다시 결제하지 않고 같은 결제를 재확인
export default function PayRetry({ onDone, refreshKey }: { onDone: () => void; refreshKey?: unknown }) {
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPending(pendingPayment());
  }, [refreshKey]);

  if (!pending) return null;

  async function retry() {
    setBusy(true);
    setMsg(null);
    const result = await retryPendingPayment();
    setBusy(false);
    setPending(pendingPayment());
    const m = result ? payMessage(result) : null;
    if (!m) onDone();
    else setMsg(m);
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="h-[44px] w-full rounded-[12px] border border-ink bg-card text-[14px] font-bold disabled:opacity-50"
      >
        {busy ? "확인 중…" : "결제 다시 확인"}
      </button>
      {msg && <p className="mt-2 text-[12px] text-alert">{msg}</p>}
    </div>
  );
}
