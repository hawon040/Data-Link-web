import { requireUser } from "@/lib/session";
import WithdrawView from "./view";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  await requireUser();
  return <WithdrawView />;
}
