import { createHash } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 휴대폰 본인인증 결과 확인 → DB 저장
//   body: { identityVerificationId } (포트원 V2)
//   개발용: IDENTITY_MOCK=1 일 때 { mock: "adult" | "minor" }
// 응답: { result: "ok" | "underage" | "duplicate" | "error" }

type Verified = { birthDate: string; gender: "M" | "F"; ci: string };

async function fetchPortOne(id: string): Promise<Verified | null> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) return null;
  const res = await fetch(`https://api.portone.io/identity-verifications/${encodeURIComponent(id)}`, {
    headers: { Authorization: `PortOne ${secret}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
  // TODO: 포트원 계약 후 실제 응답 필드명 확인 (verifiedCustomer.birthDate / gender / ci)
  if (body.status !== "VERIFIED" || !body.verifiedCustomer) return null;
  const c = body.verifiedCustomer;
  return {
    birthDate: c.birthDate,
    gender: c.gender === "FEMALE" ? "F" : "M",
    ci: c.ci,
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ result: "error" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let verified: Verified | null = null;

  if (process.env.IDENTITY_MOCK === "1" && (body.mock === "adult" || body.mock === "minor")) {
    const year = new Date().getFullYear() - (body.mock === "adult" ? 22 : 18);
    verified = { birthDate: `${year}-01-01`, gender: "M", ci: `mock-${user.id}` };
  } else if (typeof body.identityVerificationId === "string") {
    verified = await fetchPortOne(body.identityVerificationId);
  }
  if (!verified) return NextResponse.json({ result: "error" }, { status: 400 });

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
  return NextResponse.json({ result: data as string });
}
