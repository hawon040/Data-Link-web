import { loadMatch } from "@/lib/match";
import ReportView from "./view";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { matchId } = await params;
  const { reason } = await searchParams;
  const { user, partnerId } = await loadMatch(matchId);
  return (
    <ReportView
      base={`/chat/${matchId}`}
      matchId={matchId}
      myId={user.id}
      partnerId={partnerId}
      initialReason={reason === "fake_contact" ? "fake_contact" : null}
    />
  );
}
