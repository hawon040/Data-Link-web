import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { kstDate } from "@/lib/date";
import { sendEmptyPush } from "@/lib/push-server";

// 정오 매칭 발표 알림
// Vercel Cron이 매일 03:00 UTC(12:00 KST)에 호출한다 (vercel.json).
// 11:50 KST pg_cron이 만든 오늘 매칭의 두 사람에게 알림을 보낸다.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "no service key" }, { status: 500 });
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: matches, error } = await admin
    .from("matches")
    .select("user_a, user_b")
    .eq("match_date", kstDate())
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = [...new Set((matches ?? []).flatMap((m) => [m.user_a, m.user_b]))];
  if (users.length === 0) return NextResponse.json({ users: 0, sent: 0, removed: 0 });

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint")
    .in("user_id", users);

  let sent = 0;
  const gone: string[] = [];
  for (const { endpoint } of subs ?? []) {
    const result = await sendEmptyPush(endpoint);
    if (result === "sent") sent++;
    if (result === "gone") gone.push(endpoint);
  }
  if (gone.length) await admin.from("push_subscriptions").delete().in("endpoint", gone);

  return NextResponse.json({ users: users.length, sent, removed: gone.length });
}
