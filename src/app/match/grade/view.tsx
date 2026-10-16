"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Headline, RadioDot, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { GRADE_OPTIONS } from "@/lib/config";
import type { Prefs } from "@/lib/prefs";
import { savePrefs } from "@/lib/save-prefs";

// Figma 39 · 학년 필터 (15:17)
export default function GradeView({
  initial,
  applied,
  preview = false,
}: {
  initial: Prefs;
  applied: boolean;
  preview?: boolean;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState<number | null>(initial.targetGrade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (preview) return router.push("/preview/16");
    setBusy(true);
    const ok = await savePrefs({ ...initial, targetGrade: grade }, applied);
    setBusy(false);
    if (!ok) return setError("저장하지 못했어요.");
    router.push("/match/conditions");
  }

  return (
    <Screen
      title="학년 선택"
      badge="YOU"
      backHref="/match/conditions"
      footer={
        <BlockButton onClick={save} disabled={busy}>
          학년 조건 저장
        </BlockButton>
      }
    >
      <Headline
        size={25}
        title="만날 학년을 선택해요"
        desc={
          <span className="mt-[16px] block">
            모든 학년을 선택하면 더 많은 학우와
            <br />
            연결될 수 있어요.
          </span>
        }
      />
      <div role="radiogroup" aria-label="학년" className="mt-[37px] flex flex-col gap-3">
        {GRADE_OPTIONS.map((o) => {
          const on = grade === o.value;
          return (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setGrade(o.value)}
              className="flex h-16 items-center gap-[14px] rounded-[18px] border border-ink bg-card px-[18px] text-left text-[14px] font-medium"
            >
              <RadioDot on={on} size={23} />
              {o.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
