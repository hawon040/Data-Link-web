"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AVATAR_BUCKET, avatarPath } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";

// 사진을 정사각형으로 자르고 512px로 줄인다 (webp, 안 되는 브라우저는 jpeg)
async function shrink(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("encode failed");
  return jpeg;
}

// Figma 08의 62px 원 — 누르면 사진을 고른다
export function AvatarCircle({ url, size = 62 }: { url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} width={size} height={size} alt="프로필 사진" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="block shrink-0 rounded-full bg-mint" style={{ width: size, height: size }} />
  );
}

export default function AvatarPicker({
  url,
  size = 62,
  preview = false,
  showRemove = false,
}: {
  url: string | null;
  size?: number;
  preview?: boolean;
  showRemove?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("사진 파일만 올릴 수 있어요.");
    if (preview) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("signed out");
      const blob = await shrink(file);
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarPath(user.id), blob, { upsert: true, contentType: blob.type, cacheControl: "60" });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      router.refresh();
    } catch {
      setError("사진을 올리지 못했어요. 다른 사진으로 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (preview) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(user.id)]);
      const { error } = await supabase.from("profiles").update({ avatar_updated_at: null }).eq("id", user.id);
      if (error) setError("사진을 지우지 못했어요.");
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-[6px]">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={url ? "프로필 사진 바꾸기" : "프로필 사진 올리기"}
        className="relative shrink-0 rounded-full disabled:opacity-60"
      >
        <AvatarCircle url={url} size={size} />
        <span className="absolute -right-[2px] -bottom-[2px] flex size-[22px] items-center justify-center rounded-full border border-ink bg-lime text-[14px] leading-none font-bold">
          +
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
      {showRemove && url && (
        <button type="button" onClick={remove} disabled={busy} className="text-[12px] text-muted underline">
          사진 삭제
        </button>
      )}
      {error && <p className="text-[12px] text-alert">{error}</p>}
    </div>
  );
}
