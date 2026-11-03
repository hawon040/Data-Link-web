import { Headline, Screen } from "@/components/screen";
import { isSupabaseConfigured, KAKAO_CHANNEL_URL, SUPPORT_EMAIL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Notice = { id: number; title: string; body: string; pinned: boolean; created_at: string };

function dateLabel(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCFullYear()}.${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
}

// 공지 · 문의 (로그인 전에도 볼 수 있다)
export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const backHref = from?.startsWith("/") && !from.startsWith("//") ? from : "/";

  let notices: Notice[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notices")
      .select("id, title, body, pinned, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    notices = (data as Notice[] | null) ?? [];
  }

  return (
    <Screen title="공지 · 문의" badge="INFO" backHref={backHref}>
      <Headline size={23} title="공지사항" />
      <div className="mt-[24px] flex flex-col gap-3">
        {notices.length === 0 && <p className="text-[14px] text-muted">올라온 공지가 없어요.</p>}
        {notices.map((n) => (
          <details key={n.id} open={n.pinned} className="rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="text-[15px] font-bold">
                {n.pinned && "📌 "}
                {n.title}
              </span>
              <span className="shrink-0 text-[12px] text-muted">{dateLabel(n.created_at)}</span>
            </summary>
            <p className="mt-[10px] text-[14px] whitespace-pre-wrap">{n.body}</p>
          </details>
        ))}
      </div>

      <h2 className="font-display mt-[36px] text-[18px]">문의하기</h2>
      <div className="mt-[8px] mb-10 rounded-[12px] border border-ink bg-card px-[17px]">
        {KAKAO_CHANNEL_URL && (
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-[59px] items-center text-[14px] font-medium ${SUPPORT_EMAIL ? "border-b border-ink" : ""}`}
          >
            카카오톡 채널로 문의 →
          </a>
        )}
        {SUPPORT_EMAIL && (
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex h-[59px] items-center text-[14px] font-medium">
            메일 문의 · {SUPPORT_EMAIL}
          </a>
        )}
        {!KAKAO_CHANNEL_URL && !SUPPORT_EMAIL && (
          <p className="flex h-[59px] items-center text-[14px] text-muted">문의 창구는 준비 중이에요. 공지를 확인해 주세요.</p>
        )}
      </div>
    </Screen>
  );
}
