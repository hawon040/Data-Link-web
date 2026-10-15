import Link from "next/link";
import { redirect } from "next/navigation";
import { kstDate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import ApplyForm from "./apply-form";

export const dynamic = "force-dynamic";

type Partner = {
  nickname: string;
  dept: string;
  grade: number;
  interests: string[];
  bio: string | null;
};

export default async function TodayPage() {
  if (!isSupabaseConfigured()) redirect("/signup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const today = kstDate();
  const tomorrow = kstDate(1);

  const [{ data: match }, { data: me }, { data: applied }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, user_a, user_b, purpose, expires_at, status")
      .eq("match_date", today)
      .maybeSingle(),
    supabase.from("profiles").select("interests").eq("id", user.id).single(),
    supabase
      .from("match_pool")
      .select("purpose")
      .eq("user_id", user.id)
      .eq("match_date", tomorrow)
      .maybeSingle(),
  ]);

  let partner: Partner | null = null;
  if (match) {
    const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
    const { data } = await supabase
      .from("profiles")
      .select("nickname, dept, grade, interests, bio")
      .eq("id", partnerId)
      .single<Partner>();
    partner = data;
  }

  const common =
    partner && me
      ? partner.interests.filter((i) => (me.interests as string[]).includes(i))
      : [];

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-bold">오늘의 학우</h1>

      {match && partner ? (
        <section className="flex flex-col gap-3 rounded-2xl border p-5">
          {/* 성별보다 공통 관심사를 먼저 보여준다 */}
          {common.length > 0 && (
            <p className="text-sm font-semibold text-accent">
              공통 관심사 {common.slice(0, 2).join(" · ")}
            </p>
          )}
          <div className="text-lg font-bold">{partner.nickname}</div>
          <div className="text-sm text-muted">
            {partner.dept} · {partner.grade}학년
          </div>
          {partner.bio && <p className="text-sm">{partner.bio}</p>}
          <div className="flex flex-wrap gap-1">
            {partner.interests.map((i) => (
              <span key={i} className="rounded-full border px-2 py-0.5 text-xs">
                {i}
              </span>
            ))}
          </div>
          <Link
            href={`/chat/${match.id}`}
            className="mt-2 rounded-xl bg-accent py-3 text-center font-semibold text-white"
          >
            대화하기
          </Link>
        </section>
      ) : (
        <p className="text-muted">
          오늘은 매칭이 없어요. 내일 정오 매칭을 신청해 보세요.
        </p>
      )}

      <ApplyForm matchDate={tomorrow} alreadyApplied={Boolean(applied)} />
    </div>
  );
}
