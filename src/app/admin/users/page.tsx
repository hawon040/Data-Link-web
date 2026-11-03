import { Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import UsersView, { type AdminUser } from "./view";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { supabase, user, perms } = await requireAdmin();
  if (!perms.some((p) => p === "suspend" || p === "avatars" || p === "admins")) {
    return (
      <Screen title="회원 관리" badge="ADMIN" backHref="/admin">
        <p className="pt-10 text-[14px] text-muted">회원 관리 권한이 없어요.</p>
      </Screen>
    );
  }

  const query = q.trim();
  const { data, error } = query ? await supabase.rpc("admin_find_users", { p_query: query }) : { data: [], error: null };

  return (
    <Screen title="회원 관리" badge="ADMIN" backHref="/admin">
      <Headline size={23} title="회원 찾기" desc={<span className="mt-[10px] block">닉네임 일부로 찾아요.</span>} />
      <form className="mt-[24px] flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="닉네임"
          className="h-[46px] flex-1 rounded-[7px] border-[1.5px] border-ink bg-card px-3 text-[15px]"
        />
        <button className="h-[46px] rounded-[7px] border-[1.5px] border-ink bg-ink px-4 text-[14px] font-bold text-card">검색</button>
      </form>
      {error && <p className="mt-4 text-[13px] text-alert">회원을 찾지 못했어요.</p>}
      <UsersView users={(data as AdminUser[] | null) ?? []} perms={perms} myId={user.id} searched={Boolean(query)} />
    </Screen>
  );
}
