// 결제창 열기 (브라우저). 포트원 결제 채널: NEXT_PUBLIC_PORTONE_PAY_CHANNEL_KEY
export type PayKind = "signup" | "pack";

export const PAY_PRODUCTS: Record<PayKind, { orderName: string; amount: number }> = {
  signup: { orderName: "RANPICK 가입 (매칭 1회 포함)", amount: 1000 },
  pack: { orderName: "RANPICK 매칭 2회", amount: 1000 },
};

export const PAY_ERRORS: Record<string, string> = {
  unavailable: "결제 서비스를 준비 중이에요. 잠시 후 다시 시도해 주세요.",
  already_paid: "이미 가입비를 결제했어요. 이번 결제는 자동으로 환불돼요.",
  not_active: "가입을 마친 뒤에 구매할 수 있어요. 이번 결제는 자동으로 환불돼요.",
  invalid: "결제 정보가 이 계정과 맞지 않아요. 운영자에게 문의해 주세요.",
  portone_auth: "결제 확인 서버 설정 오류예요(포트원 키). 결제는 됐을 수 있으니 '결제 다시 확인'을 눌러 주세요.",
  not_found: "결제 기록을 찾지 못했어요. 잠시 뒤 '결제 다시 확인'을 눌러 주세요.",
  not_paid: "아직 결제가 완료되지 않았어요. 잠시 뒤 '결제 다시 확인'을 눌러 주세요.",
  portone_error: "결제 확인 중 오류가 났어요. 잠시 뒤 '결제 다시 확인'을 눌러 주세요.",
  error: "결제 확인 중 오류가 났어요. 잠시 뒤 '결제 다시 확인'을 눌러 주세요.",
};

// 확인을 못 한 결제 (다시 결제하지 않고 재확인할 수 있게 이 브라우저에 잠시 보관)
const PENDING = "ranpick_pending_payment";
export function pendingPayment() {
  try {
    return sessionStorage.getItem(PENDING);
  } catch {
    return null;
  }
}
function setPending(id: string | null) {
  try {
    if (id) sessionStorage.setItem(PENDING, id);
    else sessionStorage.removeItem(PENDING);
  } catch {}
}

// 결제 완료를 서버에 알리고 결과 코드를 돌려준다
export async function confirmPayment(paymentId: string): Promise<string> {
  const r = await fetch("/api/payments/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ paymentId }),
  }).catch(() => null);
  const { result } = r ? await r.json().catch(() => ({ result: "error" })) : { result: "error" };
  // 확정됐거나 다시 확인해도 소용없는 결과면 보관한 결제를 지운다
  const retryable = ["portone_auth", "not_found", "not_paid", "portone_error", "error", "unavailable"];
  setPending(retryable.includes(result) ? paymentId : null);
  return result as string;
}

// '결제 다시 확인' 버튼
export async function retryPendingPayment(): Promise<string | null> {
  const id = pendingPayment();
  return id ? confirmPayment(id) : null;
}

export type PayCustomer = { email?: string; phone: string; name?: string };

// 결제 → 서버 확인까지. 결과: "ok" | "duplicate" | "cancelled" | "failed:메시지" | 오류 코드
// KG이니시스는 구매자 이름·휴대폰·이메일이 있어야 결제창이 열린다.
export async function payAndConfirm(
  kind: PayKind,
  userId: string,
  returnPath: string,
  customer: PayCustomer,
): Promise<string> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_PAY_CHANNEL_KEY;
  if (!storeId || !channelKey) return "unavailable";
  const product = PAY_PRODUCTS[kind];
  const paymentId = `pay-${crypto.randomUUID()}`;
  try {
    const PortOne = await import("@portone/browser-sdk/v2");
    const res = await PortOne.requestPayment({
      storeId,
      channelKey,
      paymentId,
      orderName: product.orderName,
      totalAmount: product.amount,
      currency: "KRW",
      payMethod: "CARD",
      customer: {
        fullName: customer.name || "RANPICK 회원",
        phoneNumber: customer.phone,
        email: customer.email,
      },
      customData: { uid: userId, kind },
      redirectUrl: `${window.location.origin}${returnPath}`,
    });
    if (!res) return "cancelled";
    if (res.code !== undefined) {
      return res.code === "FAILURE_TYPE_PG" && /취소|cancel/i.test(res.message ?? "") ? "cancelled" : `failed:${res.message ?? res.code}`;
    }
  } catch (e) {
    return `failed:${e instanceof Error ? e.message : "결제창을 열지 못했어요"}`;
  }
  return confirmPayment(paymentId);
}

// 결과 코드 → 화면 문구 (성공이면 null)
export function payMessage(result: string): string | null {
  if (result === "ok" || result === "duplicate") return null;
  if (result === "cancelled") return "결제가 취소됐어요.";
  if (result.startsWith("failed:")) return `결제창 오류: ${result.slice(7)}`;
  return PAY_ERRORS[result] ?? "결제를 확인하지 못했어요. 다시 시도해 주세요.";
}
