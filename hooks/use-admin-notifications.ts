"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNotifications } from "./use-notifications"

interface AdminNotificationData {
  type: "withdraw" | "deposit"
  title: string
  body: string
  data?: any
  timestamp: number
  id: string
  read?: boolean
}

interface UseAdminNotificationsReturn {
  isConnected: boolean
  notifications: AdminNotificationData[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  connect: () => void
  disconnect: () => void
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const { sendNotification, permission } = useNotifications()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("🔌 Já conectado ao SSE")
      return
    }

    console.log("🔌 Conectando ao SSE de notificações admin...")

    const eventSource = new EventSource("/api/admin/notifications/stream")
    eventSourceRef.current = eventSource

    eventSource.onopen = (event) => {
      console.log("✅ Conectado ao SSE de notificações", event)
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("📨 Mensagem SSE recebida:", data)

        if (data.type === "NOTIFICATION") {
          const notification = data.payload as AdminNotificationData

          // Adicionar à lista de notificações
          setNotifications((prev) => [notification, ...prev.slice(0, 49)]) // Manter apenas 50 notificações
          setUnreadCount((prev) => prev + 1)

          // Enviar notificação push se permitido
          if (permission === "granted") {
            sendNotification({
              type: notification.type,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              requireInteraction: true,
            })
          }
        } else if (data.type === "CONNECTED") {
          console.log("🔌 Confirmação de conexão SSE:", data.message)
          setIsConnected(true)
        } else if (data.type === "HEARTBEAT") {
          console.log("💓 Heartbeat SSE recebido")
          setIsConnected(true)
        }
      } catch (error) {
        console.error("❌ Erro ao processar mensagem SSE:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("❌ Erro no SSE:", error)
      console.error("❌ EventSource readyState:", eventSource.readyState)
      console.error("❌ EventSource url:", eventSource.url)
      setIsConnected(false)

      // Close the current connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        console.log("🔄 Tentando reconectar SSE...")
        connect()
      }, 5000)
    }

    // Handle connection close
    eventSource.addEventListener("close", () => {
      console.log("🔌 Conexão SSE fechada")
      setIsConnected(false)
    })
  }, [sendNotification, permission])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("🔌 Desconectando SSE...")
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Auto-conectar quando o hook é usado
  useEffect(() => {
    connect()

    // Cleanup na desmontagem
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup quando a página é fechada
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [disconnect])

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connect,
    disconnect,
  }
}
