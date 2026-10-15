"use client";

import { useState } from "react";
import { PURPOSES, type Purpose } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export default function ApplyForm({
  matchDate,
  alreadyApplied,
}: {
  matchDate: string;
  alreadyApplied: boolean;
}) {
  const [purpose, setPurpose] = useState<Purpose>("friend");
  // 옵션은 "같은 성별만" 하나. "이성만" 옵션은 두지 않는다 (docs/DECISIONS.md)
  const [sameGenderOnly, setSameGenderOnly] = useState(false);
  const [done, setDone] = useState(alreadyApplied);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("match_pool").insert({
      user_id: user.id,
      match_date: matchDate,
      purpose,
      same_gender_only: sameGenderOnly,
    });
    if (error) setError("신청하지 못했어요. 가입·본인인증을 마쳤는지 확인해 주세요.");
    else setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-xl border p-4 text-sm">
        내일 매칭 신청 완료! 정오에 알려드릴게요.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border p-5">
      <h2 className="font-semibold">내일 매칭 신청</h2>
      <div className="flex gap-2">
        {PURPOSES.map((p) => (
          <button
            key={p.value}
            onClick={() => setPurpose(p.value)}
            className={`flex-1 rounded-lg py-2 text-sm ${
              purpose === p.value ? "bg-accent text-white" : "border"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sameGenderOnly}
          onChange={(e) => setSameGenderOnly(e.target.checked)}
        />
        같은 성별과만 매칭
      </label>
      <button
        onClick={apply}
        className="rounded-xl bg-accent py-3 font-semibold text-white"
      >
        신청하기
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </section>
  );
}
