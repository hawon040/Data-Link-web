import { Headline, Screen, TiltCard } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 30 · 후기 완료 (13:34)
export default function ReviewDoneView() {
  return (
    <Screen
      title="후기 저장"
      badge="1:1"
      backHref="/home"
      bg="lime"
      footer={
        <>
          <BlockButton href="/match/purpose">내일 매칭 참여하기</BlockButton>
          <BlockButton tone="card" href="/home">
            홈으로
          </BlockButton>
        </>
      }
    >
      <div className="mt-[83px]">
        <TiltCard size={150} rotate={5}>
          <span className="text-[46px] font-bold" style={{ transform: "rotate(3deg)" }}>
            ✓
          </span>
        </TiltCard>
      </div>
      <Headline
        center
        title={
          <>
            후기를 남겨주셔서
            <br />
            감사해요
          </>
        }
        descTone="ink"
        desc={
          <span className="mt-[16px] block text-[15px]">
            다음 교점을 더 편하게 만들어갈게요.
            <br />
            내일 매칭에 다시 참여해보세요.
          </span>
        }
      />
    </Screen>
  );
}
