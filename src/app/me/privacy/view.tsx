import Link from "next/link";
import { maskId } from "@/lib/labels";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 29 · 개인정보와 안전 (13:17) — 카드 3개는 디자인 그대로, 실제 값과 신고 내역 카드를 더했다
export type PrivacyData = {
  kakaoId: string | null;
  reportCount: number;
  suspended: boolean;
};

export default function PrivacyView({
  data = { kakaoId: null, reportCount: 0, suspended: false },
  kakaoHref = "/me/edit/kakao",
  reportsHref = "/me/reports",
}: {
  data?: PrivacyData;
  kakaoHref?: string;
  reportsHref?: string;
}) {
  return (
    <Screen title="안전과 개인정보" badge="SAFE" backHref="/me" footer={<BlockButton href="/me">확인</BlockButton>}>
      <Headline size={24} title="내 정보는 내가 선택해요" />
      {data.suspended && (
        <div className="mt-[20px] rounded-[12px] border border-ink bg-pink px-[17px] py-[14px]">
          <p className="text-[14px] font-bold">지금은 이용이 정지된 상태예요</p>
          <p className="mt-[6px] text-[12px] text-muted">신고가 접수되어 운영자가 대화 기록을 검토하고 있어요.</p>
        </div>
      )}
      <div className="mt-[34px] flex flex-col gap-[17px]">
        <div className="h-[113px] rounded-[12px] border border-ink bg-card px-[17px] pt-4">
          <p className="text-[16px] font-bold">인증 정보</p>
          <p className="mt-[10px] text-[13px] text-muted">
            학교 인증과 성인 확인 결과만 이용합니다.
            <br />
            실명·학번·전화번호는 상대에게 보이지 않아요.
          </p>
        </div>
        <Link href={kakaoHref} className="block h-[113px] rounded-[12px] border border-ink bg-card px-[17px] pt-4">
          <p className="flex items-center justify-between text-[16px] font-bold">
            <span>카카오톡 ID</span>
            <span className="text-[13px] font-medium whitespace-pre">
              {data.kakaoId ? `${maskId(data.kakaoId)}  수정 →` : "등록 필요 →"}
            </span>
          </p>
          <p className="mt-[10px] text-[13px] text-muted">
            서로 동의할 때만 공개되며
            <br />
            탈퇴하면 저장된 ID를 삭제합니다.
          </p>
        </Link>
        <div className="h-[113px] rounded-[12px] border border-ink bg-card px-[17px] pt-4">
          <p className="text-[16px] font-bold">채팅 기록</p>
          <p className="mt-[10px] text-[13px] text-muted">
            종료 30일 뒤 삭제합니다.
            <br />
            신고 건은 검토를 위해 별도 보관합니다.
          </p>
        </div>
        <Link href={reportsHref} className="flex h-[68px] items-center justify-between rounded-[12px] border border-ink bg-card px-[17px]">
          <span className="text-[16px] font-bold">신고 내역</span>
          <span className="text-[13px] font-medium whitespace-pre">{`${data.reportCount}건  →`}</span>
        </Link>
      </div>
    </Screen>
  );
}
