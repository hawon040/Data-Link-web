"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Toggle } from "@/components/screen";
import { BlockButton } from "@/components/ui";
import { adminErrorMessage } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";

export type Notice = { id: number; title: string; body: string; pinned: boolean; created_at: string };

export default function NoticesAdminView({ notices }: { notices: Notice[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null); // null = 새 공지
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function edit(n: Notice | null) {
    setEditing(n?.id ?? null);
    setTitle(n?.title ?? "");
    setBody(n?.body ?? "");
    setPinned(n?.pinned ?? false);
    setError(null);
  }

  async function save() {
    if (!title.trim() || !body.trim()) return setError("제목과 내용을 입력해 주세요.");
    setBusy(true);
    const { error } = await createClient().rpc("admin_save_notice", {
      p_id: editing,
      p_title: title,
      p_body: body,
      p_pinned: pinned,
    });
    setBusy(false);
    if (error) return setError(adminErrorMessage(error.message));
    edit(null);
    router.refresh();
  }

  async function remove(id: number) {
    setBusy(true);
    const { error } = await createClient().rpc("admin_delete_notice", { p_id: id });
    setBusy(false);
    if (error) return setError(adminErrorMessage(error.message));
    if (editing === id) edit(null);
    router.refresh();
  }

  return (
    <div className="pb-10">
      <div className="mt-[24px] rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
        <p className="text-[13px] font-bold">{editing ? "공지 수정" : "새 공지"}</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="제목"
          className="mt-[10px] h-[42px] w-full rounded-[7px] border border-ink bg-paper px-3 text-[14px]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="내용"
          className="mt-[8px] w-full rounded-[7px] border border-ink bg-paper px-3 py-2 text-[14px]"
        />
        <div className="mt-[6px] flex items-center justify-between">
          <span className="text-[13px] font-medium">맨 위에 고정</span>
          <Toggle on={pinned} label="맨 위에 고정" onChange={setPinned} />
        </div>
        <div className="mt-[12px] flex flex-col gap-2">
          <BlockButton onClick={save} disabled={busy}>
            {editing ? "수정 저장" : "공지 올리기"}
          </BlockButton>
          {editing && (
            <BlockButton tone="card" onClick={() => edit(null)}>
              새 공지 쓰기로
            </BlockButton>
          )}
        </div>
        {error && <p className="mt-[8px] text-[12px] text-alert">{error}</p>}
      </div>

      <div className="mt-[20px] flex flex-col gap-3">
        {notices.length === 0 && <p className="text-[14px] text-muted">올린 공지가 없어요.</p>}
        {notices.map((n) => (
          <div key={n.id} className="rounded-[12px] border border-ink bg-card px-[17px] py-[14px]">
            <p className="text-[15px] font-bold">
              {n.pinned && "📌 "}
              {n.title}
            </p>
            <p className="mt-[6px] line-clamp-2 text-[13px] text-muted whitespace-pre-wrap">{n.body}</p>
            <div className="mt-[10px] flex gap-4 text-[13px] font-bold">
              <button type="button" onClick={() => edit(n)}>
                수정
              </button>
              <button type="button" disabled={busy} onClick={() => remove(n.id)} className="text-alert">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
