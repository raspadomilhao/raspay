import { sql } from './database'
import webpush from 'web-push'

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:admin@raspay.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscriptionData {
  id?: number
  user_id: number
  endpoint: string
  p256dh_key: string
  auth_key: string
  user_agent?: string
  is_active?: boolean
}

export async function savePushSubscription(data: PushSubscriptionData): Promise<void> {
  console.log('💾 Salvando subscription no banco de dados...')
  
  try {
    // Desativar subscriptions antigas do mesmo usuário
    await sql`
      UPDATE push_subscriptions 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = ${data.user_id} AND is_active = true
    `

    // Inserir nova subscription
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent, is_active)
      VALUES (${data.user_id}, ${data.endpoint}, ${data.p256dh_key}, ${data.auth_key}, ${data.user_agent || 'Unknown'}, true)
    `

    console.log('✅ Subscription salva com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao salvar subscription:', error)
    throw error
  }
}

export async function getActiveSubscriptions(): Promise<PushSubscriptionData[]> {
  try {
    const subscriptions = await sql`
      SELECT * FROM push_subscriptions 
      WHERE is_active = true
      ORDER BY created_at DESC
    `
    return subscriptions
  } catch (error) {
    console.error('❌ Erro ao buscar subscriptions:', error)
    return []
  }
}

export async function sendDepositNotification(depositData: {
  userName: string
  amount: number
  method: string
  transactionId: number
}): Promise<void> {
  console.log('🔔 Enviando notificações de depósito confirmado...')
  
  try {
    const subscriptions = await getActiveSubscriptions()
    
    if (subscriptions.length === 0) {
      console.log('ℹ️ Nenhuma subscription ativa encontrada')
      return
    }

    const notificationPayload = {
      title: '💰 Depósito Confirmado!',
      body: `${depositData.userName} depositou R$ ${depositData.amount.toFixed(2)} via ${depositData.method}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        transactionId: depositData.transactionId,
        amount: depositData.amount,
        userName: depositData.userName,
        method: depositData.method,
        timestamp: Date.now(),
        url: '/administrador'
      },
      actions: [
        {
          action: 'view',
          title: 'Ver Admin'
        }
      ],
      requireInteraction: true,
      tag: 'deposit-notification'
    }

    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        )

        console.log(`✅ Notificação enviada para subscription ${sub.id}`)
      } catch (error) {
        console.error(`❌ Erro ao enviar para subscription ${sub.id}:`, error)
        
        // Se a subscription é inválida, desativar
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`
            UPDATE push_subscriptions 
            SET is_active = false, updated_at = NOW()
            WHERE id = ${sub.id}
          `
          console.log(`🗑️ Subscription ${sub.id} desativada (inválida)`)
        }
      }
    })

    await Promise.allSettled(promises)
    console.log('🎉 Processo de notificações concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral ao enviar notificações:', error)
  }
}

export async function removeUserSubscriptions(userId: number): Promise<void> {
  try {
    await sql`
      UPDATE push_subscriptions 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = ${userId} AND is_active = true
    `
    console.log(`🗑️ Subscriptions do usuário ${userId} desativadas`)
  } catch (error) {
    console.error('❌ Erro ao remover subscriptions:', error)
    throw error
  }
}
