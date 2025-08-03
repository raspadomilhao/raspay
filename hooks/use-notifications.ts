"use client"

import { useState, useEffect, useCallback } from "react"

interface NotificationData {
  type: "withdraw" | "deposit"
  title: string
  body: string
  data?: any
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface UseNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | null
  isServiceWorkerReady: boolean
  requestPermission: () => Promise<boolean>
  sendNotification: (data: NotificationData) => Promise<boolean>
  registerServiceWorker: () => Promise<boolean>
  subscribeToNotifications: () => Promise<PushSubscription | null>
  unsubscribeFromNotifications: () => Promise<boolean>
}

export function useNotifications(): UseNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)

  useEffect(() => {
    // Verificar suporte a notificações
    const supported = "Notification" in window && "serviceWorker" in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker não suportado")
      return false
    }

    try {
      console.log("🔧 Registrando Service Worker...")
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("✅ Service Worker registrado:", registration)

      // Aguardar o SW ficar ativo
      if (registration.active) {
        setIsServiceWorkerReady(true)
      } else {
        registration.addEventListener("statechange", () => {
          if (registration.active) {
            setIsServiceWorkerReady(true)
          }
        })
      }

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("📨 Mensagem do Service Worker:", event.data)

        if (event.data.type === "NOTIFICATION_CLICKED") {
          // Lidar com cliques em notificações
          console.log("🔔 Notificação clicada:", event.data.data)
        }
      })

      return true
    } catch (error) {
      console.error("❌ Erro ao registrar Service Worker:", error)
      return false
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log("Notificações não suportadas")
      return false
    }

    try {
      console.log("🔔 Solicitando permissão para notificações...")
      const result = await Notification.requestPermission()
      setPermission(result)

      console.log("🔔 Permissão:", result)
      return result === "granted"
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão:", error)
      return false
    }
  }, [isSupported])

  const sendNotification = useCallback(
    async (data: NotificationData): Promise<boolean> => {
      if (!isSupported || permission !== "granted") {
        console.log("Notificações não permitidas")
        return false
      }

      try {
        // Se o Service Worker estiver pronto, usar ele
        if (isServiceWorkerReady && "serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready

          // Simular push notification
          const pushData = {
            title: data.title,
            body: data.body,
            type: data.type,
            tag: data.tag || `raspay-${data.type}-${Date.now()}`,
            data: data.data || {},
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || [],
          }

          // Enviar mensagem para o Service Worker
          if (registration.active) {
            registration.active.postMessage({
              type: "SHOW_NOTIFICATION",
              data: pushData,
            })
          }

          // Mostrar notificação diretamente também
          await registration.showNotification(data.title, {
            body: data.body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: data.tag || `raspay-${data.type}-${Date.now()}`,
            data: data.data || {},
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || [],
            vibrate: [200, 100, 200],
            timestamp: Date.now(),
          })
        } else {
          // Fallback para notificação simples
          new Notification(data.title, {
            body: data.body,
            icon: "/icon-192.png",
            tag: data.tag || `raspay-${data.type}-${Date.now()}`,
            data: data.data || {},
            requireInteraction: data.requireInteraction || false,
          })
        }

        console.log("✅ Notificação enviada:", data.title)
        return true
      } catch (error) {
        console.error("❌ Erro ao enviar notificação:", error)
        return false
      }
    },
    [isSupported, permission, isServiceWorkerReady],
  )

  const subscribeToNotifications = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isServiceWorkerReady) {
      console.log("Service Worker não está pronto")
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // Verificar se já existe uma subscription
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: null, // Para notificações locais, não precisamos de chave
        })
      }

      console.log("✅ Subscription criada:", subscription)
      return subscription
    } catch (error) {
      console.error("❌ Erro ao criar subscription:", error)
      return null
    }
  }, [isServiceWorkerReady])

  const unsubscribeFromNotifications = useCallback(async (): Promise<boolean> => {
    if (!isServiceWorkerReady) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        console.log("✅ Unsubscribed from notifications")
        return true
      }

      return false
    } catch (error) {
      console.error("❌ Erro ao fazer unsubscribe:", error)
      return false
    }
  }, [isServiceWorkerReady])

  return {
    isSupported,
    permission,
    isServiceWorkerReady,
    requestPermission,
    sendNotification,
    registerServiceWorker,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  }
}
