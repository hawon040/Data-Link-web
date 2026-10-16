import Link from "next/link";
import { Headline, Screen, TiltCard } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 18 · 신청 완료 (11:106)
export default function AppliedView({ summary }: { summary: string }) {
  return (
    <Screen title="내일 매칭 신청" badge="1:1" backHref="/home" bg="lime" footer={<BlockButton href="/home">홈으로</BlockButton>}>
      <div className="mt-[83px]">
        <TiltCard size={172} rotate={5}>
          <div className="text-center">
            <p className="text-[58px] leading-[1.2] font-bold">12</p>
            <p className="text-[14px] font-bold">NOON</p>
          </div>
        </TiltCard>
      </div>
      <Headline
        center
        title="신청이 완료됐어요"
        descTone="ink"
        desc={
          <span className="mt-[20px] block text-[15px]">
            내일 낮 12시에 오늘의 학우를 알려드려요.
            <br />
            알림을 허용하면 놓치지 않을 수 있어요.
          </span>
        }
      />
      <Link href="/match/conditions" className="mt-[42px] block h-[88px] rounded-[12px] border border-ink bg-card px-[17px] pt-[18px]">
        <p className="text-[14px] font-medium">{summary}</p>
        <p className="mt-[19px] text-[10px] font-bold whitespace-pre">{"조건 수정  →"}</p>
      </Link>
    </Screen>
  );
}
