import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 10 · 매칭 대기 (4:36) — 오늘 짝이 없었을 때
export default function NoneView() {
  return (
    <Screen
      title="오늘의 매칭"
      badge="1:1"
      backHref="/today"
      footer={
        <>
          <BlockButton href="/match/conditions">매칭 조건 보기</BlockButton>
          <p className="pt-[7px] text-center text-[12px] text-muted">다음 발표 · 내일 낮 12시</p>
        </>
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/waiting-orbit.svg" width={180} height={180} alt="" className="mx-auto mt-[90px]" />
      <Headline
        center
        title="오늘은 짝이 없어요"
        desc={
          <span className="mt-[20px] block text-[15px]">
            신청 인원이 홀수이거나 선택한 조건에
            <br />
            맞는 학우가 없었어요.
          </span>
        }
      />
      <div className="mt-[42px] rounded-[8px] border border-ink bg-card px-[17px] pt-4 pb-5 shadow-block">
        <p className="text-[17px] font-bold">내일 먼저 매칭해드릴게요</p>
        <p className="mt-[10px] text-[13px] text-muted">
          설정을 유지하면 자동으로 다시 참여해요.
          <br />
          필터를 조정하면 선택지가 넓어집니다.
        </p>
      </div>
    </Screen>
  );
}
