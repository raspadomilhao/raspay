// Service Worker para notificações Web Push - Raspay Admin
const CACHE_NAME = "raspay-admin-v1"

console.log("🔧 Service Worker carregado!")

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker instalando...")
  self.skipWaiting()
})

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado!")
  event.waitUntil(self.clients.claim())
})

// Escutar notificações push
self.addEventListener("push", (event) => {
  console.log("📱 Notificação push recebida!")
  console.log("📱 Event data exists:", !!event.data)

  if (!event.data) {
    console.log("❌ Notificação sem dados")
    // Mostrar notificação padrão mesmo sem dados
    event.waitUntil(
      self.registration.showNotification("Raspay Admin", {
        body: "Nova notificação recebida (sem dados)",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "default-notification",
      }),
    )
    return
  }

  try {
    const data = event.data.json()
    console.log("📊 Dados da notificação:", data)

    const options = {
      body: data.body || "Nova notificação",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      image: data.image,
      data: data.data || {},
      actions: data.actions || [
        {
          action: "view",
          title: "Ver Painel",
          icon: "/icon-192.png",
        },
        {
          action: "close",
          title: "Fechar",
        },
      ],
      requireInteraction: true,
      silent: false,
      tag: data.tag || "admin-notification",
      timestamp: Date.now(),
      vibrate: [200, 100, 200],
      renotify: true,
    }

    console.log("📱 Mostrando notificação com opções:", options)

    event.waitUntil(
      self.registration
        .showNotification(data.title || "Raspay Admin", options)
        .then(() => {
          console.log("✅ Notificação exibida com sucesso!")
        })
        .catch((error) => {
          console.error("❌ Erro ao exibir notificação:", error)
        }),
    )
  } catch (error) {
    console.error("❌ Erro ao processar dados da notificação:", error)

    // Fallback para notificação simples
    event.waitUntil(
      self.registration.showNotification("Raspay Admin", {
        body: "Nova notificação recebida (erro ao processar dados)",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "error-notification",
      }),
    )
  }
})

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notificação clicada!")
  console.log("👆 Action:", event.action)
  console.log("👆 Data:", event.notification.data)

  event.notification.close()

  if (event.action === "close") {
    console.log("❌ Usuário fechou a notificação")
    return
  }

  const data = event.notification.data || {}
  const url = data.url || "/adminconfig"

  console.log("🔗 Abrindo URL:", url)

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        console.log("🔍 Clientes encontrados:", clients.length)

        // Verificar se já existe uma aba do admin aberta
        for (const client of clients) {
          console.log("🔍 Cliente URL:", client.url)
          if (client.url.includes("/adminconfig") && "focus" in client) {
            console.log("✅ Focando aba existente")
            return client.focus()
          }
        }

        // Se não existe, abrir nova aba
        if (self.clients.openWindow) {
          console.log("🆕 Abrindo nova aba:", url)
          return self.clients.openWindow(url)
        }
      })
      .catch((error) => {
        console.error("❌ Erro ao abrir janela:", error)
      }),
  )
})

// Fechar notificação
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notificação fechada:", event.notification.tag)
})

// Debug: Log quando o service worker recebe mensagens
self.addEventListener("message", (event) => {
  console.log("💬 Mensagem recebida no Service Worker:", event.data)
})

console.log("🚀 Service Worker totalmente carregado e pronto!")
