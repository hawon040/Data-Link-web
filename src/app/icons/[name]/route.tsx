import { ImageResponse } from "next/og";

// 홈 화면 아이콘 (manifest.webmanifest). Figma 아이콘이 나오면 public/ 의 PNG로 바꾼다
//   192.png · 512.png       — 일반
//   maskable-512.png        — 안드로이드가 원·물방울 모양으로 잘라도 글자가 남도록 여백을 크게
//   apple-180.png           — iOS 홈 화면
const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "192.png": { size: 192, maskable: false },
  "512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: false },
};

export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(SIZES).map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const spec = SIZES[(await params).name];
  if (!spec) return new Response("not found", { status: 404 });
  const { size, maskable } = spec;
  const box = Math.round(size * (maskable ? 0.56 : 0.78));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#28f300" }}>
        <div
          style={{
            width: box,
            height: box,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0b0b",
            borderRadius: box * 0.18,
            color: "#28f300",
            fontSize: box * 0.72,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          R
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
