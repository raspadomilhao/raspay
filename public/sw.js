self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data,
      actions: data.actions || [],
      requireInteraction: true,
      tag: 'deposit-notification'
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notificação clicada:', event.notification.data)
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/administrador'))
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
})

self.addEventListener('notificationclose', function (event) {
  console.log('Notificação fechada:', event.notification.data)
})
