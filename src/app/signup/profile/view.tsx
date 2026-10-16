"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileForm, { type ProfileInput, validateProfile } from "@/components/profile-form";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 09 · 프로필 설정 (4:3)
export default function ProfileSetupView({
  initial,
  preview = false,
}: {
  initial?: Partial<ProfileInput>;
  preview?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ProfileInput>({
    nickname: initial?.nickname ?? "",
    dept: initial?.dept ?? "",
    grade: initial?.grade ?? 1,
    interests: initial?.interests ?? [],
    bio: initial?.bio ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function next() {
    const err = validateProfile(value);
    if (err) return setError(err);
    if (preview) return router.push("/preview/15");
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
    if (error) return setError("저장하지 못했어요. 다시 시도해 주세요.");
    router.push("/signup/kakao");
  }

  return (
    <Screen
      title="프로필 만들기"
      badge="YOU"
      backHref="/signup/verified"
      footer={
        <>
          <BlockButton onClick={next} disabled={busy}>
            다음
          </BlockButton>
          <p className="pt-[3px] text-center text-[11px] text-muted">카카오톡 ID는 다음 단계에서 비공개로 등록해요.</p>
        </>
      }
    >
      <Headline
        step="02 / 03  내 소개"
        title={
          <>
            어떤 학우인지
            <br />
            알려주세요
          </>
        }
        desc={<span className="text-[13px]">상대에게는 닉네임·학과·관심사만 보여요.</span>}
      />
      <div className="mt-[26px]">
        <ProfileForm value={value} onChange={setValue} />
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
