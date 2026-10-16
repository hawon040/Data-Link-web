"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Figma: tab bar (2:64) — 홈 / 매칭 / 대화 / 내 정보
const TABS = [
  { href: "/home", label: "홈", icon: "/figma/nav-home.svg" },
  { href: "/today", label: "매칭", icon: "/figma/nav-shuffle.svg" },
  { href: "/chat", label: "대화", icon: "/figma/nav-chat.svg" },
  { href: "/me", label: "내 정보", icon: "/figma/nav-user.svg" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto h-[70px] max-w-[430px] border-t border-ink bg-card">
      <ul className="grid h-full grid-cols-4">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="flex h-full flex-col items-center pt-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.icon} width={24} height={24} alt="" />
                <span
                  className={`mt-[5px] text-[11px] font-medium ${
                    active ? "text-ink" : "text-muted"
                  }`}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
