import { Headline, Screen, SquareArt } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 31 · 신고 접수 (13:47)
export default function ReportDoneView({ base }: { base: string }) {
  return (
    <Screen
      title="신고 완료"
      badge="SAFE"
      backHref={base}
      footer={
        <>
          <BlockButton href={`${base}/block`}>이 학우 차단하기</BlockButton>
          <BlockButton tone="card" href="/home">
            홈으로
          </BlockButton>
        </>
      }
    >
      <div className="mt-[76px]">
        <SquareArt>✓</SquareArt>
      </div>
      <Headline
        center
        title="신고가 접수됐어요"
        desc={
          <span className="mt-[14px] block text-[15px]">
            운영자가 내용을 검토합니다.
            <br />이 학우를 바로 차단할 수도 있어요.
          </span>
        }
      />
      <div className="mt-[46px] h-[102px] rounded-[12px] border border-ink bg-card px-[17px] pt-[26px] text-[14px] font-medium">
        신고 내용과 신고자 정보는
        <br />
        상대에게 알려지지 않습니다.
      </div>
    </Screen>
  );
}
