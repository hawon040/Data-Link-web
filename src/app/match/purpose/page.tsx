import type { Purpose } from "@/lib/config";
import { requireActive } from "@/lib/session";
import PurposeView from "./view";

export const dynamic = "force-dynamic";

export default async function PurposePage() {
  const { supabase, user } = await requireActive();
  const { data: me } = await supabase.from("profiles").select("pref_purpose").eq("id", user.id).maybeSingle();
  return <PurposeView initial={(me?.pref_purpose as Purpose) ?? "friend"} />;
}
