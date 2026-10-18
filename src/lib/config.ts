// 서비스 규칙 (DB의 private.settings와 값을 맞춰 둘 것)
export const MESSAGE_LIMIT_PER_USER = 20;
export const CHAT_HOURS = 24;
export const MATCH_ANNOUNCE_HOUR_KST = 12;

// TODO: 백석대 학생 메일 도메인 확인 후 수정
export const SCHOOL_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN ?? "bu.ac.kr";

export const PURPOSES = [
  { value: "friend", label: "친구" },
  { value: "meal", label: "밥친구" },
  { value: "study", label: "스터디" },
] as const;

export type Purpose = (typeof PURPOSES)[number]["value"];

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// 관심사 선택지 (프로필 3~5개)
export const INTERESTS = ["영화", "카페 탐방", "음악", "독서", "운동", "여행", "게임", "맛집", "사진", "전시", "코딩", "공연"];

export const PURPOSE_INFO: Record<Purpose, { label: string; desc: string; detailTitle: string; detailDesc: string; glyph: string }> = {
  friend: { label: "친구", desc: "다른 학과의 새로운 친구를 만나고 싶어요", detailTitle: "새로운 친구", detailDesc: "다른 학과 친구를 사귀어요.", glyph: "" },
  meal: { label: "밥", desc: "함께 식사하며 가볍게 이야기하고 싶어요", detailTitle: "같이 밥 먹을 학우", detailDesc: "가볍게 식사하며 이야기해요.", glyph: "" },
  study: { label: "스터디", desc: "공부 주제를 나눌 학우를 찾고 싶어요", detailTitle: "함께 공부할 학우", detailDesc: "시험·과제·관심 분야를 나눠요.", glyph: "✎" },
};

export const GRADE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "학년 무관" },
  { value: 1, label: "1학년" },
  { value: 2, label: "2학년" },
  { value: 3, label: "3학년" },
  { value: 4, label: "4학년 이상" },
];

export function gradeLabel(v: number | null) {
  return v === null ? "학년 무관" : v === 4 ? "4학년 이상" : `${v}학년`;
}
