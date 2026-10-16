"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleArt, Headline, Screen } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Figma 23 · 차단 확인 (12:82)
export default function BlockView({
  base,
  myId,
  partnerId,
  partnerName,
  preview = false,
}: {
  base: string;
  myId: string;
  partnerId: string;
  partnerName: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function block() {
    if (preview) return router.push("/preview/04");
    setBusy(true);
    await createClient().from("blocks").upsert({ blocker_id: myId, blocked_id: partnerId });
    router.push("/home");
  }

  return (
    <Screen
      title="학우 차단"
      badge="SAFE"
      backHref={`${base}/safety`}
      footer={
        <>
          <BlockButton onClick={block} disabled={busy}>
            차단하기
          </BlockButton>
          <BlockButton tone="card" href={base}>
            취소하고 대화로
          </BlockButton>
        </>
      }
    >
      <CircleArt tone="pink" className="mt-[74px]" />
      <Headline
        center
        title={
          <>
            {partnerName}님을
            <br />
            차단하시겠어요?
          </>
        }
        desc={
          <span className="mt-[20px] block text-[15px]">
            차단하면 대화가 즉시 종료되고
            <br />
            앞으로 다시 매칭되지 않습니다.
          </span>
        }
      />
    </Screen>
  );
}
