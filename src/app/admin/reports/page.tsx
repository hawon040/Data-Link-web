import Link from "next/link";
import { Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import { REPORT_REASON_LABEL, USER_STATUS_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

type AdminReport = {
  id: number;
  created_at: string;
  reason: string;
  detail: string | null;
  match_id: string | null;
  reporter_nickname: string;
  reported_id: string;
  reported_nickname: string;
  reported_status: string;
  reported_count: number;
};

function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function AdminReports() {
  const { supabase } = await requireAdmin("reports");
  const { data, error } = await supabase.rpc("admin_reports", { p_limit: 200 });
  const reports = (data as AdminReport[] | null) ?? [];

  return (
    <Screen title="신고 처리" badge="ADMIN" backHref="/admin">
      <Headline size={23} title="접수된 신고" desc={<span className="mt-[10px] block">최근 200건. 신고자 3명이 모이면 자동으로 정지돼요.</span>} />
      <div className="mt-[32px] flex flex-col gap-3 pb-10">
        {error && <p className="text-[13px] text-alert">신고 목록을 불러오지 못했어요.</p>}
        {!error && reports.length === 0 && <p className="text-[14px] text-muted">접수된 신고가 없어요.</p>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold">{REPORT_REASON_LABEL[r.reason] ?? "기타"}</span>
              <span className="text-[12px] text-muted">{kst(r.created_at)}</span>
            </div>
            <p className="mt-[8px] text-[13px]">
              {r.reporter_nickname} → <b>{r.reported_nickname}</b>{" "}
              <span className="text-muted">
                ({USER_STATUS_LABEL[r.reported_status] ?? r.reported_status} · 신고자 {r.reported_count}명)
              </span>
            </p>
            {r.detail && <p className="mt-[6px] text-[13px] text-muted">{r.detail}</p>}
            <div className="mt-[10px] flex gap-4 text-[13px] font-bold">
              {r.match_id && <Link href={`/admin/reports/${r.match_id}`}>대화 기록 →</Link>}
              <Link href={`/admin/users?q=${r.reported_id}`}>회원 처리 →</Link>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
