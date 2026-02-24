/// Service Worker for FanTribe PWA

const APP_URL = "https://fantribe.io"

// Install: activate immediately
self.addEventListener("install", () => {
  self.skipWaiting()
})

// Activate: claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Fetch: pass-through (no caching — real-time app)
self.addEventListener("fetch", () => {
  // Let the browser handle all requests normally.
  // FanTribe is a real-time social app powered by Convex,
  // so offline caching would serve stale data.
})

// Push notifications (ready for future use)
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click: open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.startsWith(APP_URL) && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(url)
      }),
  )
})
