import { requireUser } from "@/lib/session";
import PrivacyView from "./view";

export const dynamic = "force-dynamic";

// 정지된 계정도 이 화면으로 온다 (session.ts) → requireActive 대신 requireUser
export default async function PrivacyPage() {
  const { supabase, status } = await requireUser();
  const [{ data: kakaoId }, { data: reports }] = await Promise.all([
    supabase.rpc("get_my_kakao_id"),
    supabase.rpc("my_reports"),
  ]);
  return (
    <PrivacyView
      data={{
        kakaoId: (kakaoId as string | null) ?? null,
        reportCount: ((reports as unknown[] | null) ?? []).length,
        suspended: status === "suspended",
      }}
    />
  );
}
