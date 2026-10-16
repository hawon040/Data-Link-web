import { redirect } from "next/navigation";
import { nextStepFor, requireUser } from "@/lib/session";
import KakaoSetupView from "./view";

export const dynamic = "force-dynamic";

export default async function KakaoSetupPage() {
  const { status } = await requireUser();
  if (status !== "need_kakao") redirect(nextStepFor(status));
  return <KakaoSetupView />;
}
