import Link from "next/link";
import BottomNav from "@/components/bottom-nav";
import { BlockButton, BrandHeader, Chip, Stamp } from "@/components/ui";

// Figma 05 · 오늘의 학우 (2:98)
export type TodayData = {
  dateLabel: string; // "10월 14일 수요일"
  match: null | {
    id: string;
    nickname: string;
    dept: string;
    grade: number;
    commonInterests: string[];
    interests: string[];
  };
};

export default function TodayView({ data }: { data: TodayData }) {
  const m = data.match;
  // 공통 관심사를 먼저, 없으면 상대 관심사를 보여준다 (최대 2개)
  const chips = m ? (m.commonInterests.length ? m.commonInterests : m.interests).slice(0, 2) : [];

  return (
    <div className="min-h-dvh bg-lime pb-[100px]">
      <BrandHeader title="오늘의 학우" badge="1:1" />

      <section className="px-6 pt-[18px]">
        <p className="font-label text-[13px]">{data.dateLabel} · 오늘의 교점</p>
        <h2 className="font-display mt-1 text-[27px] leading-[1.45]">
          {m ? (
            <>
              새로운 교점이
              <br />
              도착했어요!
            </>
          ) : (
            <>
              오늘은 교점이
              <br />
              없어요
            </>
          )}
        </h2>
      </section>

      {m ? (
        <>
          <section className="relative mx-6 mt-[15px] rounded-[8px] border-[1.5px] border-ink bg-card px-5 pt-5 pb-[38px] text-center shadow-block">
            <div className="relative mx-auto size-[118px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/avatar.svg" width={118} height={118} alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/figma/random-identity.svg"
                width={48}
                height={48}
                alt=""
                className="absolute top-[35px] left-[35px]"
              />
            </div>
            <p className="mt-[18px] text-[23px] font-bold">{m.nickname}님</p>
            <p className="mt-[2px] text-[13px] text-muted">
              {m.dept} · {m.grade}학년
            </p>
            <p className="mx-auto mt-[7px] flex h-9 w-[230px] items-center justify-center rounded-[18px] bg-mint text-[13px] font-bold">
              {m.commonInterests.length > 0
                ? `공통 관심사 ${m.commonInterests.length}개`
                : "새로운 관심사를 가진 학우"}
            </p>
            {chips.length > 0 && (
              <div className="mt-5 flex justify-center gap-[11px]">
                {chips.map((c) => (
                  <Chip key={c} className="min-w-[106px]">
                    {c}
                  </Chip>
                ))}
              </div>
            )}
            <div className="absolute -top-[10px] right-[-2px]">
              <Stamp tone="orange" rotate={7}>
                RANDOM 01 / 01
              </Stamp>
            </div>
          </section>

          <p className="mt-[26px] text-center text-[12px]">닉네임·학과·관심사만 공개됩니다.</p>
          <div className="mt-[24px] px-6">
            <BlockButton href={`/chat/${m.id}/topics`}>대화 시작하기</BlockButton>
          </div>
          <p className="mt-[11px] text-center text-[11px]">
            상대가 불편하다면 언제든 신고·차단할 수 있어요.
          </p>
        </>
      ) : (
        <section className="mx-6 mt-[15px] rounded-[8px] border-[1.5px] border-ink bg-card p-6 text-center shadow-block">
          <p className="text-[14px]">
            오늘 매칭을 신청하지 않았거나
            <br />
            짝이 맞지 않았어요. 짝이 없던 날은
            <br />
            다음 날 먼저 매칭해 드려요.
          </p>
          <Link href="/home" className="mt-4 inline-block text-[13px] font-bold whitespace-pre">
            {"내일 매칭 신청하기  →"}
          </Link>
        </section>
      )}

      <BottomNav />
    </div>
  );
}
