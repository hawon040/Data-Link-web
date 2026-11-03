// 정오 매칭 발표 알림 (Web Push)
// 서버는 내용 없는 알림만 보낸다. 문구는 여기서 정한다.

self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("오늘의 학우가 도착했어요", {
      body: "정오 매칭 결과를 확인하고 먼저 인사해 보세요.",
      tag: "daily-match",
      data: { url: "/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
