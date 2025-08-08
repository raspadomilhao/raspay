import { NextRequest, NextResponse } from 'next/server'
import { savePushSubscription, removeUserSubscriptions, sendDepositNotification } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'subscribe':
        const subscription = data.subscription
        
        // Extrair dados da subscription
        const subscriptionData = {
          user_id: 1, // Admin user ID (você)
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: request.headers.get('user-agent') || 'Unknown'
        }

        await savePushSubscription(subscriptionData)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Inscrito com sucesso! Você receberá notificações de depósitos confirmados.' 
        })

      case 'unsubscribe':
        await removeUserSubscriptions(1) // Admin user ID
        
        return NextResponse.json({ 
          success: true, 
          message: 'Desinscrito com sucesso!' 
        })

      case 'send':
        const { usuario, valor, metodo, id } = data
        
        await sendDepositNotification({
          userName: usuario,
          amount: parseFloat(valor),
          method: metodo,
          transactionId: parseInt(id) || Date.now()
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Notificação de teste enviada!' 
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Ação inválida' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Erro na API de notificações:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
