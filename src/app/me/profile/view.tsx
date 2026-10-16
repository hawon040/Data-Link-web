"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileForm, { type ProfileInput, validateProfile } from "@/components/profile-form";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 27 · 프로필 수정 (12:143)
export default function ProfileEditView({ initial, preview = false }: { initial: ProfileInput; preview?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState<ProfileInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const err = validateProfile(value);
    if (err) return setError(err);
    if (preview) return router.push("/preview/08");
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: value.nickname.trim(),
        dept: value.dept.trim(),
        grade: value.grade,
        interests: value.interests,
        bio: value.bio.trim() || null,
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) return setError("저장하지 못했어요.");
    router.push("/me");
    router.refresh();
  }

  return (
    <Screen
      title="프로필 수정"
      badge="YOU"
      backHref="/me"
      footer={
        <BlockButton onClick={save} disabled={busy}>
          프로필 저장
        </BlockButton>
      }
    >
      <Headline size={24} title="내 소개를 바꿔볼까요?" />
      <div className="mt-[31px]">
        <ProfileForm value={value} onChange={setValue} interestLabel="관심사" />
      </div>
      <Link href={preview ? "/preview/44" : "/me/edit/nickname"} className="mt-3 block text-[12px] text-muted">
        닉네임만 따로 바꾸기 →
      </Link>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
