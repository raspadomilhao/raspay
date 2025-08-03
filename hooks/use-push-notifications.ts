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
  isIOS: boolean
  canUseNotifications: boolean
}

// Detectar iOS
const isIOSDevice = () => {
  if (typeof window === "undefined") return false

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

// Detectar se está no Safari
const isSafari = () => {
  if (typeof window === "undefined") return false

  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

// Verificar se pode usar notificações
const canUseWebNotifications = () => {
  if (typeof window === "undefined") return false

  // iOS Safari não suporta notificações web até iOS 16.4+
  const isIOS = isIOSDevice()
  const isSafariOnIOS = isIOS && isSafari()

  // Verificar versão do iOS se possível
  if (isSafariOnIOS) {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/)
    if (match) {
      const majorVersion = Number.parseInt(match[1])
      const minorVersion = Number.parseInt(match[2])

      // iOS 16.4+ suporta notificações web
      if (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4)) {
        return "Notification" in window
      }
      return false
    }
    // Se não conseguir detectar a versão, assumir que não suporta
    return false
  }

  // Para outros navegadores, verificar se existe a API
  return "Notification" in window
}

export function usePushNotifications(): PushNotificationHook {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isEnabled, setIsEnabled] = useState(false)

  const isIOS = isIOSDevice()
  const canUseNotifications = canUseWebNotifications()
  const isSupported = typeof window !== "undefined" && canUseNotifications

  useEffect(() => {
    console.log("🔔 Inicializando hook de notificações...")
    console.log("🔔 isIOS:", isIOS)
    console.log("🔔 isSafari:", isSafari())
    console.log("🔔 canUseNotifications:", canUseNotifications)
    console.log("🔔 isSupported:", isSupported)
    console.log("🔔 User Agent:", navigator.userAgent)

    if (isSupported) {
      setPermission(Notification.permission)
      console.log("🔔 Permissão atual:", Notification.permission)

      // Recuperar preferência do localStorage
      const savedPreference = localStorage.getItem("admin-notifications-enabled")
      setIsEnabled(savedPreference === "true")
      console.log("🔔 Preferência salva:", savedPreference)
    } else {
      console.log("🔔 Notificações não suportadas neste dispositivo/navegador")
    }
  }, [isSupported, isIOS, canUseNotifications])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    console.log("🔔 Solicitando permissão para notificações...")
    console.log("🔔 isSupported:", isSupported)
    console.log("🔔 isIOS:", isIOS)
    console.log("🔔 canUseNotifications:", canUseNotifications)

    if (!isSupported) {
      console.warn("❌ Notificações não são suportadas neste navegador/dispositivo")

      if (isIOS && !canUseNotifications) {
        console.warn("❌ iOS detectado - notificações web não suportadas nesta versão")
        return "denied"
      }

      return "denied"
    }

    try {
      console.log("🔔 Chamando Notification.requestPermission()...")

      // Para iOS/Safari, pode ser necessário chamar de forma diferente
      let result: NotificationPermission

      if (typeof Notification.requestPermission === "function") {
        // Método moderno (Promise)
        result = await Notification.requestPermission()
      } else {
        // Método legado (callback) - para compatibilidade
        result = await new Promise((resolve) => {
          Notification.requestPermission((permission) => {
            resolve(permission as NotificationPermission)
          })
        })
      }

      console.log("🔔 Resultado da permissão:", result)
      setPermission(result)

      if (result === "granted") {
        console.log("✅ Permissão concedida!")
        setIsEnabled(true)
        localStorage.setItem("admin-notifications-enabled", "true")
      } else {
        console.log("❌ Permissão negada ou não concedida:", result)
        setIsEnabled(false)
        localStorage.setItem("admin-notifications-enabled", "false")
      }

      return result
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão para notificações:", error)
      return "denied"
    }
  }, [isSupported, isIOS, canUseNotifications])

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

        // Para iOS, usar configurações mais simples
        const notificationOptions: NotificationOptions = {
          body: data.body,
          icon: data.icon || "/icon-192.png",
          tag: data.tag,
          data: data.data,
          // Para iOS, evitar algumas opções que podem causar problemas
          ...(isIOS
            ? {}
            : {
                badge: data.badge || "/icon-192.png",
                requireInteraction: true,
                silent: false,
              }),
        }

        const notification = new Notification(data.title, notificationOptions)

        console.log("✅ Notificação criada com sucesso!")

        // Auto-fechar após 10 segundos se não houver interação (exceto no iOS)
        if (!isIOS) {
          setTimeout(() => {
            notification.close()
          }, 10000)
        }

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
    [isSupported, permission, isEnabled, isIOS],
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
    isIOS,
    canUseNotifications,
  }
}
