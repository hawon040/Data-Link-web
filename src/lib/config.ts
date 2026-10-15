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
