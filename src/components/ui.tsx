import Link from "next/link";

// Figma: ui/status badge (61:6)
export function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-label inline-flex h-7 w-[50px] items-center justify-center rounded-[5px] border-[1.5px] border-ink bg-orange px-1 text-[11px] leading-none text-ink">
      {children}
    </span>
  );
}

// Figma: daily stamp / match stamp / verified sticker
export function Stamp({
  children,
  tone = "lime",
  rotate = 6,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "lime" | "orange";
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`font-label inline-flex h-[29px] w-[161px] items-center justify-center rounded-[14px] border-2 border-ink px-2 text-[10px] leading-none text-ink ${
        tone === "lime" ? "bg-lime" : "bg-orange"
      } ${className}`}
    >
      {children}
    </span>
  );
}

// 홈·오늘의 학우 상단: 라임 사각형 + 셔플 아이콘 + 제목 + 배지
export function BrandHeader({
  title,
  badge,
}: {
  title: string;
  badge: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-6 pt-[54px]">
      <div className="flex items-center gap-1">
        <span className="flex size-[27px] items-center justify-center bg-lime">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/brand-shuffle.svg" width={19} height={19} alt="" />
        </span>
        <h1 className="text-[20px] font-bold">{title}</h1>
      </div>
      <StatusBadge>{badge}</StatusBadge>
    </header>
  );
}

// 대화·교환 상단: ‹ 뒤로 + 제목 + 배지
export function BackHeader({
  title,
  badge,
  backHref,
}: {
  title: string;
  badge: React.ReactNode;
  backHref: string;
}) {
  return (
    <header className="flex items-center justify-between pr-6 pl-[22px] pt-[47px]">
      <div className="flex items-center gap-1.5">
        <Link href={backHref} aria-label="뒤로" className="w-[13px] text-[28px] leading-[1.45]">
          ‹
        </Link>
        <h1 className="pt-2 text-[20px] font-bold">{title}</h1>
      </div>
      <span className="pt-2">
        <StatusBadge>{badge}</StatusBadge>
      </span>
    </header>
  );
}

// 칩 (만남 목적·관심사)
export function Chip({
  children,
  active = false,
  as = "span",
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  as?: "span" | "button";
  onClick?: () => void;
  className?: string;
}) {
  const cls = `inline-flex h-[34px] items-center justify-center rounded-[17px] px-5 text-[12px] font-medium ${
    active ? "bg-ink text-card" : "bg-chip text-muted"
  } ${className}`;
  return as === "button" ? (
    <button type="button" onClick={onClick} className={cls} aria-pressed={active}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
}

// 큰 버튼: button/대화 시작하기, 교환할게요 등
export function BlockButton({
  children,
  tone = "ink",
  href,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  tone?: "ink" | "card" | "lime";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const toneCls =
    tone === "ink"
      ? "bg-ink text-card"
      : tone === "lime"
        ? "bg-lime text-ink"
        : "bg-card text-ink";
  const cls = `flex h-[52px] w-full items-center justify-center rounded-[7px] border-[1.5px] border-ink text-[15px] font-bold disabled:opacity-50 ${toneCls}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
