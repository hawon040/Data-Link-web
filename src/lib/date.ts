// KST 기준 날짜 (YYYY-MM-DD)
export function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}

function kstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

// "WED, OCT 14"
export function kstDateLabelEn(): string {
  const d = kstNow();
  const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getUTCDay()];
  const mon = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ][d.getUTCMonth()];
  return `${day}, ${mon} ${d.getUTCDate()}`;
}

// "10월 14일 수요일"
export function kstDateLabelKo(): string {
  const d = kstNow();
  const day = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${day}요일`;
}
