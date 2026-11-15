import { timingSafeEqual } from "node:crypto";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { kstDate } from "@/lib/date";

// 정오 매칭 발표 푸시
//   DB pg_cron(12:00 KST) → private.trigger_noon_push() → POST 여기 (Authorization: Bearer PUSH_CRON_SECRET)
// 같은 날 두 번 호출돼도 claim_push_run 으로 한 번만 보낸다.
// 문구에 상대 정보는 넣지 않는다 (잠금 화면에 보이므로).

type Target = { endpoint: string; p256dh: string; auth: string; kind: "matched" | "leftover" };

const MESSAGES: Record<Target["kind"], { title: string; body: string; url: string }> = {
  matched: { title: "오늘의 학우가 도착했어요", body: "지금 확인하고 첫 인사를 건네 보세요.", url: "/today" },
  leftover: { title: "오늘은 짝이 맞지 않았어요", body: "내일 먼저 매칭해 드릴게요.", url: "/today" },
};

function authorized(req: Request, secret: string) {
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  const secret = process.env.PUSH_CRON_SECRET;
  if (!secret || !authorized(req, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicKey || !privateKey || !subject || !serviceKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  // 키 형식이 틀리면 web-push가 예외를 던진다 → 어느 값이 틀렸는지만 알려준다 (값은 응답에 넣지 않음)
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const field = /subject/i.test(msg) ? "VAPID_SUBJECT" : /public/i.test(msg) ? "NEXT_PUBLIC_VAPID_PUBLIC_KEY" : "VAPID_PRIVATE_KEY";
    return NextResponse.json({ error: "invalid vapid config", field }, { status: 503 });
  }

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const date = kstDate();
  const { data: first, error: claimError } = await admin.rpc("claim_push_run", { p_date: date, p_kind: "noon" });
  if (claimError) return NextResponse.json({ error: "claim failed" }, { status: 500 });
  if (!first) return NextResponse.json({ date, skipped: true });

  const { data, error } = await admin.rpc("noon_push_targets", { p_date: date });
  if (error) return NextResponse.json({ error: "targets failed" }, { status: 500 });
  const targets = (data ?? []) as Target[];

  const gone: string[] = [];
  let sent = 0;
  const results = await Promise.allSettled(
    targets.map((t) =>
      webpush.sendNotification(
        { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
        JSON.stringify({ ...MESSAGES[t.kind], tag: `noon-${date}` }),
        { TTL: 6 * 60 * 60, urgency: "high" },
      ),
    ),
  );
  results.forEach((r, i) => {
    if (r.status === "fulfilled") sent++;
    else {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) gone.push(targets[i].endpoint);
    }
  });
  if (gone.length) await admin.rpc("drop_push_subscriptions", { p_endpoints: gone });

  return NextResponse.json({ date, targets: targets.length, sent, expired: gone.length });
}
