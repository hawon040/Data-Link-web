import Link from "next/link";
import { redirect } from "next/navigation";
import { Stamp } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Figma 01 · 시작 (2:3) — 장식용 원 위치는 디자인 좌표 그대로
const BLOBS: { src: string; left: number; top: string }[] = [
  { src: "/figma/ellipse-green.svg", left: -84, top: "-23px" },
  { src: "/figma/ellipse-green.svg", left: 243, top: "34px" },
  { src: "/figma/ellipse-cream.svg", left: -17, top: "77px" },
  { src: "/figma/ellipse-green.svg", left: 149, top: "calc(50% - 126px)" },
  { src: "/figma/ellipse-orange.svg", left: 57, top: "calc(50% - 65px)" },
  { src: "/figma/ellipse-orange.svg", left: -129, top: "calc(50% + 51px)" },
  { src: "/figma/ellipse-orange.svg", left: 276, top: "calc(50% + 74px)" },
];

export default async function StartPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/home");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink text-card">
      <div className="absolute inset-y-0 left-1/2 w-[390px] -translate-x-1/2">
        {BLOBS.map((b, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={b.src}
            width={200}
            height={155}
            alt=""
            className="absolute"
            style={{ left: b.left, top: b.top }}
          />
        ))}

        <p className="font-poster absolute top-[calc(50%-163px)] w-full text-center text-[16px]">
          ONE RANDOM MATCH / EVERY DAY
        </p>
        <h1 className="font-poster absolute top-[calc(50%-77px)] w-full text-center text-[79px] leading-[1.45]">
          RANPICK
        </h1>
        <div className="absolute top-[calc(50%+130px)] left-[90px]">
          <Stamp tone="orange" rotate={7} className="w-[204px] h-[34px]">
            BAEKSEOK VERIFIED
          </Stamp>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[60px] flex flex-col items-center gap-2.5 px-7">
        <Link
          href="/signup"
          className="flex h-[52px] w-full items-center justify-center rounded-[7px] border-[1.5px] border-ink bg-lime text-[15px] font-bold text-ink"
        >
          백석대 이메일로 시작하기
        </Link>
        <p className="text-[13px] font-medium whitespace-pre">
          ✓ 학교 인증 학우만    ✓ 연락처는 상호 동의 후
        </p>
      </div>
    </div>
  );
}
