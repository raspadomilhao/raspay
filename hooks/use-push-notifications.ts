"use client"

import { useState, useEffect, useCallback } from "react"

interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
}

interface PushNotificationHook {
  permission: NotificationPermission
  isSupported: boolean
  requestPermission: () => Promise<NotificationPermission>
  sendNotification: (data: NotificationData) => void
  isEnabled: boolean
  setIsEnabled: (enabled: boolean) => void
}

export function usePushNotifications(): PushNotificationHook {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isEnabled, setIsEnabled] = useState(false)

  // Verificar se o navegador suporta notificações
  const isSupported = typeof window !== "undefined" && "Notification" in window

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission)

      // Recuperar preferência do localStorage
      const savedPreference = localStorage.getItem("admin-notifications-enabled")
      setIsEnabled(savedPreference === "true")
    }
  }, [isSupported])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn("Notificações não são suportadas neste navegador")
      return "denied"
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        setIsEnabled(true)
        localStorage.setItem("admin-notifications-enabled", "true")
      }

      return result
    } catch (error) {
      console.error("Erro ao solicitar permissão para notificações:", error)
      return "denied"
    }
  }, [isSupported])

  const sendNotification = useCallback(
    (data: NotificationData) => {
      if (!isSupported || permission !== "granted" || !isEnabled) {
        return
      }

      try {
        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon || "/icon-192.png",
          badge: data.badge || "/icon-192.png",
          tag: data.tag,
          data: data.data,
          requireInteraction: true, // Manter a notificação até o usuário interagir
          silent: false,
        })

        // Auto-fechar após 10 segundos se não houver interação
        setTimeout(() => {
          notification.close()
        }, 10000)

        // Lidar com cliques na notificação
        notification.onclick = (event) => {
          event.preventDefault()

          // Focar na janela do navegador
          if (window.parent) {
            window.parent.focus()
          }
          window.focus()

          // Se houver dados específicos, navegar para a seção apropriada
          if (data.data?.section) {
            // Disparar evento customizado para navegar
            window.dispatchEvent(
              new CustomEvent("notification-click", {
                detail: { section: data.data.section, data: data.data },
              }),
            )
          }

          notification.close()
        }

        notification.onerror = (error) => {
          console.error("Erro na notificação:", error)
        }
      } catch (error) {
        console.error("Erro ao enviar notificação:", error)
      }
    },
    [isSupported, permission, isEnabled],
  )

  const handleSetIsEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled)
    localStorage.setItem("admin-notifications-enabled", enabled.toString())
  }, [])

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    isEnabled,
    setIsEnabled: handleSetIsEnabled,
  }
}
