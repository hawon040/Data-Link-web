// 휴대폰 번호 입력 공통 (가입비 결제·본인인증·매칭 구매)

// 숫자만 남기고 010-1234-5678 형태로 표시
export function formatPhone(digits: string) {
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function isPhone(digits: string) {
  return /^01[016789]\d{7,8}$/.test(digits);
}

// 가입비 결제 때 입력한 번호를 본인인증 화면에 미리 채운다 (이 기기 브라우저에만, DB에는 저장하지 않음)
const KEY = "ranpick_phone";
export function rememberPhone(digits: string) {
  try {
    sessionStorage.setItem(KEY, digits);
  } catch {}
}
export function recallPhone() {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
