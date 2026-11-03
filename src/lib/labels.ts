// 서버·클라이언트 화면이 함께 쓰는 표시용 값 ("use client" 파일에서 export하면 서버 화면에서 쓸 수 없다)

// 신고 사유 (DB enum public.report_reason). 22·40번 신고 화면과 신고 내역에서 사용
export const REPORT_REASONS = [
  { value: "harassment", label: "불쾌한 언행·성희롱" },
  { value: "privacy", label: "개인정보 요구·유출" },
  { value: "fake_contact", label: "등록된 카카오톡 ID가 본인 것이 아님" },
  { value: "photo", label: "부적절한 프로필 사진" },
  { value: "other", label: "기타" },
] as const;

export const REPORT_REASON_LABEL: Record<string, string> = {
  ...Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label])),
  sexual: "불쾌한 언행·성희롱",
  spam: "기타",
};

// 운영자 권한 (DB private.admin_grants.permission)
export const ADMIN_PERMISSIONS = [
  { value: "reports", label: "신고·대화 기록 열람" },
  { value: "suspend", label: "이용 정지·해제" },
  { value: "avatars", label: "프로필 사진 삭제" },
  { value: "notices", label: "공지 관리" },
  { value: "admins", label: "운영자 권한 관리" },
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]["value"];

export const USER_STATUS_LABEL: Record<string, string> = {
  pending: "가입 중",
  active: "이용 중",
  suspended: "정지",
  withdrawn: "탈퇴",
};

// 운영자 DB 함수(admin_*)가 돌려주는 오류 코드 → 화면 문구
export function adminErrorMessage(message: string | undefined) {
  if (!message) return "처리하지 못했어요. 다시 시도해 주세요.";
  if (message.includes("FORBIDDEN")) return "이 작업을 할 권한이 없어요.";
  if (message.includes("CANNOT_TARGET_SELF")) return "자기 자신에게는 할 수 없어요.";
  if (message.includes("NOT_ACTIVE")) return "이용 중인 회원에게만 할 수 있어요.";
  if (message.includes("NOT_SUSPENDED")) return "정지된 회원이 아니에요.";
  if (message.includes("NOT_REPORTED")) return "신고가 접수된 대화만 볼 수 있어요.";
  if (message.includes("NOT_FOUND")) return "대상을 찾지 못했어요.";
  return "처리하지 못했어요. 다시 시도해 주세요.";
}

// 카카오톡 ID 가리기: skyfriend24 → sk****24
export function maskId(id: string) {
  if (id.length <= 4) return `${id[0] ?? ""}***`;
  return `${id.slice(0, 2)}****${id.slice(-2)}`;
}
