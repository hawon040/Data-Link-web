import { avatarUrl } from "@/lib/avatar";
import { requireActive } from "@/lib/session";
import ProfileEditView from "./view";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const { supabase, user } = await requireActive();
  const { data: me } = await supabase
    .from("profiles")
    .select("nickname, dept, grade, interests, bio, avatar_updated_at")
    .eq("id", user.id)
    .maybeSingle();
  const photo = await avatarUrl(supabase, user.id, me?.avatar_updated_at as string | null);
  return (
    <ProfileEditView
      avatar={photo}
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
