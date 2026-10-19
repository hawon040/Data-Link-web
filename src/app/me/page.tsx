import { avatarUrl } from "@/lib/avatar";
import { kstDate } from "@/lib/date";
import { requireActive } from "@/lib/session";
import MeView from "./view";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const { supabase, user } = await requireActive();
  const [{ data: me }, { data: pool }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname, dept, grade, auto_join, pref_same_gender_only, identity_verified_at, school_verified_at, avatar_updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("match_pool").select("user_id").eq("user_id", user.id).eq("match_date", kstDate(1)).maybeSingle(),
  ]);

  const photo = await avatarUrl(supabase, user.id, me?.avatar_updated_at as string | null);

  return (
    <MeView
      data={{
        nickname: me?.nickname ?? "학우",
        dept: me?.dept ?? "",
        grade: me?.grade ?? 1,
        autoJoin: me?.auto_join ?? false,
        sameGenderOnly: me?.pref_same_gender_only ?? false,
        verified: Boolean(me?.identity_verified_at && me?.school_verified_at),
        applied: Boolean(pool),
        avatarUrl: photo,
      }}
    />
  );
}
