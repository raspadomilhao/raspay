// Service Worker para notificações Web Push
const CACHE_NAME = "raspay-admin-v1"

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker instalado")
  self.skipWaiting()
})

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado")
  event.waitUntil(self.clients.claim())
})

// Escutar notificações push
self.addEventListener("push", (event) => {
  console.log("📱 Notificação push recebida:", event)

  if (!event.data) {
    console.log("❌ Notificação sem dados")
    return
  }

  try {
    const data = event.data.json()
    console.log("📊 Dados da notificação:", data)

    const options = {
      body: data.body || "Nova notificação",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      image: data.image,
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: true,
      silent: false,
      tag: data.tag || "default",
      timestamp: Date.now(),
      vibrate: [200, 100, 200],
    }

    event.waitUntil(self.registration.showNotification(data.title || "Raspay Admin", options))
  } catch (error) {
    console.error("❌ Erro ao processar notificação:", error)

    // Fallback para notificação simples
    event.waitUntil(
      self.registration.showNotification("Raspay Admin", {
        body: "Nova notificação recebida",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      }),
    )
  }
})

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notificação clicada:", event)

  event.notification.close()

  const data = event.notification.data || {}
  const url = data.url || "/adminconfig"

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Verificar se já existe uma aba do admin aberta
      for (const client of clients) {
        if (client.url.includes("/adminconfig") && "focus" in client) {
          return client.focus()
        }
      }

      // Se não existe, abrir nova aba
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
})

// Fechar notificação
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notificação fechada:", event.notification.tag)
})
