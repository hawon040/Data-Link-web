import { createPrivateKey, sign } from "node:crypto";

// Web Push 발송 (서버 전용)
// 내용 없는 알림만 보낸다 → 페이로드 암호화가 필요 없고, 문구는 public/sw.js가 정한다.
// VAPID 키: NEXT_PUBLIC_VAPID_PUBLIC_KEY (65바이트 공개키, base64url), VAPID_PRIVATE_KEY (32바이트, base64url)

const b64url = (buf: Buffer) => buf.toString("base64url");

function vapidKey() {
  const pub = Buffer.from(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "", "base64url");
  const d = process.env.VAPID_PRIVATE_KEY ?? "";
  if (pub.length !== 65 || !d) throw new Error("VAPID 키가 설정되지 않았어요");
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d,
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
    },
    format: "jwk",
  });
  return { key, publicKey: b64url(pub) };
}

function vapidJwt(audience: string, key: ReturnType<typeof vapidKey>["key"]) {
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      }),
    ),
  );
  const signature = sign("sha256", Buffer.from(`${header}.${payload}`), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${header}.${payload}.${b64url(signature)}`;
}

// 결과: "sent" | "gone"(구독 만료 → 삭제할 것) | "failed"
export async function sendEmptyPush(endpoint: string): Promise<"sent" | "gone" | "failed"> {
  const { key, publicKey } = vapidKey();
  const jwt = vapidJwt(new URL(endpoint).origin, key);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${publicKey}`,
        TTL: String(6 * 60 * 60),
        Urgency: "high",
        "Content-Length": "0",
      },
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
