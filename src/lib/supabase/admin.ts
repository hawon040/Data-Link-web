import { createClient } from "@supabase/supabase-js";

// service_role 클라이언트 (서버 라우트 전용). 키가 없으면 null
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } });
}
