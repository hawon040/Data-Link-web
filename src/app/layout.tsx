import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "백석 랜덤매칭",
  description: "매일 정오, 백석대 학우 한 명과 1:1로 연결돼요.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <main className="mx-auto min-h-dvh max-w-md px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
