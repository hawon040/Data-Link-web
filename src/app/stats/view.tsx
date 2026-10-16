import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 38 · 이번 주 교점 (15:3)
export default function StatsView({ week }: { week: number | null }) {
  const n = week ?? 0;
  return (
    <Screen
      title="교점 이야기"
      badge="1:1"
      backHref="/home"
      bg="orange"
      footer={
        <>
          <BlockButton href="/match/purpose">나도 내일 참여하기</BlockButton>
          <BlockButton tone="card" href="/home">
            홈으로
          </BlockButton>
        </>
      }
    >
      <Headline
        title={
          <>
            이번 주 {n}쌍이
            <br />
            친구가 되었어요
          </>
        }
        descTone="ink"
        desc={
          <>
            서로 카카오톡 ID 교환에 동의한 수예요.
            <br />
            개별 이용자의 정보는 공개되지 않습니다.
          </>
        }
      />
      <div className="mt-[57px] h-[194px] rounded-[12px] bg-ink px-[21px] pt-[25px] text-card">
        <p className="text-[70px] leading-[1.45] font-bold">{n}</p>
        <p className="text-[16px] font-medium">이번 주 친구가 된 교점</p>
      </div>
    </Screen>
  );
}
