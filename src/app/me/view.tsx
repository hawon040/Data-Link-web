"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomNav from "@/components/bottom-nav";
import AvatarPicker from "@/components/avatar-picker";
import { Toggle } from "@/components/screen";
import { BrandHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 08 · 내 정보 (2:177)
export type MeData = {
  nickname: string;
  dept: string;
  grade: number;
  autoJoin: boolean;
  sameGenderOnly: boolean;
  verified: boolean;
  applied?: boolean; // 내일 매칭을 이미 신청했는지
  avatarUrl?: string | null;
};

export default function MeView({ data, preview = false }: { data: MeData; preview?: boolean }) {
  const [autoJoin, setAutoJoin] = useState(data.autoJoin);
  const [sameGender, setSameGender] = useState(data.sameGenderOnly);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 저장에 실패하면 토글을 원래대로 돌리고 알려준다
  async function update(patch: Record<string, boolean>, revert: () => void) {
    if (preview) return;
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // .select()로 실제로 바뀐 행이 있는지까지 확인 (권한이 없으면 오류 없이 0행이 된다)
    const { data: rows, error } = user
      ? await supabase.from("profiles").update(patch).eq("id", user.id).select("id")
      : { data: null, error: new Error("signed out") };
    // 이미 내일 매칭을 신청했다면 바뀐 조건으로 다시 신청해 둔다
    const reapply = !error && rows?.length && "pref_same_gender_only" in patch && data.applied;
    const { error: applyError } = reapply ? await supabase.rpc("apply_match") : { error: null };
    if (error || !rows?.length || applyError) {
      revert();
      setError("설정을 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function logout() {
    if (preview) return router.push("/preview/01");
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-paper pb-[100px]">
      <BrandHeader title="내 정보" badge="YOU" />

      {/* 원(사진)은 누르면 사진 고르기, 나머지는 프로필 수정으로 이동 */}
      <div className="mx-6 mt-[21px] h-[150px] rounded-[8px] border border-ink bg-card px-[17px] pt-[18px] shadow-block">
        <div className="flex gap-[13px]">
          <AvatarPicker url={data.avatarUrl ?? null} preview={preview} />
          <Link href={preview ? "/preview/27" : "/me/profile"} className="flex-1 pt-[2px]">
            <p className="text-[20px] font-bold">{data.nickname}님</p>
            <p className="mt-[5px] text-[12px] text-muted">
              백석대 · {data.dept} {data.grade}학년
            </p>
          </Link>
        </div>
        <Link href={preview ? "/preview/27" : "/me/profile"} className="mt-[29px] block text-[13px] font-bold whitespace-pre">
          {"프로필 수정  →"}
        </Link>
      </div>

      <h2 className="font-display mt-[35px] px-6 text-[18px]">매칭 설정</h2>
      <div className="mx-6 mt-[8px] rounded-[12px] border border-ink bg-card px-[17px]">
        <div className="flex h-16 items-center justify-between border-b border-ink">
          <span className="text-[15px] font-medium">매일 자동 참여</span>
          <Toggle
            on={autoJoin}
            label="매일 자동 참여"
            onChange={(v) => {
              setAutoJoin(v);
              update({ auto_join: v }, () => setAutoJoin(!v));
            }}
          />
        </div>
        <div className="flex h-[63px] items-center justify-between border-b border-ink">
          <span className="text-[15px] font-medium">같은 성별과만 매칭</span>
          <Toggle
            on={sameGender}
            label="같은 성별과만 매칭"
            onChange={(v) => {
              setSameGender(v);
              update({ pref_same_gender_only: v }, () => setSameGender(!v));
            }}
          />
        </div>
        <Link href={preview ? "/preview/28" : "/me/blocks"} className="flex h-[68px] items-center text-[15px] font-medium">
          차단한 학우 관리
        </Link>
      </div>

      <h2 className="font-display mt-[33px] px-6 text-[18px]">안전과 계정</h2>
      <div className="mx-6 mt-[8px] rounded-[12px] border border-ink bg-card px-[17px]">
        <p className="flex h-[60px] items-center gap-[22px] border-b border-ink text-[14px] font-medium">
          <span>인증 상태</span>
          <span>{data.verified ? "학교·휴대폰 인증 완료" : "인증 필요"}</span>
        </p>
        <Link
          href={preview ? "/preview/29" : "/me/privacy"}
          className="flex h-[59px] items-center border-b border-ink text-[14px] font-medium whitespace-pre"
        >
          {"신고 내역 · 개인정보 관리   →"}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex h-[59px] w-full items-center border-b border-ink text-left text-[14px] font-medium"
        >
          로그아웃
        </button>
        <Link
          href={preview ? "/preview/withdraw" : "/me/withdraw"}
          className="flex h-[59px] items-center text-[14px] font-medium text-muted whitespace-pre"
        >
          {"회원 탈퇴   →"}
        </Link>
      </div>
      {error && <p className="mx-6 mt-3 text-[12px] text-alert">{error}</p>}

      <p className="mt-[21px] text-center text-[11px] text-muted">RANPICK은 실명·학번·연락처를 상대에게 공개하지 않아요.</p>
      <p className="mt-[6px] text-center text-[11px] text-muted">
        <Link href={`/legal/terms?from=${preview ? "/preview/08" : "/me"}`} className="underline">
          이용약관
        </Link>
        {"  ·  "}
        <Link href={`/legal/privacy?from=${preview ? "/preview/08" : "/me"}`} className="underline">
          개인정보처리방침
        </Link>
      </p>
      <BottomNav />
    </div>
  );
}
