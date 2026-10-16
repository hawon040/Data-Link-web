import Link from "next/link";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 21 · 채팅 안전 메뉴 (12:43)
export default function SafetyView({ base }: { base: string }) {
  return (
    <Screen
      title="안전 메뉴"
      badge="SAFE"
      backHref={base}
      footer={
        <BlockButton tone="card" href={base}>
          대화로 돌아가기
        </BlockButton>
      }
    >
      <div className="pt-[18px]" />
      <Headline
        title={
          <>
            불편한 일이
            <br />
            있었나요?
          </>
        }
        desc={
          <span className="mt-[16px] block">
            대화 중 언제든 신고하거나 차단할 수 있어요.
            <br />
            상대는 이 선택을 알 수 없습니다.
          </span>
        }
      />
      <div className="mt-[52px] flex flex-col gap-[19px]">
        <Link href={`${base}/report`} className="block h-[107px] rounded-[12px] border border-ink bg-card px-[17px] pt-[19px]">
          <p className="text-[17px] font-bold whitespace-pre text-alert">{"대화 신고하기  →"}</p>
          <p className="mt-[10px] text-[13px] text-muted">욕설·성희롱·잘못된 연락처 등을 알려주세요.</p>
        </Link>
        <Link href={`${base}/block`} className="block h-[107px] rounded-[12px] border border-ink bg-card px-[17px] pt-[19px]">
          <p className="text-[17px] font-bold whitespace-pre">{"이 학우 차단하기  →"}</p>
          <p className="mt-[10px] text-[13px] text-muted">차단 즉시 대화가 끝나고 다시 매칭되지 않아요.</p>
        </Link>
      </div>
    </Screen>
  );
}
