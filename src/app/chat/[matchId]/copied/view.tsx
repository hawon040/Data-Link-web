import { Headline, Screen, SquareArt } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 41 · ID 복사 완료 (15:60)
export default function CopiedView({
  base,
  partnerName,
  contact,
}: {
  base: string;
  partnerName: string;
  contact: string;
}) {
  return (
    <Screen
      title="ID 복사"
      badge="ID"
      backHref={`${base}/exchange`}
      footer={
        <>
          <BlockButton href={`${base}/review`}>후기 남기기</BlockButton>
          <BlockButton tone="card" href={`${base}/report?reason=fake_contact`}>
            ID 문제 신고
          </BlockButton>
        </>
      }
    >
      <div className="mt-[78px]">
        <SquareArt>
          <span className="text-[50px]">✓</span>
        </SquareArt>
      </div>
      <Headline
        center
        title="ID를 복사했어요"
        desc={
          <span className="mt-[18px] block">
            카카오톡에서 {partnerName}님의 ID를 검색해보세요.
            <br />
            공개된 ID에 문제가 있다면 신고할 수 있어요.
          </span>
        }
      />
      <div className="mt-[61px] h-[84px] rounded-[12px] border border-ink bg-card px-[17px] pt-[11px]">
        <p className="text-[12px] font-medium text-muted">{partnerName}님의 카카오톡 ID</p>
        <p className="mt-[6px] text-[18px] font-bold select-all">{contact}</p>
      </div>
    </Screen>
  );
}
