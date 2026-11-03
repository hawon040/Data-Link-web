"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_PERMISSIONS, adminErrorMessage, USER_STATUS_LABEL, type AdminPermission } from "@/lib/labels";
import { clearAvatar } from "../actions";

export type AdminUser = {
  id: string;
  nickname: string | null;
  dept: string | null;
  grade: number | null;
  status: string;
  created_at: string;
  has_avatar: boolean;
  reported_count: number;
  permissions: AdminPermission[];
};

export default function UsersView({
  users,
  perms,
  myId,
  searched,
}: {
  users: AdminUser[];
  perms: AdminPermission[];
  myId: string;
  searched: boolean;
}) {
  if (searched && users.length === 0) return <p className="mt-6 text-[14px] text-muted">찾는 회원이 없어요.</p>;
  return (
    <div className="mt-[24px] flex flex-col gap-3 pb-10">
      {users.map((u) => (
        <UserCard key={u.id} user={u} perms={perms} isMe={u.id === myId} />
      ))}
    </div>
  );
}

function UserCard({ user, perms, isMe }: { user: AdminUser; perms: AdminPermission[]; isMe: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(task: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await task();
    setBusy(false);
    if (message) return setError(message);
    router.refresh();
  }

  const rpc = (fn: string, args: Record<string, unknown>) => async () => {
    const { error } = await createClient().rpc(fn, args);
    return error ? adminErrorMessage(error.message) : null;
  };

  const canSuspend = perms.includes("suspend") && !isMe && (user.status === "active" || user.status === "suspended");
  const canAvatar = perms.includes("avatars") && user.has_avatar;
  const canGrant = perms.includes("admins");

  return (
    <div className="rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-bold">{user.nickname ?? "(탈퇴)"}{isMe && " (나)"}</span>
        <span className="text-[12px] font-bold">{USER_STATUS_LABEL[user.status] ?? user.status}</span>
      </div>
      <p className="mt-[4px] text-[12px] text-muted">
        {user.dept ?? "-"} {user.grade ? `${user.grade}학년` : ""} · 신고자 {user.reported_count}명 · 사진 {user.has_avatar ? "있음" : "없음"}
      </p>

      {(canSuspend || canAvatar) && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="처리 사유 (기록에 남아요)"
          className="mt-[12px] h-[40px] w-full rounded-[7px] border border-ink bg-paper px-3 text-[13px]"
        />
      )}
      <div className="mt-[10px] flex flex-wrap gap-2">
        {canSuspend && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(rpc("admin_set_suspended", { p_user_id: user.id, p_suspend: user.status === "active", p_note: note || null }))
            }
            className={`h-[36px] rounded-[7px] border-[1.5px] border-ink px-3 text-[13px] font-bold disabled:opacity-50 ${
              user.status === "active" ? "bg-alert text-card" : "bg-lime"
            }`}
          >
            {user.status === "active" ? "이용 정지" : "정지 해제"}
          </button>
        )}
        {canAvatar && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => (await clearAvatar(user.id, note)).error)}
            className="h-[36px] rounded-[7px] border-[1.5px] border-ink bg-card px-3 text-[13px] font-bold disabled:opacity-50"
          >
            사진 삭제
          </button>
        )}
      </div>

      {canGrant && (
        <div className="mt-[12px] border-t border-ink pt-[10px]">
          <p className="text-[12px] font-bold">운영자 권한</p>
          <div className="mt-[6px] flex flex-wrap gap-2">
            {ADMIN_PERMISSIONS.map((p) => {
              const on = user.permissions.includes(p.value);
              // 내 권한 관리 권한은 스스로 끌 수 없다 (DB에서도 막음)
              const locked = isMe && p.value === "admins" && on;
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={on}
                  disabled={busy || locked || (!on && user.status !== "active")}
                  onClick={() => run(rpc("admin_set_permission", { p_user_id: user.id, p_perm: p.value, p_on: !on }))}
                  className={`h-[32px] rounded-[16px] px-3 text-[12px] font-medium disabled:opacity-50 ${
                    on ? "bg-ink text-card" : "bg-chip text-muted"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="mt-[8px] text-[12px] text-alert">{error}</p>}
    </div>
  );
}
