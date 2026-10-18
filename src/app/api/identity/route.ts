import { createHash } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 휴대폰 본인인증 결과 확인 → DB 저장
//   body: { identityVerificationId } (포트원 V2, KG이니시스 통합인증 · PASS)
// 응답: { result: "ok" | "underage" | "duplicate" | "mismatch" | "unavailable" | "error" }
//
// 클라이언트가 보낸 값은 믿지 않고, 포트원 API로 인증 건을 직접 조회해서 판단한다.
//   GET https://api.portone.io/identity-verifications/{id}  (Authorization: PortOne {secret})
//   응답 스키마: VerifiedIdentityVerification.verifiedCustomer { birthDate(yyyy-MM-dd), gender(MALE|FEMALE|OTHER), ci, phoneNumber(숫자만) }
// customData 에는 인증 창을 연 계정 id와 입력한 번호가 들어 있다 (view.tsx). 다른 계정의 인증 건을 가져다 쓰는 것을 막는다.

type Verified = { birthDate: string; gender: "M" | "F"; ci: string };
type Failure = "mismatch" | "unavailable" | "error";

async function fetchPortOne(id: string, userId: string): Promise<Verified | Failure> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return "unavailable";

  const res = await fetch(`https://api.portone.io/identity-verifications/${encodeURIComponent(id)}`, {
    headers: { Authorization: `PortOne ${secret}` },
    cache: "no-store",
  });
  if (!res.ok) return "error";
  const body = await res.json();
  if (body.status !== "VERIFIED" || !body.verifiedCustomer) return "error";

  let custom: { uid?: unknown; phone?: unknown } = {};
  try {
    custom = JSON.parse(body.customData ?? "{}");
  } catch {}
  if (custom.uid !== userId) return "error";

  const c = body.verifiedCustomer;
  if (typeof custom.phone !== "string" || c.phoneNumber !== custom.phone) return "mismatch";
  // 같은 성별 매칭에 쓰므로 인증기관이 확인한 성별·CI가 있어야 한다 (PASS는 항상 제공)
  if (!c.ci || !c.birthDate || (c.gender !== "MALE" && c.gender !== "FEMALE")) return "error";

  return { birthDate: c.birthDate, gender: c.gender === "FEMALE" ? "F" : "M", ci: c.ci };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ result: "error" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.identityVerificationId !== "string") {
    return NextResponse.json({ result: "error" }, { status: 400 });
  }
  const verified = await fetchPortOne(body.identityVerificationId, user.id);
  if (typeof verified === "string") {
    return NextResponse.json({ result: verified }, { status: verified === "unavailable" ? 503 : 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ result: "error" }, { status: 500 });
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  // CI 원문은 저장하지 않고 해시만 보관 (중복 가입 방지용)
  const ciHash = createHash("sha256").update(verified.ci).digest("hex");
  const { data, error } = await admin.rpc("complete_identity", {
    p_user: user.id,
    p_birth: verified.birthDate,
    p_gender: verified.gender,
    p_ci_hash: ciHash,
  });
  if (error) return NextResponse.json({ result: "error" }, { status: 500 });

  // 가입 첫 화면(02)에서 받은 약관 동의 시각을 프로필에 기록
  if (data === "ok") {
    const agreedAt = user.user_metadata?.terms_agreed_at;
    await admin
      .from("profiles")
      .update({ terms_agreed_at: typeof agreedAt === "string" ? agreedAt : new Date().toISOString() })
      .eq("id", user.id)
      .is("terms_agreed_at", null);
  }
  return NextResponse.json({ result: data as string });
}
