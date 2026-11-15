import { createClient } from "@/lib/supabase/client";

// 브라우저 알림 구독 (정오 매칭 발표)
export type PushState = "unsupported" | "denied" | "off" | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY !== ""
  );
}

function toUint8(base64url: string) {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

// 버튼을 누를 때 호출 (권한 요청은 사용자 동작 안에서만)
export async function enablePush(userId: string): Promise<PushState> {
  if (!supported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8(VAPID_PUBLIC_KEY),
    }));

  const json = sub.toJSON();
  const { error } = await createClient()
    .from("push_subscriptions")
    .upsert({
      endpoint: sub.endpoint,
      user_id: userId,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    });
  if (error) {
    await sub.unsubscribe();
    return "off";
  }
  return "on";
}

// 알림 끄기: 이 기기의 구독을 해지하고 DB에서도 지운다
export async function disablePush(): Promise<PushState> {
  if (!supported()) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return "off";
  const { error } = await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  if (error) return "on";
  await sub.unsubscribe();
  return "off";
}
