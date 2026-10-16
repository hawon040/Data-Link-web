import Link from "next/link";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 29 · 개인정보와 안전 (13:17)
export default function PrivacyView({ kakaoHref = "/me/edit/kakao" }: { kakaoHref?: string }) {
  return (
    <Screen title="안전과 개인정보" badge="SAFE" backHref="/me" footer={<BlockButton href="/me">확인</BlockButton>}>
      <Headline size={24} title="내 정보는 내가 선택해요" />
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
          <p className="text-[16px] font-bold">카카오톡 ID</p>
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
      </div>
    </Screen>
  );
}
