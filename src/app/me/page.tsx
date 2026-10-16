import BottomNav from "@/components/bottom-nav";
import { BrandHeader } from "@/components/ui";

// Figma 08 · 내 정보 — 다음 작업에서 디자인 반영 예정
export default function MePage() {
  return (
    <div className="min-h-dvh bg-paper pb-[100px]">
      <BrandHeader title="내 정보" badge="ME" />
      <p className="px-6 pt-8 text-[14px] text-muted">프로필·카카오톡 ID·차단 목록 화면을 준비하고 있어요.</p>
      <BottomNav />
    </div>
  );
}
