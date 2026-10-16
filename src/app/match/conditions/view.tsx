"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Headline, Screen, Toggle } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { gradeLabel } from "@/lib/config";
import type { Prefs } from "@/lib/prefs";
import { savePrefs } from "@/lib/save-prefs";

// Figma 16 · 매칭 조건 (11:59)
//       34 · 같은 성별 필터 켜짐 (13:101) — 같은 성별 필터를 켰을 때 확인 화면
//       43 · 같은 학과 제외 상태 (29:16) — 같은 학과를 끌 때 확인 화면
type Mode = "edit" | "gender" | "dept";

export default function ConditionsView({
  initial,
  applied,
  preview = false,
  initialMode = "edit",
}: {
  initial: Prefs;
  applied: boolean;
  preview?: boolean;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (preview) return router.push("/preview/04");
    setBusy(true);
    const ok = await savePrefs(prefs, applied);
    setBusy(false);
    if (!ok) return setError("저장하지 못했어요. 다시 시도해 주세요.");
    router.push("/home");
  }

  const saveButtons = (
    <>
      <BlockButton onClick={save} disabled={busy}>
        이 조건으로 저장
      </BlockButton>
      <BlockButton tone="card" onClick={() => setMode("edit")}>
        조건 다시 보기
      </BlockButton>
    </>
  );

  if (mode === "gender") {
    return (
      <Screen title="매칭 조건 설정" badge="1:1" backHref="/home" footer={saveButtons}>
        <Headline
          size={26}
          title={
            <>
              같은 성별과만
              <br />
              매칭할게요
            </>
          }
          desc={
            <>
              서로의 조건이 맞는 학우를 찾아요.
              <br />
              그날 신청자 수에 따라 매칭이 늦어질 수 있어요.
            </>
          }
        />
        <Card className="mt-[54px] pt-[19px] pb-5">
          <div className="flex items-start justify-between">
            <p className="text-[16px] font-bold">같은 성별과만 매칭</p>
            <Toggle
              on={prefs.sameGenderOnly}
              label="같은 성별과만 매칭"
              onChange={(v) => setPrefs({ ...prefs, sameGenderOnly: v })}
            />
          </div>
          <p className="mt-[14px] text-[12px] text-muted">이 조건은 언제든 변경할 수 있어요.</p>
        </Card>
        <Card className="mt-[23px] pt-[17px] pb-6">
          <p className="text-[16px] font-bold">매칭이 안 되면?</p>
          <p className="mt-[14px] text-[13px] text-muted">
            다음날 우선 매칭되며 필터를
            <br />
            다시 조정할 수 있어요.
          </p>
        </Card>
        {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
      </Screen>
    );
  }

  if (mode === "dept") {
    return (
      <Screen title="매칭 조건 설정" badge="1:1" backHref="/home" footer={saveButtons}>
        <Headline
          size={26}
          title={
            <>
              다른 학과 학우와
              <br />
              연결할게요
            </>
          }
          desc={
            <>
              같은 학과는 후보에서 제외됩니다.
              <br />
              당일 신청 인원에 따라 매칭이 늦어질 수 있어요.
            </>
          }
        />
        <Card className="mt-[46px] pt-[19px] pb-5">
          <div className="flex items-start justify-between">
            <p className="text-[16px] font-bold">같은 학과도 포함</p>
            <Toggle
              on={prefs.includeSameDept}
              label="같은 학과도 포함"
              onChange={(v) => setPrefs({ ...prefs, includeSameDept: v })}
            />
          </div>
          <p className="mt-[14px] text-[12px] text-muted">
            {prefs.includeSameDept ? "현재 포함됨" : "현재 제외됨"}
          </p>
        </Card>
        <Card className="mt-[23px] pt-[17px] pb-6">
          <p className="text-[16px] font-bold">다른 조건</p>
          <p className="mt-[19px] text-[14px] font-medium whitespace-pre">
            {`${prefs.sameGenderOnly ? "같은 성별만" : "성별 무관"}  ·  ${gradeLabel(prefs.targetGrade)}`}
          </p>
        </Card>
        {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
      </Screen>
    );
  }

  return (
    <Screen
      title="매칭 조건 설정"
      badge="1:1"
      backHref="/home"
      footer={
        <BlockButton onClick={save} disabled={busy}>
          조건 저장
        </BlockButton>
      }
    >
      <Headline
        size={24}
        title={
          <>
            편한 방식으로
            <br />
            새로운 학우를 만나요
          </>
        }
        desc={<span className="text-[13px]">서로의 조건이 맞는 경우에만 매칭돼요.</span>}
      />
      <div className="mt-[34px] flex flex-col gap-[13px]">
        <Card className="flex h-[85px] items-start justify-between pt-[27px]">
          <p className="text-[15px] font-medium">같은 학과도 포함</p>
          <Toggle
            on={prefs.includeSameDept}
            label="같은 학과도 포함"
            onChange={(v) => {
              setPrefs({ ...prefs, includeSameDept: v });
              if (!v) setMode("dept");
            }}
          />
        </Card>
        <Card className="pt-4 pb-[22px]">
          <div className="flex items-start justify-between">
            <p className="text-[15px] font-medium">같은 성별과만 매칭</p>
            <span className="pt-[11px]">
              <Toggle
                on={prefs.sameGenderOnly}
                label="같은 성별과만 매칭"
                onChange={(v) => {
                  setPrefs({ ...prefs, sameGenderOnly: v });
                  if (v) setMode("gender");
                }}
              />
            </span>
          </div>
          <p className="-mt-[6px] text-[12px] text-muted">기본은 성별에 관계없이 매칭됩니다.</p>
        </Card>
        <Link
          href={preview ? "/preview/39" : "/match/grade"}
          className="block h-[85px] rounded-[12px] border border-ink bg-card px-[17px] pt-4"
        >
          <p className="text-[15px] font-medium">학년</p>
          <p className="mt-[5px] text-[14px] font-bold whitespace-pre">{`${gradeLabel(prefs.targetGrade).replace("학년 무관", "무관")}    ▾`}</p>
        </Link>
        <Card className="mt-4 pt-[17px] pb-5">
          <p className="text-[13px] text-muted">
            필터가 많으면 짝을 찾기 어려울 수 있어요.
            <br />
            매칭 실패 시 다음날 우선 배정됩니다.
          </p>
        </Card>
      </div>
      {error && <p className="mt-3 text-[12px] text-alert">{error}</p>}
    </Screen>
  );
}
