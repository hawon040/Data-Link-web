import { Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { LEGAL_VERSION, SUPPORT_EMAIL } from "@/lib/config";

// 약관·개인정보처리방침 공통 틀 — 29번(안전과 개인정보) 화면의 카드 스타일을 따른다
export type Section = { title: string; body: React.ReactNode };

export function LegalDoc({
  title,
  headline,
  sections,
  backHref,
}: {
  title: string;
  headline: React.ReactNode;
  sections: Section[];
  backHref: string;
}) {
  return (
    <Screen title={title} badge="SAFE" backHref={backHref} footer={<BlockButton href={backHref}>확인</BlockButton>}>
      <Headline size={24} title={headline} desc={`시행일 ${LEGAL_VERSION.replaceAll("-", ". ")}.`} />
      <div className="mt-[34px] flex flex-col gap-[17px]">
        {sections.map((s, i) => (
          <section key={s.title} className="rounded-[12px] border border-ink bg-card px-[17px] py-4">
            <h3 className="text-[16px] font-bold">
              {i + 1}. {s.title}
            </h3>
            <div className="mt-[10px] flex flex-col gap-[6px] text-[13px] leading-[1.6] text-muted">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-[21px] text-center text-[11px] text-muted">
        {SUPPORT_EMAIL ? `문의 ${SUPPORT_EMAIL}` : "문의처는 앱 공지사항에서 안내해요."}
      </p>
    </Screen>
  );
}

// "?from=/signup" 처럼 돌아갈 곳을 받는다. 외부 주소는 무시
export function safeBack(from: string | undefined, fallback: string) {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : fallback;
}
