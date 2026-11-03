import { Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/labels";

export const dynamic = "force-dynamic";

type AdminMessage = { id: number; sender_id: string; sender_nickname: string; body: string; masked: boolean; created_at: string };

function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// 신고된 대화 기록 (열람은 DB에 기록된다)
export default async function AdminMatchMessages({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase } = await requireAdmin("reports");
  const { data, error } = await supabase.rpc("admin_match_messages", { p_match_id: matchId });
  const messages = (data as AdminMessage[] | null) ?? [];
  const first = messages[0]?.sender_id;

  return (
    <Screen title="대화 기록" badge="ADMIN" backHref="/admin/reports">
      <Headline size={21} title="신고된 대화" desc={<span className="mt-[10px] block">열람한 사실이 처리 기록에 남아요.</span>} />
      <div className="mt-[28px] flex flex-col gap-2 pb-10">
        {error && <p className="text-[13px] text-alert">{adminErrorMessage(error.message)}</p>}
        {!error && messages.length === 0 && (
          <p className="text-[14px] text-muted">남아 있는 메시지가 없어요. (보관 기간이 지나 삭제됐을 수 있어요)</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-[10px] border border-ink px-3 py-2 ${
              m.sender_id === first ? "self-start bg-card" : "self-end bg-mint"
            }`}
          >
            <p className="text-[11px] text-muted">
              {m.sender_nickname} · {kst(m.created_at)}
              {m.masked && " · 연락처 가려짐"}
            </p>
            <p className="mt-[2px] text-[14px] break-words whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
    </Screen>
  );
}
