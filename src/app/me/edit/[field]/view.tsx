"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 44 · 프로필 입력 (29:35) / 45 · 카카오톡 ID 입력 (29:51)
// 키보드는 휴대폰 기본 키보드가 올라온다 (디자인의 키보드 영역)
export type EditField = "nickname" | "kakao";

const COPY = {
  nickname: {
    title: "프로필 항목 수정",
    badge: "YOU",
    headline: "닉네임을 입력해요",
    desc: "실명 대신 부를 수 있는 이름으로 설정해요.",
    label: "닉네임",
    button: "입력 완료",
  },
  kakao: {
    title: "카카오톡 ID 입력",
    badge: "ID",
    headline: (
      <>
        연락처를 비공개로
        <br />
        등록해요
      </>
    ),
    desc: "서로 교환을 선택하기 전에는 보이지 않아요.",
    label: "카카오톡 ID",
    button: "ID 저장",
  },
} as const;

export default function EditFieldView({
  field,
  initial,
  preview = false,
}: {
  field: EditField;
  initial: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const c = COPY[field];
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const v = value.trim();
    if (field === "nickname" && (v.length < 2 || v.length > 12)) return setError("닉네임은 2~12자로 정해 주세요.");
    if (field === "kakao" && v.length < 2) return setError("카카오톡 ID를 입력해 주세요.");
    if (preview) return router.push("/preview/08");
    setBusy(true);
    const supabase = createClient();
    let failed = false;
    if (field === "kakao") {
      failed = Boolean((await supabase.rpc("set_my_kakao_id", { p_kakao_id: v })).error);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: rows, error } = await supabase.from("profiles").update({ nickname: v }).eq("id", user!.id).select("id");
      failed = Boolean(error) || !rows?.length;
    }
    setBusy(false);
    if (failed) return setError("저장하지 못했어요.");
    router.push(field === "kakao" ? "/me/privacy" : "/me/profile");
    router.refresh();
  }

  return (
    <Screen title={c.title} badge={c.badge} backHref={field === "kakao" ? "/me/privacy" : "/me/profile"}>
      <Headline size={25} title={c.headline} desc={<span className="mt-[12px] block">{c.desc}</span>} />
      <label className="mt-[60px] block h-[91px] rounded-[12px] border border-ink bg-card px-[17px] pt-[11px]">
        <span className="block text-[12px] font-medium">{c.label}</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={field === "nickname" ? 12 : 40}
          autoCapitalize="none"
          autoCorrect="off"
          className="mt-[10px] w-full bg-transparent text-[17px] font-bold focus:outline-none"
        />
      </label>
      <div className="mt-[54px]">
        <BlockButton onClick={save} disabled={busy}>
          {c.button}
        </BlockButton>
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
