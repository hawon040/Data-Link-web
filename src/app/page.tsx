import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Stats = {
  today_applicants: number;
  week_connections: number;
  total_connections: number;
};

async function getStats(): Promise<Stats | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("public_stats").single<Stats>();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-8">
      <header className="pt-10">
        <h1 className="text-2xl font-bold">백석 랜덤매칭</h1>
        <p className="mt-2 text-muted">
          매일 정오, 백석대 학우 한 명과 1:1로 연결돼요.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard
          label="오늘 신청한 학우"
          value={stats ? `${stats.today_applicants}명` : "-"}
        />
        {/* 초기에는 주간·누적으로 보여주고, 숫자가 커지면 "어제"로 바꾼다 */}
        <StatCard
          label="이번 주 친구가 된 쌍"
          value={stats ? `${stats.week_connections}쌍` : "-"}
        />
      </section>

      <ol className="flex flex-col gap-2 text-sm text-muted">
        <li>1. 오늘 밤 12시까지 매칭 신청</li>
        <li>2. 내일 정오, 오늘의 학우 발표</li>
        <li>3. 24시간 동안 각자 20개까지 대화</li>
        <li>4. 둘 다 원하면 카카오톡 ID 교환</li>
      </ol>

      <div className="flex flex-col gap-3">
        <Link
          href="/today"
          className="rounded-xl bg-accent py-3 text-center font-semibold text-white"
        >
          오늘의 학우 보기
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border py-3 text-center font-semibold"
        >
          처음이에요 · 가입하기
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
