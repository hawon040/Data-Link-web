"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 발표 시각까지 남은 시간. 기기 시계 대신 서버 시각(serverNow)을 기준으로 센다.
// 시각이 되면 화면을 새로 불러와 오늘의 학우를 보여준다 (공개 여부는 DB가 판단).
export default function NoonCountdown({ serverNow, announceAt }: { serverNow: number; announceAt: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(announceAt - serverNow);

  useEffect(() => {
    const offset = serverNow - Date.now();
    let refreshed = false;
    const tick = () => {
      const ms = announceAt - (Date.now() + offset);
      setLeft(ms);
      if (ms <= 0 && !refreshed) {
        refreshed = true;
        // 매칭 결과가 DB에 반영될 여유를 1초 둔다
        setTimeout(() => router.refresh(), 1000);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    // 백그라운드 탭은 타이머가 늦어지므로 다시 보일 때 바로 확인
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [serverNow, announceAt, router]);

  const s = Math.max(0, Math.ceil(left / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  return (
    <p className="font-display text-[40px] tabular-nums" role="timer" aria-label="발표까지 남은 시간">
      {s > 0 ? `${hh}:${mm}:${ss}` : "발표 중…"}
    </p>
  );
}
