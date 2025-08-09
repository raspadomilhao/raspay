'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Send, Smartphone, CheckCircle, XCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function KelvinhoPage() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('Verificando...')
  const [formData, setFormData] = useState({
    usuario: '',
    valor: '',
    metodo: 'pix',
    id: ''
  })
  const { toast } = useToast()

  // Verificar status das notificações ao carregar
  useEffect(() => {
    checkNotificationStatus()
    checkSubscriptionStatus()
  }, [])

  const checkNotificationStatus = () => {
    if (!('Notification' in window)) {
      setSubscriptionStatus('❌ Navegador não suporta notificações')
      return
    }

    const permission = Notification.permission
    switch (permission) {
      case 'granted':
        setSubscriptionStatus('✅ Notificações permitidas')
        break
      case 'denied':
        setSubscriptionStatus('❌ Notificações bloqueadas')
        break
      default:
        setSubscriptionStatus('⚠️ Permissão pendente')
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      })

      const data = await response.json()
      if (data.success && data.activeSubscriptions > 0) {
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "❌ Não Suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive"
      })
      return false
    }

    const permission = await Notification.requestPermission()
    checkNotificationStatus()
    
    if (permission === 'granted') {
      toast({
        title: "✅ Permissão Concedida",
        description: "Notificações foram habilitadas com sucesso!",
      })
      return true
    } else {
      toast({
        title: "❌ Permissão Negada",
        description: "Você precisa permitir notificações para receber alertas.",
        variant: "destructive"
      })
      return false
    }
  }

  const subscribeToNotifications = async () => {
    setIsLoading(true)
    
    try {
      // Primeiro, solicitar permissão
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        setIsLoading(false)
        return
      }

      // Registrar service worker (se disponível)
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js')
        } catch (swError) {
          console.log('Service Worker não disponível:', swError)
        }
      }

      // Simular subscription (sem web-push real por enquanto)
      const mockSubscription = {
        endpoint: `https://mock-endpoint-${Date.now()}.com`,
        keys: {
          p256dh: 'mock-p256dh-key',
          auth: 'mock-auth-key'
        }
      }

      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: mockSubscription
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setIsSubscribed(true)
        toast({
          title: "🔔 Notificações Ativadas!",
          description: data.message,
        })
      } else {
        throw new Error(data.error || 'Erro ao ativar notificações')
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : 'Erro ao ativar notificações',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromNotifications = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe' })
      })

      const data = await response.json()
      
      if (data.success) {
        setIsSubscribed(false)
        toast({
          title: "🔕 Notificações Desativadas",
          description: data.message,
        })
      } else {
        throw new Error(data.error || 'Erro ao desativar notificações')
      }
    } catch (error) {
      console.error('Erro ao desativar notificações:', error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : 'Erro ao desativar notificações',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!formData.usuario || !formData.valor) {
      toast({
        title: "⚠️ Campos Obrigatórios",
        description: "Preencha pelo menos o usuário e valor.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          ...formData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "📱 Notificação Enviada!",
          description: data.message,
        })
        
        // Limpar formulário
        setFormData({
          usuario: '',
          valor: '',
          metodo: 'pix',
          id: ''
        })
      } else {
        throw new Error(data.error || 'Erro ao enviar notificação')
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar notificação',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            🔔 Notificações Kelvinho
          </h1>
          <p className="text-gray-600">
            Sistema de alertas para depósitos confirmados
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status das Notificações
            </CardTitle>
            <CardDescription>
              Configure e monitore suas notificações push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Permissão do Navegador:</span>
              <Badge variant={subscriptionStatus.includes('✅') ? 'default' : 'secondary'}>
                {subscriptionStatus}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Inscrição:</span>
              <Badge variant={isSubscribed ? 'default' : 'outline'}>
                {isSubscribed ? '✅ Ativo' : '❌ Inativo'}
              </Badge>
            </div>

            <div className="pt-4">
              {!isSubscribed ? (
                <Button 
                  onClick={subscribeToNotifications}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {isLoading ? 'Ativando...' : 'Ativar Notificações'}
                </Button>
              ) : (
                <Button 
                  onClick={unsubscribeFromNotifications}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  {isLoading ? 'Desativando...' : 'Desativar Notificações'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Simular Depósito Confirmado
            </CardTitle>
            <CardDescription>
              Envie uma notificação de teste para verificar se está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Nome do Usuário</Label>
                <Input
                  id="usuario"
                  placeholder="Ex: João Silva"
                  value={formData.usuario}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pagamento</Label>
                <Select 
                  value={formData.metodo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, metodo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id">ID da Transação (Opcional)</Label>
                <Input
                  id="id"
                  placeholder="Ex: 12345"
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={sendTestNotification}
              disabled={isLoading || !isSubscribed}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Enviando...' : 'Enviar Notificação de Teste'}
            </Button>

            {!isSubscribed && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <Info className="h-4 w-4" />
                Ative as notificações primeiro para poder enviar testes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Ativar Notificações:</strong> Permite que o navegador envie alertas push</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Teste Manual:</strong> Simula um depósito confirmado para testar o sistema</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Integração Futura:</strong> Será conectado ao webhook do HorsePay para alertas automáticos</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
