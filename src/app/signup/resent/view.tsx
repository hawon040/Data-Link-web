import { CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 42 · 로그인 메일 재발송 (29:3)
export default function ResentView({ email }: { email: string }) {
  const q = email ? `?email=${encodeURIComponent(email)}` : "";
  return (
    <Screen
      title="이메일 인증"
      badge="19+"
      backHref={`/signup/code${q}`}
      footer={
        <>
          <BlockButton href={`/signup/code${q}`}>이전 화면으로</BlockButton>
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
        title="메일을 다시 보냈어요"
        desc={
          <>
            학교 이메일 받은편지함과 스팸함을 확인해요.
            <br />가장 최근에 받은 메일의 로그인을 눌러주세요.
          </>
        }
      />
    </Screen>
  );
}

