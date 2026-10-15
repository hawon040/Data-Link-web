// KST 기준 날짜 (YYYY-MM-DD)
export function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  now.setUTCDate(now.getUTCDate() + offsetDays);
  return now.toISOString().slice(0, 10);
}
