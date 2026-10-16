import { notFound } from "next/navigation";
import { requireActive } from "@/lib/session";
import EditFieldView from "./view";

export const dynamic = "force-dynamic";

export default async function EditFieldPage({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  if (field !== "nickname" && field !== "kakao") notFound();
  const { supabase, user } = await requireActive();

  let initial = "";
  if (field === "kakao") {
    const { data } = await supabase.rpc("get_my_kakao_id");
    initial = (data as string | null) ?? "";
  } else {
    const { data } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
    initial = data?.nickname ?? "";
  }
  return <EditFieldView field={field} initial={initial} />;
}
