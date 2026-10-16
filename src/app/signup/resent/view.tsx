import { CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 42 · 인증 코드 재발송 (29:3)
export default function ResentView({ email }: { email: string }) {
  const q = email ? `?email=${encodeURIComponent(email)}` : "";
  return (
    <Screen
      title="이메일 인증"
      badge="19+"
      backHref={`/signup/code${q}`}
      footer={
        <>
          <BlockButton href={`/signup/code${q}`}>코드 입력하기</BlockButton>
          <BlockButton tone="card" href="/signup">
            이메일 다시 입력
          </BlockButton>
        </>
      }
    >
      <CircleArt size={148} className="mt-[70px] text-[42px]">
        ✉
      </CircleArt>
      <Headline
        center
        title="코드를 다시 보냈어요"
        desc={
          <>
            학교 이메일 받은편지함과 스팸함을 확인해요.
            <br />새 인증 코드는 3분 동안 유효합니다.
          </>
        }
      />
    </Screen>
  );
}

