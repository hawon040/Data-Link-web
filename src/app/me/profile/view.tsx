"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AvatarPicker from "@/components/avatar-picker";
import ProfileForm, { type ProfileInput, validateProfile } from "@/components/profile-form";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 27 · 프로필 수정 (12:143)
export default function ProfileEditView({
  initial,
  avatar = null,
  preview = false,
}: {
  initial: ProfileInput;
  avatar?: string | null;
  preview?: boolean;
}) {
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
    const { data: rows, error } = await supabase
      .from("profiles")
      .update({
        nickname: value.nickname.trim(),
        dept: value.dept.trim(),
        grade: value.grade,
        interests: value.interests,
        bio: value.bio.trim() || null,
      })
      .eq("id", user!.id)
      .select("id");
    setBusy(false);
    if (error || !rows?.length) return setError("저장하지 못했어요. 다시 로그인한 뒤 시도해 주세요.");
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
      <div className="mt-[24px] flex items-center gap-[14px] rounded-[12px] border border-ink bg-card px-[15px] py-[12px]">
        <AvatarPicker url={avatar} size={52} preview={preview} showRemove />
        <p className="text-[12px] text-muted">
          프로필 사진은 나와, 카카오톡 ID 교환에
          <br />
          둘 다 동의한 학우에게만 보여요.
        </p>
      </div>
      <div className="mt-[20px]">
        <ProfileForm value={value} onChange={setValue} interestLabel="관심사" />
      </div>
      <Link href={preview ? "/preview/44" : "/me/edit/nickname"} className="mt-3 block text-[12px] text-muted">
        닉네임만 따로 바꾸기 →
      </Link>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
