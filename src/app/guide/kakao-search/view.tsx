import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 32 · ID 검색 허용 안내 (13:62)
const STEPS = ["카카오톡에서 내 프로필 열기", "우측 상단 설정 → 프로필 관리", "카카오톡 ID → 검색 허용 켜기"];

export default function KakaoGuideView({ backHref }: { backHref: string }) {
  return (
    <Screen
      title="카카오톡 설정 안내"
      badge="ID"
      backHref={backHref}
      footer={<BlockButton href={backHref}>설정 확인했어요</BlockButton>}
    >
      <Headline
        size={25}
        title="ID 검색을 허용해주세요"
        desc={
          <span className="mt-[18px] block">
            상대가 ID로 찾아올 수 있도록
            <br />
            교환 전에 설정을 확인해요.
          </span>
        }
      />
      <ol className="mt-[66px] flex flex-col gap-[18px]">
        {STEPS.map((s, i) => (
          <li key={s} className="flex h-[82px] items-center gap-[11px] rounded-[12px] border border-ink bg-card px-4">
            <span className="flex size-[42px] items-center justify-center rounded-full bg-mint text-[13px] font-bold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[14px] font-medium">{s}</span>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
