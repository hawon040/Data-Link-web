import { BackHeader } from "@/components/ui";

// 상단 ‹ 헤더 + 본문 + 하단 버튼 영역으로 구성된 Figma 공통 화면 틀
export function Screen({
  title,
  badge,
  backHref,
  bg = "paper",
  dark = false,
  children,
  footer,
}: {
  title: string;
  badge: React.ReactNode;
  backHref: string;
  bg?: "paper" | "lime" | "orange" | "ink";
  dark?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const bgCls = { paper: "bg-paper", lime: "bg-lime", orange: "bg-orange", ink: "bg-ink" }[bg];
  return (
    <div className={`flex min-h-dvh flex-col ${bgCls} ${dark ? "text-card" : "text-ink"}`}>
      <BackHeader title={title} badge={badge} backHref={backHref} />
      <main className="flex-1 px-6">{children}</main>
      {footer && <div className="flex flex-col gap-[9px] px-6 pt-6 pb-[42px]">{footer}</div>}
    </div>
  );
}

// "01 / 03  학교 인증" + 큰 제목 + 설명
export function Headline({
  step,
  title,
  desc,
  center = false,
  size = 27,
  descTone = "muted",
}: {
  step?: string;
  title: React.ReactNode;
  desc?: React.ReactNode;
  center?: boolean;
  size?: number;
  descTone?: "muted" | "ink";
}) {
  return (
    <section className={`pt-[26px] ${center ? "text-center" : ""}`}>
      {step && <p className="mb-[14px] text-[12px] font-bold whitespace-pre">{step}</p>}
      <h2 className="font-display leading-[1.45]" style={{ fontSize: size }}>
        {title}
      </h2>
      {desc && (
        <p className={`mt-[14px] text-[14px] ${descTone === "muted" ? "text-muted" : ""}`}>{desc}</p>
      )}
    </section>
  );
}

// 흰 카드 (라벨 + 값 / 제목 + 설명)
export function Card({
  children,
  className = "",
  shadow = false,
  as = "div",
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  as?: "div" | "button";
  onClick?: () => void;
  href?: string;
}) {
  const cls = `block w-full rounded-[12px] border border-ink bg-card px-[17px] py-[14px] text-left text-ink ${
    shadow ? "rounded-[8px] shadow-block" : ""
  } ${className}`;
  if (href)
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  if (as === "button")
    return (
      <button type="button" onClick={onClick} className={cls}>
        {children}
      </button>
    );
  return <div className={cls}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="block text-[12px] font-medium text-muted">{label}</span>
      <span className="mt-[14px] block text-[15px] font-medium">{children}</span>
    </>
  );
}

// Figma: toggle on / off (45×25, 검정 트랙 + 흰 원)
export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className="relative h-[25px] w-[45px] shrink-0 rounded-[13px] bg-ink"
    >
      <span
        className={`absolute top-[3px] size-[19px] rounded-full bg-card transition-[left] ${
          on ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

// 가운데 그림: 원 / 회전된 카드 / 둥근 사각
export function CircleArt({
  size = 136,
  tone = "mint",
  children,
  className = "",
}: {
  size?: number;
  tone?: "mint" | "pink" | "lime";
  children?: React.ReactNode;
  className?: string;
}) {
  const bg = { mint: "bg-mint", pink: "bg-pink", lime: "bg-lime" }[tone];
  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-full font-bold ${bg} ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

export function TiltCard({
  size = 156,
  rotate = 5,
  children,
}: {
  size?: number;
  rotate?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto flex items-center justify-center rounded-[7px] border-2 border-ink bg-mint text-ink shadow-block"
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  );
}

export function SquareArt({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex size-[150px] items-center justify-center rounded-[12px] bg-mint text-[46px] font-bold">
      {children}
    </div>
  );
}

// 라디오 원 (선택 시 검정 + ✓)
export function RadioDot({ on, size = 24, check = false }: { on: boolean; size?: number; check?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-card ${
        on ? "bg-ink" : "bg-chip"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {on && check ? "✓" : ""}
    </span>
  );
}
