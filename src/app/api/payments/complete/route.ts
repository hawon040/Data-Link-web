import { NextResponse } from "next/server";
import { cancelPayment, getPaidPayment } from "@/lib/portone-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// 결제 확인 → 매칭 횟수 지급
//   body: { paymentId }
// 응답: { result: "ok" | "duplicate" | "already_paid" | "not_active" | "invalid" | "unavailable"
//          | "portone_auth" | "not_found" | "not_paid" | "portone_error" | "error" }
//
// 클라이언트가 보낸 금액·종류는 믿지 않는다. 포트원에서 결제 건을 직접 조회하고,
// customData 의 uid 가 로그인한 계정과 같을 때만 DB(record_payment)에 기록한다. 금액도 DB가 다시 확인한다.
// 이미 가입비를 낸 계정이 또 결제했거나 조건이 안 맞으면 바로 환불한다.

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ result: "error" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.paymentId !== "string") return NextResponse.json({ result: "error" }, { status: 400 });

  const payment = await getPaidPayment(body.paymentId);
  if (typeof payment === "string") {
    return NextResponse.json({ result: payment }, { status: payment === "unavailable" ? 503 : 400 });
  }
  if (payment.customData.uid !== user.id) return NextResponse.json({ result: "invalid" }, { status: 400 });
  const kind = payment.customData.kind;
  if (kind !== "signup" && kind !== "pack") return NextResponse.json({ result: "invalid" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ result: "error" }, { status: 500 });
  const { data, error } = await admin.rpc("record_payment", {
    p_user: user.id,
    p_payment_id: payment.id,
    p_kind: kind,
    p_amount: payment.amount,
  });
  if (error) return NextResponse.json({ result: "error" }, { status: 500 });

  const result = data as string;
  if (result === "already_paid" || result === "not_active" || result === "invalid") {
    await cancelPayment(payment.id, "RANPICK 결제 조건 불일치로 자동 환불");
  }
  return NextResponse.json({ result });
}
