import { requireActive } from "@/lib/session";
import ProfileEditView from "./view";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const { supabase, user } = await requireActive();
  const { data: me } = await supabase
    .from("profiles")
    .select("nickname, dept, grade, interests, bio")
    .eq("id", user.id)
    .maybeSingle();
  return (
    <ProfileEditView
      initial={{
        nickname: me?.nickname ?? "",
        dept: me?.dept ?? "",
        grade: me?.grade ?? 1,
        interests: (me?.interests as string[] | undefined) ?? [],
        bio: me?.bio ?? "",
      }}
    />
  );
}
