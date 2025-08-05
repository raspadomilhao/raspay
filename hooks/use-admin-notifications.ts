"use client"

import { useState, useEffect, useCallback } from "react"

interface NotificationData {
  title: string
  body: string
  icon?: string
  image?: string
  data?: any
  tag?: string
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export function useAdminNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar suporte a notificações
  useEffect(() => {
    const checkSupport = () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)
      }

      console.log("📱 Suporte a notificações:", supported)
      console.log("🔐 Permissão atual:", Notification.permission)
    }

    checkSupport()
  }, [])

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Notificações não são suportadas neste navegador")
    }

    try {
      console.log("🔧 Registrando Service Worker...")
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("✅ Service Worker registrado:", registration)
      return registration
    } catch (error) {
      console.error("❌ Erro ao registrar Service Worker:", error)
      throw error
    }
  }, [isSupported])

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Notificações não são suportadas neste navegador")
    }

    try {
      console.log("🔐 Solicitando permissão para notificações...")
      const permission = await Notification.requestPermission()
      setPermission(permission)
      console.log("🔐 Permissão concedida:", permission)
      return permission === "granted"
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão:", error)
      throw error
    }
  }, [isSupported])

  // Registrar para receber notificações push
  const registerForNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Registrar Service Worker
      const registration = await registerServiceWorker()

      // 2. Solicitar permissão
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        throw new Error("Permissão para notificações negada")
      }

      // 3. Obter chave pública VAPID
      console.log("🔑 Obtendo chave VAPID...")
      const vapidResponse = await fetch("/api/admin/notifications/send")
      const vapidData = await vapidResponse.json()

      if (!vapidData.success) {
        throw new Error("Erro ao obter chave VAPID")
      }

      // 4. Criar subscription
      console.log("📝 Criando subscription...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.vapidPublicKey,
      })

      console.log("📝 Subscription criada:", subscription)

      // 5. Enviar subscription para o servidor
      console.log("📤 Enviando subscription para servidor...")
      const registerResponse = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "register",
          subscription: subscription.toJSON(),
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerData.success) {
        throw new Error(registerData.error || "Erro ao registrar subscription")
      }

      setIsRegistered(true)
      console.log("✅ Notificações ativadas com sucesso!")

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setError(errorMessage)
      console.error("❌ Erro ao ativar notificações:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [registerServiceWorker, requestPermission])

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "send",
          notification: {
            title: "🧪 Teste de Notificação",
            body: "Se você está vendo isso, as notificações estão funcionando!",
            icon: "/icon-192.png",
            tag: "test",
            data: {
              url: "/adminconfig",
              type: "test",
            },
          },
        }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("❌ Erro ao enviar notificação de teste:", error)
      return false
    }
  }, [])

  return {
    isSupported,
    permission,
    isRegistered,
    isLoading,
    error,
    registerForNotifications,
    sendTestNotification,
  }
}
