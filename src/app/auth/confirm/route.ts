import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { nextStepFor, type Status } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

// 메일의 "로그인" 링크가 도착하는 곳.
// 템플릿: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (tokenHash && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const { data: status } = await supabase.rpc("my_status");
      return NextResponse.redirect(new URL(nextStepFor((status as Status) ?? "need_identity"), origin));
    }
  }
  return NextResponse.redirect(new URL("/signup?error=link", origin));
}
