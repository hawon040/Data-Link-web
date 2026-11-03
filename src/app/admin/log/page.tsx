import { Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/lib/labels";

export const dynamic = "force-dynamic";

type LogRow = {
  id: number;
  created_at: string;
  actor_nickname: string | null;
  action: string;
  target_nickname: string | null;
  detail: Record<string, unknown> | null;
};

const ACTION_LABEL: Record<string, string> = {
  view_messages: "대화 기록 열람",
  suspend: "이용 정지",
  unsuspend: "정지 해제",
  clear_avatar: "사진 삭제",
  grant: "권한 부여",
  revoke: "권한 회수",
  save_notice: "공지 저장",
  delete_notice: "공지 삭제",
};

const PERM_LABEL: Record<string, string> = Object.fromEntries(ADMIN_PERMISSIONS.map((p) => [p.value, p.label]));

function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function detailText(row: LogRow) {
  const d = row.detail ?? {};
  if (typeof d.permission === "string") return PERM_LABEL[d.permission] ?? d.permission;
  if (typeof d.note === "string" && d.note) return d.note;
  return "";
}

export default async function AdminLog() {
  const { supabase } = await requireAdmin("admins");
  const { data, error } = await supabase.rpc("admin_recent_log", { p_limit: 100 });
  const rows = (data as LogRow[] | null) ?? [];

  return (
    <Screen title="처리 기록" badge="ADMIN" backHref="/admin">
      <Headline size={23} title="최근 처리 기록" desc={<span className="mt-[10px] block">최근 100건</span>} />
      <div className="mt-[28px] flex flex-col pb-10">
        {error && <p className="text-[13px] text-alert">기록을 불러오지 못했어요.</p>}
        {!error && rows.length === 0 && <p className="text-[14px] text-muted">기록이 없어요.</p>}
        {rows.map((r) => (
          <div key={r.id} className="border-b border-ink py-[10px]">
            <p className="text-[13px]">
              <b>{r.actor_nickname ?? "(알 수 없음)"}</b> · {ACTION_LABEL[r.action] ?? r.action}
              {r.target_nickname && ` → ${r.target_nickname}`}
            </p>
            <p className="mt-[2px] text-[11px] text-muted">
              {kst(r.created_at)}
              {detailText(r) && ` · ${detailText(r)}`}
            </p>
          </div>
        ))}
      </div>
    </Screen>
  );
}
