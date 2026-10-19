// 서버·클라이언트 화면이 함께 쓰는 표시용 값 ("use client" 파일에서 export하면 서버 화면에서 쓸 수 없다)

// 신고 사유 (DB enum public.report_reason). 22·40번 신고 화면과 신고 내역에서 사용
export const REPORT_REASONS = [
  { value: "harassment", label: "불쾌한 언행·성희롱" },
  { value: "privacy", label: "개인정보 요구·유출" },
  { value: "fake_contact", label: "등록된 카카오톡 ID가 본인 것이 아님" },
  { value: "other", label: "기타" },
] as const;

export const REPORT_REASON_LABEL: Record<string, string> = {
  ...Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label])),
  sexual: "불쾌한 언행·성희롱",
  spam: "기타",
};

// 카카오톡 ID 가리기: skyfriend24 → sk****24
export function maskId(id: string) {
  if (id.length <= 4) return `${id[0] ?? ""}***`;
  return `${id.slice(0, 2)}****${id.slice(-2)}`;
}
