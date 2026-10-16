import ReportDoneView from "./view";

export default async function ReportDonePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <ReportDoneView base={`/chat/${matchId}`} />;
}
