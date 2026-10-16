import { notFound } from "next/navigation";
import StartPage from "@/app/page";
import BlockView from "@/app/chat/[matchId]/block/view";
import ChatRoom from "@/app/chat/[matchId]/chat-room";
import CopiedView from "@/app/chat/[matchId]/copied/view";
import EndedView from "@/app/chat/[matchId]/ended/view";
import ConfirmIdView from "@/app/chat/[matchId]/exchange/confirm/view";
import ExchangeView from "@/app/chat/[matchId]/exchange/exchange-view";
import { ClosedView, MutualView, WaitingView } from "@/app/chat/[matchId]/exchange/states";
import ReportDoneView from "@/app/chat/[matchId]/report/done/view";
import ReportView from "@/app/chat/[matchId]/report/view";
import ReviewDoneView from "@/app/chat/[matchId]/review/done/view";
import ReviewView from "@/app/chat/[matchId]/review/view";
import SafetyView from "@/app/chat/[matchId]/safety/view";
import TopicsView from "@/app/chat/[matchId]/topics/view";
import KakaoGuideView from "@/app/guide/kakao-search/view";
import HomeView from "@/app/home/home-view";
import AppliedView from "@/app/match/applied/view";
import ConditionsView from "@/app/match/conditions/view";
import GradeView from "@/app/match/grade/view";
import NoneView from "@/app/match/none/view";
import PurposeView from "@/app/match/purpose/view";
import BlocksView from "@/app/me/blocks/view";
import EditFieldView from "@/app/me/edit/[field]/view";
import PrivacyView from "@/app/me/privacy/view";
import ProfileEditView from "@/app/me/profile/view";
import MeView from "@/app/me/view";
import AgeLimitView from "@/app/signup/age-limit/view";
import CodeView from "@/app/signup/code/view";
import KakaoSetupView from "@/app/signup/kakao/view";
import PhoneView from "@/app/signup/phone/view";
import ProfileSetupView from "@/app/signup/profile/view";
import ResentView from "@/app/signup/resent/view";
import VerifiedView from "@/app/signup/verified/view";
import SignupStartView from "@/app/signup/view";
import StatsView from "@/app/stats/view";
import TodayView from "@/app/today/today-view";
import type { Prefs } from "@/lib/prefs";

export const dynamic = "force-dynamic";

// 개발용 디자인 확인: /preview/01 ~ /preview/46 (Figma 화면 번호)
// Supabase 없이 예시 데이터로 렌더. 배포 환경에서는 ENABLE_PREVIEW 없으면 404.
const B = "/preview";
const prefs: Prefs = { purpose: "friend", sameGenderOnly: false, includeSameDept: true, targetGrade: null };
const profile = { nickname: "민지", dept: "디자인영상학부", grade: 2, interests: ["영화", "카페 탐방", "음악"], bio: "낯가리지만 이야기는 좋아해요." };
const chatMsgs = [
  { id: 1, sender_id: "p", body: "안녕하세요! 영화 좋아하시네요 😊\n최근에 재밌게 본 작품 있어요?", created_at: "" },
  { id: 2, sender_id: "me", body: "네! 저는 주말에 영화관 가는 걸\n좋아해요. 하늘님은요?", created_at: "" },
];

function screen(n: string) {
  const in18h = new Date(Date.now() + (18 * 60 + 42) * 60_000).toISOString();
  switch (n) {
    case "01": return <StartPage />;
    case "02": return <SignupStartView preview />;
    case "03": return <AgeLimitView preview />;
    case "04": return <HomeView preview data={{ nickname: "민지", dateLabel: "WED, OCT 14", applied: true, prefs, weekConnections: 42 }} />;
    case "05": return <TodayView data={{ dateLabel: "10월 14일 수요일", match: { id: "preview", nickname: "하늘", dept: "디자인영상학부", grade: 2, interests: ["영화", "카페 탐방", "헬스"], commonInterests: ["영화", "카페 탐방"] } }} />;
    case "06":
    case "20":
    case "46": return <ChatRoom preview matchId="preview" myId="me" partnerName="하늘" expiresAt={in18h} initialMessages={chatMsgs} />;
    case "07": return <ExchangeView preview matchId="preview" myKakaoId="minji1024" />;
    case "08": return <MeView preview data={{ nickname: "민지", dept: "디자인영상학부", grade: 2, autoJoin: true, sameGenderOnly: false, verified: true }} />;
    case "09": return <ProfileSetupView preview initial={profile} />;
    case "10": return <NoneView />;
    case "11": return <MutualView preview base={B} partnerName="하늘" contact="skyfriend24" />;
    case "12": return <ReviewView preview base={B} matchId="preview" myId="me" partnerName="하늘" />;
    case "13": return <CodeView preview email="example@bu.ac.kr" />;
    case "14": return <VerifiedView />;
    case "15": return <KakaoSetupView preview />;
    case "16": return <ConditionsView preview initial={prefs} applied={false} />;
    case "17": return <PurposeView preview initial="friend" />;
    case "18": return <AppliedView summary="친구 · 성별 무관 · 학과 포함" />;
    case "19": return <TopicsView preview matchId="preview" myId="me" />;
    case "21": return <SafetyView base={B} />;
    case "22": return <ReportView preview base={B} matchId="preview" myId="me" partnerId="p" />;
    case "23": return <BlockView preview base={B} myId="me" partnerId="p" partnerName="하늘" />;
    case "24": return <ConfirmIdView preview matchId="preview" myKakaoId="mykakao24" />;
    case "25": return <WaitingView />;
    case "26": return <ClosedView base={B} />;
    case "27": return <ProfileEditView preview initial={profile} />;
    case "28": return <BlocksView blockedAt={["2026-10-14T03:00:00Z"]} />;
    case "29": return <PrivacyView kakaoHref="/preview/45" />;
    case "30": return <ReviewDoneView />;
    case "31": return <ReportDoneView base={B} />;
    case "32": return <KakaoGuideView backHref="/preview/15" />;
    case "33": return <PhoneView preview />;
    case "34": return <ConditionsView preview initial={{ ...prefs, sameGenderOnly: true }} applied={false} initialMode="gender" />;
    case "35": return <PurposeView preview initial="meal" initialDetail="meal" />;
    case "36": return <PurposeView preview initial="study" initialDetail="study" />;
    case "37": return <EndedView preview base={B} matchId="preview" partnerName="하늘" />;
    case "38": return <StatsView week={42} />;
    case "39": return <GradeView preview initial={prefs} applied={false} />;
    case "40": return <ReportView preview base={B} matchId="preview" myId="me" partnerId="p" initialReason="harassment" />;
    case "41": return <CopiedView base={B} partnerName="하늘" contact="skyfriend24" />;
    case "42": return <ResentView email="example@bu.ac.kr" />;
    case "43": return <ConditionsView preview initial={{ ...prefs, includeSameDept: false }} applied={false} initialMode="dept" />;
    case "44": return <EditFieldView preview field="nickname" initial="민지" />;
    case "45": return <EditFieldView preview field="kakao" initial="mykakao24" />;
    default: return null;
  }
}

export default async function Preview({ params }: { params: Promise<{ screen: string }> }) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_PREVIEW) notFound();
  const { screen: n } = await params;
  const view = screen(n.padStart(2, "0"));
  if (!view) notFound();
  return view;
}
