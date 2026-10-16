import { Card, CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 14 · 성인 인증 완료 (11:27)
export default function VerifiedView() {
  return (
    <Screen
      title="휴대폰 인증 결과"
      badge="19+"
      backHref="/signup/phone"
      footer={<BlockButton href="/signup/profile">프로필 만들기</BlockButton>}
    >
      <CircleArt className="mt-[76px] text-[48px]">✓</CircleArt>
      <Headline
        center
        title={
          <>
            만 19세 이상
            <br />
            확인이 완료됐어요
          </>
        }
        desc={
          <span className="text-[15px]">
            백석대 학생 인증과 휴대폰 본인 인증이
            <br />
            모두 완료되었습니다.
          </span>
        }
      />
      <Card className="mt-[45px] py-[19px] text-[14px] font-medium">
        <p>학교 이메일 인증 완료</p>
        <p className="mt-4">휴대폰 본인 인증 완료 · 만 19세 이상</p>
      </Card>
    </Screen>
  );
}
