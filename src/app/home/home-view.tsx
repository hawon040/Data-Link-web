"use client";

import { useState } from "react";
import BottomNav from "@/components/bottom-nav";
import { BrandHeader, Chip, Stamp } from "@/components/ui";
import { PURPOSES, type Purpose } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Figma 04 · 홈 / 신청 (2:57)
export type HomeData = {
  nickname: string;
  dateLabel: string; // "WED, OCT 14"
  matchDate: string; // 신청 대상 날짜 (내일, YYYY-MM-DD)
  applied: boolean;
  purpose: Purpose;
  sameGenderOnly: boolean;
  weekConnections: number | null;
};

// 디자인 표기: 친구 / 밥 / 스터디
const PURPOSE_LABEL: Record<Purpose, string> = { friend: "친구", meal: "밥", study: "스터디" };

export default function HomeView({ data, preview = false }: { data: HomeData; preview?: boolean }) {
  const [applied, setApplied] = useState(data.applied);
  const [purpose, setPurpose] = useState<Purpose>(data.purpose);
  const [sameGender, setSameGender] = useState(data.sameGenderOnly);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 신청 = match_pool 행 추가, 취소 = 삭제. 조건 변경은 삭제 후 다시 추가.
  async function save(next: { applied: boolean; purpose: Purpose; sameGender: boolean }) {
    setError(null);
    if (preview) return true;
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return false;
    }
    await supabase.from("match_pool").delete().eq("user_id", user.id).eq("match_date", data.matchDate);
    if (next.applied) {
      const { error } = await supabase.from("match_pool").insert({
        user_id: user.id,
        match_date: data.matchDate,
        purpose: next.purpose,
        same_gender_only: next.sameGender,
      });
      if (error) {
        setBusy(false);
        setError("신청하지 못했어요. 가입·본인인증을 마쳤는지 확인해 주세요.");
        return false;
      }
    }
    setBusy(false);
    return true;
  }

  async function toggleApplied() {
    const next = !applied;
    if (await save({ applied: next, purpose, sameGender })) setApplied(next);
  }
  async function choosePurpose(p: Purpose) {
    setPurpose(p);
    if (applied) await save({ applied, purpose: p, sameGender });
  }
  async function toggleSameGender() {
    const next = !sameGender;
    setSameGender(next);
    if (applied) await save({ applied, purpose, sameGender: next });
  }

  return (
    <div className="min-h-dvh bg-paper pb-[100px]">
      <BrandHeader title={`안녕하세요, ${data.nickname}님`} badge="1:1" />

      <section className="px-6 pt-[18px]">
        <p className="font-label text-[12px] whitespace-pre">
          {`${data.dateLabel}  ·  오늘의 교점`}
        </p>
        <h2 className="font-display mt-1 text-[29px] leading-[1.45]">
          내일도 새로운 학우를
          <br />
          만나볼까요?
        </h2>
      </section>

      {/* tomorrow match — 티켓 카드 */}
      <section className="relative mx-6 mt-[7px] h-[193px] rounded-[8px] bg-lime shadow-block">
        <div className="flex items-start justify-between px-[18px] pt-[27px]">
          <div>
            <h3 className="font-display text-[19px]">내일 매칭 참여</h3>
            <p className="mt-[6px] text-[13px] text-muted">
              밤 12시까지 신청하면 내일 정오에
              <br />
              오늘의 학우를 알려드려요.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={applied}
            aria-label="내일 매칭 참여"
            disabled={busy}
            onClick={toggleApplied}
            className={`relative mt-[9px] h-[26px] w-[46px] shrink-0 rounded-[13px] transition-colors ${
              applied ? "bg-ink" : "bg-muted/40"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/figma/toggle-knob.svg"
              width={20}
              height={20}
              alt=""
              className={`absolute top-[3px] transition-[left] ${applied ? "left-[22px]" : "left-[3px]"}`}
            />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/ticket-perforation.svg" width={306} height={2} alt="" className="absolute top-[109px] left-[18px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/ticket-notch.svg" width={12} height={12} alt="" className="absolute top-[104px] -left-[6px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/ticket-notch.svg" width={12} height={12} alt="" className="absolute top-[104px] -right-[6px]" />
        <div className="absolute top-[120px] left-[18px]">
          <p className="text-[12px] font-medium text-muted">만남 목적</p>
          <div className="mt-[3px] flex gap-[9px]">
            {PURPOSES.map((p) => (
              <Chip
                key={p.value}
                as="button"
                active={purpose === p.value}
                onClick={() => choosePurpose(p.value)}
                className={p.value === "friend" ? "w-20" : p.value === "meal" ? "w-[70px]" : "w-[88px]"}
              >
                {PURPOSE_LABEL[p.value]}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* match conditions */}
      <section className="mx-6 mt-[26px] rounded-[12px] border-[1.5px] border-ink bg-card px-[16.5px] pt-[13.5px] pb-4">
        <h3 className="text-[16px] font-bold">매칭 조건</h3>
        <p className="mt-[14px] text-[13px] whitespace-pre text-muted">
          {`${sameGender ? "같은 성별만" : "성별 무관"}   ·   같은 학과 포함   ·   학년 무관`}
        </p>
        {editing && (
          <label className="mt-3 flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={sameGender} onChange={toggleSameGender} disabled={busy} />
            같은 성별과만 매칭
          </label>
        )}
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="mt-[18px] text-[13px] font-bold whitespace-pre"
        >
          {editing ? "닫기" : "조건 수정  →"}
        </button>
      </section>

      {/* social proof */}
      <section className="relative mx-6 mt-5 h-[87px] rounded-[6px] border-2 border-ink bg-ink px-4 pt-[14px] text-card">
        <p className="font-display text-[21px]">
          이번 주 {data.weekConnections ?? "-"}쌍
        </p>
        <p className="text-[13px] font-medium">새로운 친구가 되었어요</p>
        <div className="absolute -top-[13px] right-[-2px]">
          <Stamp rotate={6}>01 / DAILY RANDOM</Stamp>
        </div>
      </section>

      <p className="mt-[26px] text-center text-[12px] text-muted">매칭 발표는 매일 낮 12시</p>
      {error && <p className="mt-2 text-center text-[12px] text-orange">{error}</p>}

      <BottomNav />
    </div>
  );
}
