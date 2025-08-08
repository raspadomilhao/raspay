'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Send, Smartphone, CheckCircle, AlertCircle, Zap, Settings } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function KelvinhoPage() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    usuario: '',
    valor: '',
    metodo: '',
    observacoes: ''
  })

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error('Erro ao registrar service worker:', error)
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })
      
      setSubscription(sub)
      
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', subscription: sub })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('🎉 Notificações automáticas ativadas! Você receberá alertas de depósitos confirmados.')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error)
      toast.error('Erro ao ativar notificações')
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe' })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Notificações desativadas')
      }
    } catch (error) {
      console.error('Erro ao desativar notificações:', error)
      toast.error('Erro ao desativar notificações')
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!subscription) {
      toast.error('Ative as notificações primeiro!')
      return
    }

    if (!formData.usuario || !formData.valor || !formData.metodo) {
      toast.error('Preencha todos os campos obrigatórios!')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/kelvinho/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          usuario: formData.usuario,
          valor: formData.valor,
          metodo: formData.metodo,
          id: Date.now().toString()
        })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Notificação de teste enviada!')
        // Limpar formulário
        setFormData({ usuario: '', valor: '', metodo: '', observacoes: '' })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast.error('Erro ao enviar notificação')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Não Suportado</CardTitle>
            <CardDescription>
              Seu navegador não suporta notificações push. Use um navegador moderno como Chrome, Firefox ou Safari.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Smartphone className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Kelvinho Push</h1>
          </div>
          <p className="text-gray-600">Sistema de notificações para depósitos confirmados</p>
        </div>

        {/* Status das Notificações Automáticas */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="w-5 h-5" />
              Notificações Automáticas
            </CardTitle>
            <CardDescription className="text-green-700">
              Receba alertas instantâneos quando depósitos forem confirmados pelo HorsePay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">
                  {subscription ? '🟢 Sistema Ativo' : '🔴 Sistema Inativo'}
                </p>
                <p className="text-sm text-green-700">
                  {subscription 
                    ? 'Você receberá notificações automáticas de todos os depósitos confirmados' 
                    : 'Ative para receber alertas automáticos no seu celular'
                  }
                </p>
              </div>
              <Badge variant={subscription ? 'default' : 'secondary'} className="bg-green-600">
                {subscription ? 'ATIVO' : 'INATIVO'}
              </Badge>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Webhook do HorsePay confirma depósito</li>
                <li>• Sistema envia notificação push automaticamente</li>
                <li>• Você recebe alerta instantâneo no celular</li>
                <li>• Clique na notificação para ir ao painel admin</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              {subscription ? (
                <Button 
                  onClick={unsubscribeFromPush} 
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  Desativar
                </Button>
              ) : (
                <Button 
                  onClick={subscribeToPush} 
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Bell className="w-4 h-4" />
                  Ativar Notificações Automáticas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Teste Manual
            </CardTitle>
            <CardDescription>
              Envie uma notificação de teste para verificar se está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Nome do Usuário *</Label>
                <Input
                  id="usuario"
                  placeholder="Ex: João Silva"
                  value={formData.usuario}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="metodo">Método de Pagamento *</Label>
              <Select 
                value={formData.metodo} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, metodo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais (opcional)"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>

            <Button 
              onClick={sendTestNotification}
              disabled={isLoading || !subscription}
              className="w-full flex items-center gap-2"
              size="lg"
              variant="outline"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Enviando...' : 'Enviar Teste'}
            </Button>

            {!subscription && (
              <p className="text-sm text-amber-600 text-center">
                ⚠️ Ative as notificações primeiro para poder enviar testes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm">Clique em "Ativar Notificações Automáticas" e permita quando o navegador solicitar</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm">Agora você receberá alertas automáticos sempre que um depósito for confirmado</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm">Use o formulário de teste para verificar se as notificações estão funcionando</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
