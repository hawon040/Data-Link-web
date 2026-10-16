"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Headline, Screen, TiltCard } from "@/components/screen";
import { BlockButton } from "@/components/ui";

// Figma 25 · 교환 응답 대기 (12:114)
export function WaitingView() {
  return (
    <Screen
      title="교환 선택 완료"
      badge="ID"
      backHref="/home"
      bg="ink"
      dark
      footer={<BlockButton href="/home">홈으로</BlockButton>}
    >
      <div className="mt-[78px]">
        <TiltCard size={156} rotate={5} />
      </div>
      <Headline
        center
        title="선택을 저장했어요"
        descTone="ink"
        desc={
          <span className="mt-[20px] block text-[15px] text-card">
            상대의 선택이 끝나면 결과를 알려드려요.
            <br />
            서로 동의할 때만 ID가 공개됩니다.
          </span>
        }
      />
      <div className="mt-[39px] h-[91px] rounded-[12px] border border-ink bg-card px-[17px] pt-[17px] text-ink">
        <p className="text-[15px] font-bold">내 선택은 상대에게 보이지 않아요</p>
        <p className="mt-[6px] text-[12px] text-muted">응답이 없거나 한쪽만 동의하면 종료됩니다.</p>
      </div>
    </Screen>
  );
}

// Figma 26 · 교환 없이 종료 (12:129)
export function ClosedView({ base }: { base: string }) {
  return (
    <Screen
      title="대화 종료"
      badge="ID"
      backHref="/home"
      footer={
        <>
          <BlockButton href={`${base}/review`}>대화 후기 남기기</BlockButton>
          <BlockButton tone="card" href="/home">
            홈으로
          </BlockButton>
        </>
      }
    >
      <div className="pt-[58px]" />
      <Headline
        center
        title={
          <>
            오늘의 대화가
            <br />
            마무리됐어요
          </>
        }
        desc={
          <span className="mt-[20px] block text-[15px]">
            서로의 선택은 공개되지 않아요.
            <br />
            다음 교점에서 또 새로운 학우를 만나보세요.
          </span>
        }
      />
      <div className="mt-[71px] h-[126px] rounded-[12px] border border-ink bg-card px-[17px] pt-4">
        <p className="text-[17px] font-bold">서로의 정보는 안전하게</p>
        <p className="mt-[16px] text-[13px] text-muted">
          카카오톡 ID는 공개되지 않았습니다.
          <br />
          불편한 경험은 종료 후에도 신고할 수 있어요.
        </p>
      </div>
    </Screen>
  );
}

// Figma 11 · 상호 동의 완료 (4:52)
export function MutualView({
  base,
  partnerName,
  contact,
  preview = false,
}: {
  base: string;
  partnerName: string;
  contact: string;
  preview?: boolean;
}) {
  const router = useRouter();
  async function copy() {
    try {
      await navigator.clipboard.writeText(contact);
    } catch {
      // 복사 권한이 없으면 화면에서 직접 선택할 수 있다
    }
    router.push(preview ? "/preview/41" : `${base}/copied`);
  }

  return (
    <Screen
      title="새로운 친구"
      badge="ID"
      backHref="/home"
      bg="orange"
      footer={
        <>
          <BlockButton href={`${base}/review`}>대화 후기 남기기</BlockButton>
          <Link href={`${base}/report?reason=fake_contact`} className="pt-[9px] text-center text-[12px] font-medium">
            ID가 본인 것이 아니었어요 · 7일 내 신고 가능
          </Link>
        </>
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/success-orbit.svg" width={160} height={160} alt="" className="mx-auto mt-[48px]" />
      <Headline
        center
        title={
          <>
            두 분 모두
            <br />
            교환을 선택했어요!
          </>
        }
        descTone="ink"
        desc={
          <span className="mt-[12px] block">
            카카오톡 ID를 확인하고 대화를 이어가세요.
            <br />
            ID가 본인 것이 아니라면 바로 신고할 수 있어요.
          </span>
        }
      />
      <div className="mt-[40px] h-[105px] rounded-[8px] border border-ink bg-card px-[17px] pt-4 shadow-block">
        <p className="text-[12px] font-medium text-muted">{partnerName}님의 카카오톡 ID</p>
        <div className="mt-[8px] flex items-center justify-between">
          <p className="text-[19px] font-bold select-all">{contact}</p>
          <button type="button" onClick={copy} className="text-[13px] font-bold">
            복사
          </button>
        </div>
      </div>
    </Screen>
  );
}
