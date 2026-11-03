import { Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import NoticesAdminView, { type Notice } from "./view";

export const dynamic = "force-dynamic";

export default async function AdminNotices() {
  const { supabase } = await requireAdmin("notices");
  const { data } = await supabase
    .from("notices")
    .select("id, title, body, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Screen title="공지 관리" badge="ADMIN" backHref="/admin">
      <Headline size={23} title="공지" desc={<span className="mt-[10px] block">공지 화면(/notices)에 바로 보여요.</span>} />
      <NoticesAdminView notices={(data as Notice[] | null) ?? []} />
    </Screen>
  );
}
