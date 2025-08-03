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
      console.log("🔔 Solicitando permissão para notificações...")

      const result = await Notification.requestPermission()
      console.log("🔔 Resultado da permissão:", result)

      setPermission(result)

      if (result === "granted") {
        console.log("✅ Permissão concedida!")
        setIsEnabled(true)
        localStorage.setItem("admin-notifications-enabled", "true")
      } else {
        console.log("❌ Permissão negada ou não concedida:", result)
      }

      return result
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão para notificações:", error)
      return "denied"
    }
  }, [isSupported])

  const sendNotification = useCallback(
    (data: NotificationData) => {
      console.log("🔔 Tentando enviar notificação:", data)
      console.log("🔔 Estado atual - isSupported:", isSupported, "permission:", permission, "isEnabled:", isEnabled)

      if (!isSupported) {
        console.warn("❌ Navegador não suporta notificações")
        return
      }

      if (permission !== "granted") {
        console.warn("❌ Permissão não concedida. Status:", permission)
        return
      }

      if (!isEnabled) {
        console.warn("❌ Notificações desabilitadas pelo usuário")
        return
      }

      try {
        console.log("✅ Criando notificação...")

        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon || "/icon-192.png",
          badge: data.badge || "/icon-192.png",
          tag: data.tag,
          data: data.data,
          requireInteraction: true, // Manter a notificação até o usuário interagir
          silent: false,
        })

        console.log("✅ Notificação criada com sucesso!")

        // Auto-fechar após 10 segundos se não houver interação
        setTimeout(() => {
          notification.close()
        }, 10000)

        // Lidar com cliques na notificação
        notification.onclick = (event) => {
          console.log("🔔 Notificação clicada!")
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
          console.error("❌ Erro na notificação:", error)
        }

        notification.onshow = () => {
          console.log("✅ Notificação exibida!")
        }

        notification.onclose = () => {
          console.log("🔔 Notificação fechada")
        }
      } catch (error) {
        console.error("❌ Erro ao enviar notificação:", error)
      }
    },
    [isSupported, permission, isEnabled],
  )

  const handleSetIsEnabled = useCallback((enabled: boolean) => {
    console.log("🔔 Alterando estado das notificações para:", enabled)
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
