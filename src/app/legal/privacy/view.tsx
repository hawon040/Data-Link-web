import { CHAT_RETENTION_DAYS, REPORT_RETENTION_DAYS, WITHDRAW_GRACE_DAYS } from "@/lib/config";
import { LegalDoc, type Section } from "../legal-doc";

// 개인정보처리방침 (초안 — 오픈 전 법률 검토 필요, docs/LEGAL.md)
// 실제 저장 항목과 맞출 것: supabase/migrations, src/app/api/identity/route.ts
const SECTIONS: Section[] = [
  {
    title: "모으는 정보",
    body: (
      <>
        <p>· 학교 이메일 주소</p>
        <p>· 휴대폰 본인인증 결과 중 생년월일, 성별, 중복가입확인정보(CI)를 변환한 값</p>
        <p>· 닉네임, 학과, 학년, 관심사, 한 줄 소개</p>
        <p>· 카카오톡 ID</p>
        <p>· 대화 내용, 매칭·신고·차단 기록, 접속 기록</p>
        <p>이름과 휴대폰 번호는 본인인증에만 쓰고 저장하지 않습니다.</p>
      </>
    ),
  },
  {
    title: "쓰는 곳",
    body: (
      <>
        <p>· 백석대 재학생이자 만 19세 이상인지 확인</p>
        <p>· 중복 가입과 재가입을 통한 제재 회피 방지</p>
        <p>· 매칭 (같은 성별만 옵션에 성별 사용)</p>
        <p>· 신고 검토와 이용 제한</p>
      </>
    ),
  },
  {
    title: "상대에게 보이는 정보",
    body: (
      <>
        <p>매칭된 상대에게는 닉네임, 학과, 학년, 관심사만 보입니다.</p>
        <p>카카오톡 ID는 두 사람이 모두 교환에 동의한 경우에만 그 상대 한 명에게 보입니다.</p>
        <p>그 밖의 정보는 다른 이용자나 외부에 제공하지 않습니다.</p>
      </>
    ),
  },
  {
    title: "보관 기간",
    body: (
      <>
        <p>· 대화 내용: 대화 종료 {CHAT_RETENTION_DAYS}일 뒤 삭제</p>
        <p>· 신고된 대화: 검토를 위해 {REPORT_RETENTION_DAYS}일 보관 후 삭제</p>
        <p>· 카카오톡 ID: 탈퇴 즉시 삭제</p>
        <p>· 그 밖의 계정 정보: 탈퇴 {WITHDRAW_GRACE_DAYS}일 뒤 삭제 (재가입 제한 기간)</p>
      </>
    ),
  },
  {
    title: "맡기는 곳",
    body: (
      <>
        <p>· Supabase: 데이터 저장, 로그인</p>
        <p>· 포트원, KG이니시스: 휴대폰 본인인증</p>
        <p>· 메일 발송 서비스: 학교 이메일 인증 코드 발송</p>
      </>
    ),
  },
  {
    title: "내 권리",
    body: (
      <>
        <p>내 정보 화면에서 프로필과 카카오톡 ID를 언제든 확인하고 고칠 수 있습니다.</p>
        <p>회원 탈퇴로 정보 삭제를 요청할 수 있습니다.</p>
      </>
    ),
  },
];

export default function PrivacyPolicyView({ backHref }: { backHref: string }) {
  return (
    <LegalDoc
      title="개인정보처리방침"
      headline={
        <>
          개인정보를
          <br />
          이렇게 다뤄요
        </>
      }
      sections={SECTIONS}
      backHref={backHref}
    />
  );
}
