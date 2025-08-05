"use client"

import { useState, useEffect } from "react"

interface NotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isRegistered: boolean
  isLoading: boolean
  error: string | null
}

export function useAdminNotifications() {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: "default",
    isRegistered: false,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    // Verificar suporte
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "denied",
    }))

    if (isSupported) {
      checkRegistration()
    }
  }, [])

  const checkRegistration = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        setState((prev) => ({
          ...prev,
          isRegistered: !!subscription,
        }))
      }
    } catch (error) {
      console.error("❌ Erro ao verificar registro:", error)
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error("Notificações não são suportadas neste navegador")
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("🔐 Solicitando permissão para notificações...")

      const permission = await Notification.requestPermission()
      console.log("🔐 Permissão obtida:", permission)

      if (permission !== "granted") {
        throw new Error("Permissão para notificações negada")
      }

      setState((prev) => ({ ...prev, permission }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("❌ Erro ao solicitar permissão:", errorMessage)
      setState((prev) => ({ ...prev, error: errorMessage }))
      return false
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const register = async (): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error("Notificações não são suportadas")
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("🚀 Iniciando registro para notificações...")

      // 1. Registrar Service Worker
      console.log("📝 Registrando Service Worker...")
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("✅ Service Worker registrado:", registration)

      // 2. Solicitar permissão
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        return false
      }

      // 3. Obter chave VAPID
      console.log("🔑 Obtendo chave VAPID...")
      const vapidResponse = await fetch("/api/admin/notifications/send?action=vapid")
      const vapidData = await vapidResponse.json()

      if (!vapidData.success || !vapidData.vapidPublicKey) {
        throw new Error("Chaves VAPID não configuradas no servidor")
      }

      console.log("🔑 Chave VAPID obtida")

      // 4. Criar subscription
      console.log("📝 Criando subscription...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.vapidPublicKey,
      })

      console.log("✅ Subscription criada")

      // 5. Registrar no servidor
      console.log("📤 Registrando no servidor...")
      const registerResponse = await fetch("/api/admin/notifications/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      })

      const registerData = await registerResponse.json()

      if (!registerData.success) {
        throw new Error(registerData.error || "Erro ao registrar no servidor")
      }

      console.log("✅ Registrado no servidor")

      setState((prev) => ({
        ...prev,
        isRegistered: true,
      }))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("❌ Erro ao registrar:", errorMessage)
      setState((prev) => ({ ...prev, error: errorMessage }))
      return false
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const sendTestNotification = async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("🧪 Enviando notificação de teste...")

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
            badge: "/icon-192.png",
            tag: "test",
            data: {
              url: "/adminconfig",
              timestamp: Date.now(),
            },
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Erro ao enviar notificação")
      }

      console.log("✅ Notificação de teste enviada:", data)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("❌ Erro ao enviar teste:", errorMessage)
      setState((prev) => ({ ...prev, error: errorMessage }))
      return false
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return {
    ...state,
    register,
    sendTestNotification,
  }
}
