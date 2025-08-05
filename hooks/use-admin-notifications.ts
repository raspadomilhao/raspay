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

      console.log("📱 Verificação de suporte:")
      console.log("📱 Service Worker:", "serviceWorker" in navigator)
      console.log("📱 Push Manager:", "PushManager" in window)
      console.log("📱 Notification:", "Notification" in window)
      console.log("📱 Suporte completo:", supported)
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

      // Verificar se já existe um service worker registrado
      const existingRegistration = await navigator.serviceWorker.getRegistration("/sw.js")
      if (existingRegistration) {
        console.log("✅ Service Worker já registrado:", existingRegistration)
        return existingRegistration
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("✅ Service Worker registrado com sucesso!")
      console.log("📊 Registration scope:", registration.scope)
      console.log("📊 Registration state:", registration.installing?.state || registration.active?.state)

      // Aguardar o service worker estar ativo
      if (registration.installing) {
        console.log("⏳ Aguardando Service Worker instalar...")
        await new Promise((resolve) => {
          registration.installing!.addEventListener("statechange", () => {
            if (registration.installing!.state === "installed") {
              console.log("✅ Service Worker instalado!")
              resolve(undefined)
            }
          })
        })
      }

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
      console.log("🔐 Permissão atual:", Notification.permission)

      const permission = await Notification.requestPermission()
      setPermission(permission)

      console.log("🔐 Nova permissão:", permission)

      if (permission !== "granted") {
        throw new Error("Permissão para notificações negada")
      }

      return true
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
      console.log("🚀 Iniciando registro para notificações...")

      // 1. Registrar Service Worker
      console.log("📝 Passo 1: Registrar Service Worker")
      const registration = await registerServiceWorker()

      // 2. Solicitar permissão
      console.log("📝 Passo 2: Solicitar permissão")
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        throw new Error("Permissão para notificações negada")
      }

      // 3. Obter chave pública VAPID
      console.log("📝 Passo 3: Obter chave VAPID")
      const vapidResponse = await fetch("/api/admin/notifications/send")
      const vapidData = await vapidResponse.json()

      console.log("🔑 Resposta VAPID:", vapidData)

      if (!vapidData.success || !vapidData.vapidPublicKey) {
        throw new Error("Erro ao obter chave VAPID: " + (vapidData.error || "Chave não encontrada"))
      }

      // 4. Verificar se já existe uma subscription
      console.log("📝 Passo 4: Verificar subscription existente")
      const existingSubscription = await registration.pushManager.getSubscription()

      if (existingSubscription) {
        console.log("✅ Subscription existente encontrada")
        console.log("🔗 Endpoint:", existingSubscription.endpoint.substring(0, 50) + "...")

        // Registrar a subscription existente no servidor
        const registerResponse = await fetch("/api/admin/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "register",
            subscription: existingSubscription.toJSON(),
          }),
        })

        const registerData = await registerResponse.json()
        console.log("📤 Resultado do registro:", registerData)

        if (registerData.success) {
          setIsRegistered(true)
          console.log("✅ Notificações já estavam ativas!")
          return true
        }
      }

      // 5. Criar nova subscription
      console.log("📝 Passo 5: Criar nova subscription")
      console.log("🔑 VAPID Public Key:", vapidData.vapidPublicKey.substring(0, 20) + "...")

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.vapidPublicKey,
      })

      console.log("📝 Nova subscription criada!")
      console.log("🔗 Endpoint:", subscription.endpoint.substring(0, 50) + "...")
      console.log("🔑 Keys:", !!subscription.getKey)

      // 6. Enviar subscription para o servidor
      console.log("📝 Passo 6: Registrar no servidor")
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
      console.log("📤 Resultado do registro:", registerData)

      if (!registerData.success) {
        throw new Error(registerData.error || "Erro ao registrar subscription")
      }

      setIsRegistered(true)
      console.log("✅ Notificações ativadas com sucesso!")
      console.log("📊 Total de subscriptions:", registerData.total)

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
      console.log("🧪 Enviando notificação de teste...")

      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "send",
          notification: {
            title: "🧪 Teste de Notificação - Raspay",
            body: "Se você está vendo isso, as notificações estão funcionando perfeitamente! 🎉",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "test-notification",
            data: {
              url: "/adminconfig",
              type: "test",
              timestamp: Date.now(),
            },
            actions: [
              {
                action: "view",
                title: "Ver Painel",
              },
              {
                action: "close",
                title: "Fechar",
              },
            ],
          },
        }),
      })

      const data = await response.json()
      console.log("🧪 Resultado do teste:", data)

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
