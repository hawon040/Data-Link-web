import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/black-han-sans/400.css";
import "@fontsource/archivo/900.css";
import "@fontsource/anton/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "RANPICK · 교점",
  description: "매일 정오, 백석대 학우 한 명과 1:1로 연결돼요.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="mx-auto min-h-dvh max-w-[430px]">{children}</div>
      </body>
    </html>
  );
}
