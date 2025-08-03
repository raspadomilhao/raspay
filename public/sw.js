// Service Worker para notificações push
const CACHE_NAME = "raspay-admin-v1"

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed")
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated")
  event.waitUntil(self.clients.claim())
})

// Push event - recebe notificações push
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received", event)

  if (!event.data) {
    console.log("Push event but no data")
    return
  }

  const data = event.data.json()
  console.log("Push data:", data)

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "raspay-notification",
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  }

  // Personalizar ícone e cor baseado no tipo
  if (data.type === "withdraw") {
    options.icon = "/icon-192.png"
    options.badge = "/icon-192.png"
  } else if (data.type === "deposit") {
    options.icon = "/icon-192.png"
    options.badge = "/icon-192.png"
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)

  event.notification.close()

  const data = event.notification.data
  let url = "/adminconfig"

  // Redirecionar para a aba correta baseado no tipo
  if (data.type === "withdraw") {
    if (data.withdrawType === "affiliate") {
      url = "/adminconfig?tab=affiliate-withdraws"
    } else if (data.withdrawType === "manager") {
      url = "/adminconfig?tab=manager-withdraws"
    }
  } else if (data.type === "deposit") {
    url = "/adminconfig?tab=transactions"
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url.includes("/adminconfig") && "focus" in client) {
          client.postMessage({
            type: "NOTIFICATION_CLICKED",
            data: data,
          })
          return client.focus()
        }
      }

      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

// Background sync (para futuras funcionalidades)
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag)
})

// Fetch event (cache básico)
self.addEventListener("fetch", (event) => {
  // Não interceptar requests da API para evitar problemas
  if (event.request.url.includes("/api/")) {
    return
  }

  // Cache básico para recursos estáticos
  if (
    event.request.destination === "image" ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      }),
    )
  }
})
