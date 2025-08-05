console.log("🔧 Service Worker carregado")

self.addEventListener("install", (event) => {
  console.log("📦 Service Worker instalado")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker ativado")
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  console.log("🔔 Push recebido:", event)

  let notificationData = {
    title: "Nova Notificação",
    body: "Você tem uma nova notificação",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "default",
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      console.log("📄 Dados do push:", data)
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      console.error("❌ Erro ao parsear dados do push:", error)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  console.log("🔔 Exibindo notificação:", notificationData)

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: true,
    silent: false,
  })

  event.waitUntil(promiseChain)
})

self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notificação clicada:", event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/adminconfig"

  const promiseChain = self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Procurar por uma janela já aberta
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url.includes(self.location.origin)) {
          console.log("🔄 Focando janela existente")
          return client.focus().then(() => client.navigate(urlToOpen))
        }
      }

      // Se não encontrou, abrir nova janela
      console.log("🆕 Abrindo nova janela")
      return self.clients.openWindow(urlToOpen)
    })

  event.waitUntil(promiseChain)
})

self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notificação fechada:", event.notification.tag)
})
