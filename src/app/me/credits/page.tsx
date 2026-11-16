import { requireActive } from "@/lib/session";
import CreditsView from "./view";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const { supabase, user } = await requireActive();
  const [{ data }, { data: me }] = await Promise.all([
    supabase.rpc("my_wallet").maybeSingle<{ credits: number; pack_price: number; pack_credits: number }>(),
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
  ]);
  return (
    <CreditsView
      userId={user.id}
      email={user.email ?? undefined}
      nickname={(me?.nickname as string | undefined) ?? undefined}
      credits={data?.credits ?? 0}
      packPrice={data?.pack_price ?? 1000}
      packCredits={data?.pack_credits ?? 2}
    />
  );
}
