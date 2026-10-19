import { requireUser } from "@/lib/session";
import ReportsView, { type MyReport } from "./view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("my_reports");
  return <ReportsView reports={(data as MyReport[] | null) ?? []} />;
}
