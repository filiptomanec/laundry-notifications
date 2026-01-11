self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192x192.jpg",
    badge: data.badge || "/icon-192x192.jpg",
    tag: data.tag || "laundry-notification",
    vibrate: [200, 100, 200, 100, 200],
    data: data.data,
    requireInteraction: true,
    actions: [
      {
        action: "open",
        title: "Otevřít",
      },
      {
        action: "close",
        title: "Zavřít",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") return

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if found
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    }),
  )
})
