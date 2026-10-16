import type { Purpose } from "@/lib/config";
import { gradeLabel } from "@/lib/config";

// profiles.pref_* (매칭 조건 설정)
export type Prefs = {
  purpose: Purpose;
  sameGenderOnly: boolean;
  includeSameDept: boolean;
  targetGrade: number | null;
};

export const PREF_COLUMNS =
  "pref_purpose, pref_same_gender_only, pref_include_same_dept, pref_target_grade";

export function toPrefs(row: {
  pref_purpose?: string | null;
  pref_same_gender_only?: boolean | null;
  pref_include_same_dept?: boolean | null;
  pref_target_grade?: number | null;
} | null): Prefs {
  return {
    purpose: (row?.pref_purpose as Purpose) ?? "friend",
    sameGenderOnly: row?.pref_same_gender_only ?? false,
    includeSameDept: row?.pref_include_same_dept ?? true,
    targetGrade: row?.pref_target_grade ?? null,
  };
}

export function toRow(p: Prefs) {
  return {
    pref_purpose: p.purpose,
    pref_same_gender_only: p.sameGenderOnly,
    pref_include_same_dept: p.includeSameDept,
    pref_target_grade: p.targetGrade,
  };
}

// "성별 무관 · 같은 학과 포함 · 학년 무관"
export function conditionParts(p: Prefs) {
  return [
    p.sameGenderOnly ? "같은 성별만" : "성별 무관",
    p.includeSameDept ? "같은 학과 포함" : "같은 학과 제외",
    gradeLabel(p.targetGrade),
  ];
}
