import { requireActive } from "@/lib/session";
import CreditsView from "./view";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const { supabase, user } = await requireActive();
  const { data } = await supabase
    .rpc("my_wallet")
    .maybeSingle<{ credits: number; pack_price: number; pack_credits: number }>();
  return (
    <CreditsView
      userId={user.id}
      credits={data?.credits ?? 0}
      packPrice={data?.pack_price ?? 1000}
      packCredits={data?.pack_credits ?? 2}
    />
  );
}
