import { notFound } from "next/navigation";
import ChatRoom from "@/app/chat/[matchId]/chat-room";
import ExchangeView from "@/app/chat/[matchId]/exchange/exchange-view";
import HomeView from "@/app/home/home-view";
import TodayView from "@/app/today/today-view";

// 개발용 디자인 확인 화면 (Supabase 없이 예시 데이터로 렌더). 배포 환경에서는 404.
export default async function Preview({ params }: { params: Promise<{ screen: string }> }) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_PREVIEW) notFound();
  const { screen } = await params;
  const in18h = new Date(Date.now() + (18 * 60 + 42) * 60_000).toISOString();

  switch (screen) {
    case "home":
      return (
        <HomeView
          preview
          data={{
            nickname: "민지",
            dateLabel: "WED, OCT 14",
            matchDate: "2026-10-15",
            applied: true,
            purpose: "friend",
            sameGenderOnly: false,
            weekConnections: 42,
          }}
        />
      );
    case "today":
      return (
        <TodayView
          data={{
            dateLabel: "10월 14일 수요일",
            match: {
              id: "preview",
              nickname: "하늘",
              dept: "디자인영상학부",
              grade: 2,
              interests: ["영화", "카페 탐방", "헬스"],
              commonInterests: ["영화", "카페 탐방"],
            },
          }}
        />
      );
    case "today-empty":
      return <TodayView data={{ dateLabel: "10월 14일 수요일", match: null }} />;
    case "chat":
      return (
        <ChatRoom
          preview
          matchId="preview"
          myId="me"
          partnerId="p"
          partnerName="하늘"
          expiresAt={in18h}
          initialMessages={[
            { id: 1, sender_id: "p", body: "안녕하세요! 영화 좋아하시네요 😊\n최근에 재밌게 본 작품 있어요?", created_at: "" },
            { id: 2, sender_id: "me", body: "네! 저는 주말에 영화관 가는 걸\n좋아해요. 하늘님은요?", created_at: "" },
          ]}
        />
      );
    case "exchange":
      return (
        <ExchangeView preview data={{ matchId: "preview", myKakaoId: "minji1024", choice: null, partnerContact: null }} />
      );
    default:
      notFound();
  }
}
