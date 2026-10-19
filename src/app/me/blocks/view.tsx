import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 28 · 차단 목록 (13:3) — 상대 정보는 보여주지 않고 차단 날짜만
function label(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 차단`;
}

export default function BlocksView({ blockedAt }: { blockedAt: string[] }) {
  return (
    <Screen title="차단한 학우" badge="SAFE" backHref="/me" footer={<BlockButton href="/me">내 정보로</BlockButton>}>
      <Headline
        size={23}
        title="안전하게 대화할 수 있도록"
        desc={<span className="mt-[10px] block">차단한 학우와는 다시 매칭되지 않아요.</span>}
      />
      <div className="mt-[57px] flex flex-col gap-3">
        {blockedAt.length === 0 && <p className="text-[14px] text-muted">차단한 학우가 없어요.</p>}
        {blockedAt.map((t, i) => (
          <div key={i} className="flex h-[92px] items-center gap-[15px] rounded-[12px] border border-ink bg-card px-[15px]">
            <span className="size-12 shrink-0 rounded-full bg-mint" />
            <span>
              <span className="block text-[16px] font-bold">익명의 학우</span>
              <span className="mt-[8px] block text-[12px] text-muted">{label(t)}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-8 text-[13px] text-muted">
        차단 기록은 상대에게 알려지지 않아요.
        <br />한 번 만난 학우와는 차단과 상관없이 다시 매칭되지 않아요.
      </p>
    </Screen>
  );
}
