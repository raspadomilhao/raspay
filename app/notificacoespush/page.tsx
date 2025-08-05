"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAdminNotifications } from "@/hooks/use-admin-notifications"
import { Bell, TestTube, Settings, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Subscription {
  id: number
  created_at: string
  active: boolean
  user_agent: string
}

export default function NotificacoesPushPage() {
  const { isSupported, permission, isRegistered, isLoading, error, register, sendTestNotification } =
    useAdminNotifications()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true)
    try {
      const response = await fetch("/api/admin/notifications/send?action=subscriptions")
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.subscriptions)
        setStats({ total: data.total, active: data.active })
      }
    } catch (error) {
      console.error("❌ Erro ao carregar subscriptions:", error)
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  const handleRegister = async () => {
    const success = await register()
    if (success) {
      await loadSubscriptions()
    }
  }

  const handleTest = async () => {
    await sendTestNotification()
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Permitido
          </Badge>
        )
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Negado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
    }
  }

  const getSupportBadge = () => {
    return isSupported ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Suportado
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Não Suportado
      </Badge>
    )
  }

  const getRegistrationBadge = () => {
    return isRegistered ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Bell className="w-8 h-8 text-blue-600" />
            Notificações Push
          </h1>
          <p className="text-gray-600">
            Configure notificações push para receber alertas de depósitos válidos em tempo real
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Suporte do Navegador
              </CardTitle>
            </CardHeader>
            <CardContent>{getSupportBadge()}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Permissão
              </CardTitle>
            </CardHeader>
            <CardContent>{getPermissionBadge()}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Status do Registro
              </CardTitle>
            </CardHeader>
            <CardContent>{getRegistrationBadge()}</CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Configurar Notificações
            </CardTitle>
            <CardDescription>
              Ative as notificações para receber alertas quando um depósito válido for processado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Safari mais recente.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRegister}
                disabled={!isSupported || isLoading}
                className="flex items-center gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Configurando...
                  </>
                ) : isRegistered ? (
                  <>
                    <Bell className="w-4 h-4" />
                    Reconfigurar Notificações
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Ativar Notificações
                  </>
                )}
              </Button>

              <Button
                onClick={handleTest}
                disabled={!isRegistered || isLoading}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                size="lg"
              >
                <TestTube className="w-4 h-4" />
                Testar Notificação
              </Button>
            </div>

            {isRegistered && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ Notificações ativadas! Você receberá alertas quando novos depósitos válidos forem processados.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estatísticas de Subscriptions
            </CardTitle>
            <CardDescription>Informações sobre as subscriptions ativas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-gray-600">Ativas</div>
              </div>
            </div>

            <Button onClick={loadSubscriptions} disabled={loadingSubscriptions} variant="outline" size="sm">
              {loadingSubscriptions ? "Carregando..." : "Atualizar"}
            </Button>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Ativação</h4>
                  <p className="text-sm text-gray-600">
                    Clique em "Ativar Notificações" e permita quando o navegador solicitar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Teste</h4>
                  <p className="text-sm text-gray-600">
                    Use o botão "Testar" para verificar se as notificações estão funcionando
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Alertas Automáticos</h4>
                  <p className="text-sm text-gray-600">
                    Receba notificações instantâneas quando depósitos válidos forem processados
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions Recentes</CardTitle>
              <CardDescription>Lista das subscriptions mais recentes no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sub.active ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">Subscription #{sub.id}</div>
                        <div className="text-xs text-gray-500">{new Date(sub.created_at).toLocaleString("pt-BR")}</div>
                      </div>
                    </div>
                    <Badge variant={sub.active ? "default" : "secondary"}>{sub.active ? "Ativa" : "Inativa"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
