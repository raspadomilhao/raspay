import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Simple in-memory storage for demo (replace with database in production)
let activeSubscriptions: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('📨 Recebida ação:', action)

    switch (action) {
      case 'subscribe':
        const subscription = data.subscription
        
        // Salvar subscription em memória (para demo)
        const subscriptionData = {
          id: Date.now(),
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          timestamp: new Date().toISOString()
        }

        // Remove subscriptions antigas e adiciona a nova
        activeSubscriptions = activeSubscriptions.filter(sub => sub.endpoint !== subscription.endpoint)
        activeSubscriptions.push(subscriptionData)
        
        console.log('✅ Subscription salva:', subscriptionData.id)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Inscrito com sucesso! Você receberá notificações de depósitos confirmados.',
          subscriptionId: subscriptionData.id
        })

      case 'unsubscribe':
        activeSubscriptions = []
        console.log('🗑️ Todas as subscriptions removidas')
        
        return NextResponse.json({ 
          success: true, 
          message: 'Desinscrito com sucesso!' 
        })

      case 'send':
        const { usuario, valor, metodo, id } = data
        
        if (activeSubscriptions.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'Nenhuma subscription ativa. Ative as notificações primeiro.' 
          })
        }

        // Simular envio de notificação (sem web-push por enquanto)
        console.log('🔔 Simulando envio de notificação:', {
          usuario,
          valor,
          metodo,
          subscriptions: activeSubscriptions.length
        })

        // Em produção, aqui seria usado o web-push
        // Por enquanto, apenas log para debug
        const notificationData = {
          title: '💰 Depósito Confirmado!',
          body: `${usuario} depositou R$ ${valor} via ${metodo}`,
          timestamp: new Date().toISOString()
        }

        console.log('📱 Notificação que seria enviada:', notificationData)

        return NextResponse.json({ 
          success: true, 
          message: `Notificação simulada enviada para ${activeSubscriptions.length} dispositivo(s)!`,
          notification: notificationData
        })

      case 'status':
        return NextResponse.json({
          success: true,
          activeSubscriptions: activeSubscriptions.length,
          subscriptions: activeSubscriptions.map(sub => ({
            id: sub.id,
            userAgent: sub.userAgent,
            timestamp: sub.timestamp
          }))
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Ação inválida. Use: subscribe, unsubscribe, send, ou status' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Erro na API de notificações:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de notificações funcionando',
    activeSubscriptions: activeSubscriptions.length,
    endpoints: ['POST /subscribe', 'POST /unsubscribe', 'POST /send', 'POST /status']
  })
}
