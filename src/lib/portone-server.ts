// 포트원 V2 REST API (서버 전용)
//   GET  /payments/{id}         결제 건 조회
//   POST /payments/{id}/cancel  결제 취소(환불)
// 인증: Authorization: PortOne {PORTONE_API_SECRET}

const API = "https://api.portone.io";

function headers() {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return null;
  return { Authorization: `PortOne ${secret}`, "Content-Type": "application/json" };
}

export type PaidPayment = { id: string; amount: number; customData: Record<string, unknown> };

// 결제 완료 건만 돌려준다. 미설정·미결제·원화가 아니면 null
export async function getPaidPayment(paymentId: string): Promise<PaidPayment | null | "unavailable"> {
  const h = headers();
  if (!h) return "unavailable";
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, { headers: h, cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  if (body.status !== "PAID" || body.currency !== "KRW" || typeof body.amount?.total !== "number") return null;
  let customData: Record<string, unknown> = {};
  try {
    customData = typeof body.customData === "string" ? JSON.parse(body.customData) : (body.customData ?? {});
  } catch {}
  return { id: paymentId, amount: body.amount.total, customData };
}

// 전액 취소. 성공하면 true
export async function cancelPayment(paymentId: string, reason: string): Promise<boolean> {
  const h = headers();
  if (!h) return false;
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ reason }),
    cache: "no-store",
  });
  return res.ok;
}
