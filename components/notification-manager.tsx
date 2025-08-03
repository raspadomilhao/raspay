"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { Bell, BellOff, Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface NotificationManagerProps {
  className?: string
}

export function NotificationManager({ className = "" }: NotificationManagerProps) {
  const {
    isSupported,
    permission,
    isServiceWorkerReady,
    requestPermission,
    sendNotification,
    subscribeToNotifications,
  } = useNotifications()

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isServiceWorkerReady && permission === "granted") {
      checkSubscriptionStatus()
    }
  }, [isServiceWorkerReady, permission])

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error("Erro ao verificar subscription:", error)
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)

    try {
      // Solicitar permissão
      const permissionGranted = await requestPermission()

      if (!permissionGranted) {
        toast.error("Permissão para notificações negada")
        return
      }

      // Criar subscription
      const subscription = await subscribeToNotifications()

      if (subscription) {
        setIsSubscribed(true)
        toast.success("Notificações ativadas com sucesso!")

        // Enviar notificação de teste
        await sendNotification({
          type: "deposit",
          title: "🔔 Notificações Ativadas!",
          body: "Você receberá alertas sobre saques pendentes e novos depósitos.",
          requireInteraction: false,
        })
      } else {
        toast.error("Erro ao ativar notificações")
      }
    } catch (error) {
      console.error("Erro ao ativar notificações:", error)
      toast.error("Erro ao ativar notificações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    const success = await sendNotification({
      type: "withdraw",
      title: "🧪 Notificação de Teste",
      body: "Esta é uma notificação de teste do sistema RasPay Admin.",
      requireInteraction: true,
      data: {
        type: "test",
        timestamp: Date.now(),
      },
    })

    if (success) {
      toast.success("Notificação de teste enviada!")
    } else {
      toast.error("Erro ao enviar notificação de teste")
    }
  }

  const getStatusBadge = () => {
    if (!isSupported) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Não Suportado</span>
        </Badge>
      )
    }

    if (permission === "denied") {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Bloqueado</span>
        </Badge>
      )
    }

    if (permission === "granted" && isSubscribed) {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-400 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Ativo</span>
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3" />
        <span>Inativo</span>
      </Badge>
    )
  }

  const getStatusDescription = () => {
    if (!isSupported) {
      return "Seu navegador não suporta notificações push."
    }

    if (permission === "denied") {
      return "Notificações foram bloqueadas. Ative nas configurações do navegador."
    }

    if (permission === "granted" && isSubscribed) {
      return "Você receberá notificações sobre saques pendentes e novos depósitos."
    }

    return "Ative as notificações para receber alertas em tempo real."
  }

  if (!isSupported) {
    return (
      <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BellOff className="h-5 w-5 text-red-400" />
            <span>Notificações Push</span>
          </CardTitle>
          <CardDescription>Seu navegador não suporta notificações push.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            <span>Notificações Push</span>
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>{getStatusDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">Service Worker</h4>
            <div className="flex items-center space-x-2">
              {isServiceWorkerReady ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-400 text-xs">{isServiceWorkerReady ? "Ativo" : "Inativo"}</span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">Permissão</h4>
            <div className="flex items-center space-x-2">
              {permission === "granted" ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : permission === "denied" ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              )}
              <span className="text-gray-400 text-xs capitalize">{permission || "Não solicitada"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <h4 className="text-white text-sm font-medium mb-2">Tipos de Notificação</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Novos saques pendentes (afiliados e gerentes)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Depósitos válidos confirmados</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {permission !== "granted" || !isSubscribed ? (
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading || !isServiceWorkerReady}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isLoading ? "Ativando..." : "Ativar Notificações"}
              </Button>
            ) : (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700 flex-1 bg-transparent"
              >
                <Settings className="h-4 w-4 mr-2" />
                Testar Notificação
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
