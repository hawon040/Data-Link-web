import { redirect } from "next/navigation";
import { nextStepFor, requireUser } from "@/lib/session";
import PayView from "./view";

export const dynamic = "force-dynamic";

export default async function PayPage() {
  const { user, status } = await requireUser();
  if (status !== "need_payment") redirect(nextStepFor(status));
  return <PayView userId={user.id} email={user.email ?? undefined} />;
}
