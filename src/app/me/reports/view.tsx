import { REPORT_REASON_LABEL } from "@/lib/labels";
import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// 내가 한 신고 — 28번(차단한 학우) 화면 틀을 따른다. 상대 정보는 보여주지 않는다
export type MyReport = { reported_at: string; reason: string; detail: string | null };

function dateLabel(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 접수`;
}

export default function ReportsView({ reports, backHref = "/me/privacy" }: { reports: MyReport[]; backHref?: string }) {
  return (
    <Screen title="신고 내역" badge="SAFE" backHref={backHref} footer={<BlockButton href={backHref}>확인</BlockButton>}>
      <Headline
        size={23}
        title="내가 접수한 신고"
        desc={<span className="mt-[10px] block">신고한 사실은 상대에게 알려지지 않아요.</span>}
      />
      <div className="mt-[57px] flex flex-col gap-3">
        {reports.length === 0 && <p className="text-[14px] text-muted">접수한 신고가 없어요.</p>}
        {reports.map((r, i) => (
          <div key={i} className="rounded-[12px] border border-ink bg-card px-[17px] py-[15px]">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold">{REPORT_REASON_LABEL[r.reason] ?? "기타"}</span>
              <span className="text-[12px] text-muted">{dateLabel(r.reported_at)}</span>
            </div>
            {r.detail && <p className="mt-[8px] text-[13px] text-muted">{r.detail}</p>}
            <p className="mt-[8px] text-[12px] font-medium">운영자가 대화 기록을 검토해요</p>
          </div>
        ))}
      </div>
    </Screen>
  );
}
