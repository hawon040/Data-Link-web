import { redirect } from "next/navigation";
import { nextStepFor, requireUser } from "@/lib/session";
import ProfileSetupView from "./view";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const { status } = await requireUser();
  if (status !== "need_profile") redirect(nextStepFor(status));
  return <ProfileSetupView />;
}
