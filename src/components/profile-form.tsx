"use client";

import { Chip } from "@/components/ui";
import { INTERESTS } from "@/lib/config";

// 09 프로필 설정 / 27 프로필 수정 공통 입력부
export type ProfileInput = {
  nickname: string;
  dept: string;
  grade: number;
  interests: string[];
  bio: string;
};

export function validateProfile(p: ProfileInput): string | null {
  if (p.nickname.trim().length < 2 || p.nickname.trim().length > 12) return "닉네임은 2~12자로 정해 주세요.";
  if (!p.dept.trim()) return "학과를 입력해 주세요.";
  if (p.interests.length < 3 || p.interests.length > 5) return "관심사를 3~5개 골라 주세요.";
  if (p.bio.length > 60) return "한 줄 소개는 60자 이내로 적어 주세요.";
  return null;
}

export default function ProfileForm({
  value,
  onChange,
  interestLabel = "관심사 3~5개",
}: {
  value: ProfileInput;
  onChange: (v: ProfileInput) => void;
  interestLabel?: string;
}) {
  const set = (patch: Partial<ProfileInput>) => onChange({ ...value, ...patch });
  function toggleInterest(i: string) {
    const has = value.interests.includes(i);
    if (!has && value.interests.length >= 5) return;
    set({ interests: has ? value.interests.filter((x) => x !== i) : [...value.interests, i] });
  }

  return (
    <div className="flex flex-col">
      <label className="block rounded-[12px] border border-ink bg-card px-[15px] pt-[9px] pb-[14px]">
        <span className="block text-[12px] font-medium text-muted">닉네임</span>
        <input
          value={value.nickname}
          maxLength={12}
          onChange={(e) => set({ nickname: e.target.value })}
          placeholder="실명 대신 부를 이름"
          className="mt-[6px] w-full bg-transparent text-[15px] font-medium placeholder:text-ink/40 focus:outline-none"
        />
      </label>

      <div className="mt-[11px] rounded-[12px] border border-ink bg-card px-[15px] pt-[9px] pb-[14px]">
        <span className="block text-[12px] font-medium text-muted">학과 · 학년</span>
        <div className="mt-[6px] flex items-center gap-2 text-[15px] font-medium">
          <input
            value={value.dept}
            onChange={(e) => set({ dept: e.target.value })}
            placeholder="디자인영상학부"
            aria-label="학과"
            className="min-w-0 flex-1 bg-transparent placeholder:text-ink/40 focus:outline-none"
          />
          <span aria-hidden>·</span>
          <select
            value={value.grade}
            onChange={(e) => set({ grade: Number(e.target.value) })}
            aria-label="학년"
            className="bg-transparent focus:outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-[31px] text-[14px] font-bold">{interestLabel}</p>
      <div className="mt-[10px] flex flex-wrap gap-x-[9px] gap-y-3">
        {INTERESTS.map((i) => (
          <Chip key={i} as="button" active={value.interests.includes(i)} onClick={() => toggleInterest(i)} className="min-w-[75px]">
            {i}
          </Chip>
        ))}
      </div>

      <label className="mt-[27px] block rounded-[12px] border border-ink bg-card px-[15px] pt-[9px] pb-[14px]">
        <span className="block text-[12px] font-medium text-muted">한 줄 소개</span>
        <input
          value={value.bio}
          maxLength={60}
          onChange={(e) => set({ bio: e.target.value })}
          placeholder="낯가리지만 이야기는 좋아해요."
          className="mt-[6px] w-full bg-transparent text-[14px] placeholder:text-ink/40 focus:outline-none"
        />
      </label>
    </div>
  );
}
