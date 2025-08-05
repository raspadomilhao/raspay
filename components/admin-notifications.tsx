"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAdminNotifications } from "@/hooks/use-admin-notifications"
import { toast } from "sonner"
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle, Loader2, TestTube, Settings, Bug } from "lucide-react"

export function AdminNotifications() {
  const { isSupported, permission, isRegistered, isLoading, error, registerForNotifications, sendTestNotification } =
    useAdminNotifications()

  const [isTestLoading, setIsTestLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleActivateNotifications = async () => {
    try {
      await registerForNotifications()
      toast.success("🔔 Notificações ativadas com sucesso!")
    } catch (error) {
      toast.error(`❌ Erro ao ativar notificações: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    }
  }

  const handleTestNotification = async () => {
    setIsTestLoading(true)
    try {
      console.log("🧪 Iniciando teste de notificação...")
      const success = await sendTestNotification()
      if (success) {
        toast.success("🧪 Notificação de teste enviada! Verifique se apareceu.")
      } else {
        toast.error("❌ Erro ao enviar notificação de teste")
      }
    } catch (error) {
      console.error("❌ Erro no teste:", error)
      toast.error("❌ Erro ao enviar notificação de teste")
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleDebugInfo = async () => {
    try {
      console.log("🐛 Coletando informações de debug...")

      // Verificar API
      const apiResponse = await fetch("/api/admin/notifications/send")
      const apiData = await apiResponse.json()

      // Verificar Service Worker
      const swRegistration = await navigator.serviceWorker.getRegistration()
      const subscription = swRegistration ? await swRegistration.pushManager.getSubscription() : null

      // Verificar subscriptions no servidor
      const listResponse = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "list" }),
      })
      const listData = await listResponse.json()

      const debug = {
        api: apiData,
        serviceWorker: {
          registered: !!swRegistration,
          scope: swRegistration?.scope,
          state: swRegistration?.active?.state,
        },
        subscription: {
          exists: !!subscription,
          endpoint: subscription?.endpoint?.substring(0, 50) + "...",
        },
        serverSubscriptions: listData,
        browser: {
          userAgent: navigator.userAgent,
          isSecure: location.protocol === "https:",
          permissions: Notification.permission,
        },
      }

      setDebugInfo(debug)
      console.log("🐛 Debug Info:", debug)
      toast.info("🐛 Informações de debug coletadas! Verifique o console.")
    } catch (error) {
      console.error("❌ Erro ao coletar debug:", error)
      toast.error("❌ Erro ao coletar informações de debug")
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

    if (permission === "granted" && isRegistered) {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-400 flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Ativo</span>
        </Badge>
      )
    }

    if (permission === "granted") {
      return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>Configurar</span>
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-slate-600 text-gray-400 flex items-center space-x-1">
        <BellOff className="h-3 w-3" />
        <span>Inativo</span>
      </Badge>
    )
  }

  const getStatusDescription = () => {
    if (!isSupported) {
      return "Seu navegador não suporta notificações push. Use Chrome, Firefox ou Safari mais recentes."
    }

    if (permission === "denied") {
      return "Notificações foram bloqueadas. Vá nas configurações do navegador para permitir notificações deste site."
    }

    if (permission === "granted" && isRegistered) {
      return "Notificações estão ativas! Você receberá alertas quando novos depósitos forem confirmados."
    }

    if (permission === "granted") {
      return "Permissão concedida, mas notificações não estão configuradas. Clique em 'Ativar Notificações'."
    }

    return "Ative as notificações para receber alertas em tempo real sobre depósitos confirmados."
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-400" />
          <span>Notificações Push</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Receba notificações instantâneas quando depósitos forem confirmados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <p className="text-gray-300 text-sm">{getStatusDescription()}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!isRegistered && permission !== "denied" && (
            <Button
              onClick={handleActivateNotifications}
              disabled={isLoading || !isSupported}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Ativar Notificações
                </>
              )}
            </Button>
          )}

          {isRegistered && (
            <Button
              onClick={handleTestNotification}
              disabled={isTestLoading}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none bg-transparent"
            >
              {isTestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleDebugInfo}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none bg-transparent"
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>

          {permission === "denied" && (
            <Button
              onClick={() => {
                toast.info(
                  "Vá em Configurações > Privacidade e Segurança > Notificações e permita notificações para este site.",
                )
              }}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700 flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Como Permitir
            </Button>
          )}
        </div>

        {debugInfo && (
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">🐛 Informações de Debug:</h4>
            <pre className="text-xs text-gray-300 overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        {isRegistered && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Notificações Ativas</span>
            </div>
            <p className="text-green-300 text-xs mt-1">Você receberá notificações quando:</p>
            <ul className="text-green-300 text-xs mt-1 ml-4 space-y-1">
              <li>• Novos depósitos forem confirmados</li>
              <li>• Saques forem solicitados</li>
              <li>• Novos usuários se cadastrarem</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
