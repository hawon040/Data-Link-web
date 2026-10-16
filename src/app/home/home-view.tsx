"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BottomNav from "@/components/bottom-nav";
import { BrandHeader, Chip, Stamp } from "@/components/ui";
import { PURPOSES, PURPOSE_INFO, type Purpose } from "@/lib/config";
import { conditionParts, type Prefs } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/client";

// Figma 04 · 홈 / 신청 (2:57)
export type HomeData = {
  nickname: string;
  dateLabel: string; // "WED, OCT 14"
  applied: boolean;
  prefs: Prefs;
  weekConnections: number | null;
};

export default function HomeView({ data, preview = false }: { data: HomeData; preview?: boolean }) {
  const router = useRouter();
  const [applied, setApplied] = useState(data.applied);
  const [purpose, setPurpose] = useState<Purpose>(data.prefs.purpose);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleApplied() {
    setError(null);
    if (preview) {
      setApplied(!applied);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = applied
      ? await supabase.rpc("cancel_match")
      : await supabase.rpc("apply_match", { p_purpose: purpose });
    setBusy(false);
    if (error) return setError("신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    if (!applied) router.push("/match/applied");
    setApplied(!applied);
  }

  async function choosePurpose(p: Purpose) {
    setPurpose(p);
    if (preview) return;
    const supabase = createClient();
    // 이미 신청했다면 목적을 바꿔 다시 신청, 아니면 설정만 저장
    if (applied) await supabase.rpc("apply_match", { p_purpose: p });
    else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update({ pref_purpose: p }).eq("id", user.id);
    }
  }

  return (
    <div className="min-h-dvh bg-paper pb-[100px]">
      <BrandHeader title={`안녕하세요, ${data.nickname}님`} badge="1:1" />

      <section className="px-6 pt-[18px]">
        <p className="font-label text-[12px] whitespace-pre">{`${data.dateLabel}  ·  오늘의 교점`}</p>
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
                {PURPOSE_INFO[p.value].label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* match conditions */}
      <Link
        href="/match/conditions"
        className="mx-6 mt-[26px] block rounded-[12px] border-[1.5px] border-ink bg-card px-[16.5px] pt-[13.5px] pb-4"
      >
        <h3 className="text-[16px] font-bold">매칭 조건</h3>
        <p className="mt-[14px] text-[13px] whitespace-pre text-muted">{conditionParts(data.prefs).join("   ·   ")}</p>
        <p className="mt-[18px] text-[13px] font-bold whitespace-pre">{"조건 수정  →"}</p>
      </Link>

      {/* social proof */}
      <Link
        href="/stats"
        className="relative mx-6 mt-5 block h-[87px] rounded-[6px] border-2 border-ink bg-ink px-4 pt-[14px] text-card"
      >
        <p className="font-display text-[21px]">이번 주 {data.weekConnections ?? "-"}쌍</p>
        <p className="text-[13px] font-medium">새로운 친구가 되었어요</p>
        <span className="absolute -top-[13px] right-[-2px]">
          <Stamp rotate={6}>01 / DAILY RANDOM</Stamp>
        </span>
      </Link>

      <p className="mt-[26px] text-center text-[12px] text-muted">매칭 발표는 매일 낮 12시</p>
      {error && <p className="mt-2 text-center text-[12px] text-alert">{error}</p>}

      <BottomNav />
    </div>
  );
}
