import { redirect } from "next/navigation";
import { nextStepFor, requireUser } from "@/lib/session";
import PhoneView from "./view";

export const dynamic = "force-dynamic";

export default async function PhonePage() {
  const { user, status } = await requireUser();
  if (status !== "need_identity") redirect(nextStepFor(status));
  return <PhoneView userId={user.id} />;
}
