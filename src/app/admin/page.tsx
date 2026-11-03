import { Card, Headline, Screen } from "@/components/screen";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/labels";

export const dynamic = "force-dynamic";

// 운영자 홈 — 가진 권한에 맞는 메뉴만 보여준다 (기능 확인용 임시 화면)
const MENU: { href: string; title: string; desc: string; perms: AdminPermission[] }[] = [
  { href: "/admin/reports", title: "신고 처리", desc: "접수된 신고와 신고된 대화 기록", perms: ["reports"] },
  { href: "/admin/users", title: "회원 관리", desc: "닉네임 검색, 이용 정지·해제, 사진 삭제, 운영자 권한", perms: ["suspend", "avatars", "admins"] },
  { href: "/admin/notices", title: "공지 관리", desc: "공지 작성·수정·삭제", perms: ["notices"] },
  { href: "/admin/log", title: "처리 기록", desc: "운영자가 열람·처리한 기록", perms: ["admins"] },
];

export default async function AdminHome() {
  const { perms } = await requireAdmin();
  const labels = ADMIN_PERMISSIONS.filter((p) => perms.includes(p.value)).map((p) => p.label);

  return (
    <Screen title="운영자" badge="ADMIN" backHref="/me">
      <Headline size={23} title="운영자 화면" desc={<span className="mt-[10px] block">내 권한: {labels.join(" · ")}</span>} />
      <div className="mt-[40px] flex flex-col gap-3 pb-10">
        {MENU.filter((m) => m.perms.some((p) => perms.includes(p))).map((m) => (
          <Card key={m.href} href={m.href}>
            <p className="text-[16px] font-bold">{m.title}</p>
            <p className="mt-[6px] text-[12px] text-muted">{m.desc}</p>
          </Card>
        ))}
      </div>
      <p className="pb-10 text-[11px] text-muted">
        실명·학번·연락처·카카오톡 ID는 운영자 화면에서도 보이지 않아요. 대화 기록 열람과 모든 처리는 기록에 남아요.
      </p>
    </Screen>
  );
}
