import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { sql } from "@/lib/database"

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidEmail = process.env.VAPID_EMAIL || "admin@raspay.space"

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: NextRequest) {
  try {
    const { type, notification } = await request.json()

    console.log("🔔 Recebida solicitação de notificação:", { type, notification })

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ Chaves VAPID não configuradas")
      return NextResponse.json({ success: false, error: "Chaves VAPID não configuradas" }, { status: 500 })
    }

    if (type === "send") {
      // Buscar todas as subscriptions ativas
      const subscriptions = await sql`
        SELECT * FROM admin_push_subscriptions 
        WHERE active = true
      `

      console.log(`📊 Encontradas ${subscriptions.length} subscriptions ativas`)

      const results = []
      let successCount = 0

      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          console.log(`📤 Enviando para subscription ${subscription.id}...`)

          await webpush.sendNotification(pushSubscription, JSON.stringify(notification))

          results.push({
            subscription_id: subscription.id,
            success: true,
            message: "Enviado com sucesso",
          })
          successCount++

          console.log(`✅ Notificação enviada para subscription ${subscription.id}`)
        } catch (error) {
          console.error(`❌ Erro ao enviar para subscription ${subscription.id}:`, error)

          // Se a subscription é inválida, marcar como inativa
          if (error instanceof Error && (error.message.includes("410") || error.message.includes("invalid"))) {
            await sql`
              UPDATE admin_push_subscriptions 
              SET active = false 
              WHERE id = ${subscription.id}
            `
            console.log(`🗑️ Subscription ${subscription.id} marcada como inativa`)
          }

          results.push({
            subscription_id: subscription.id,
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          })
        }
      }

      return NextResponse.json({
        success: successCount > 0,
        message: `Notificação enviada para ${successCount} de ${subscriptions.length} admins`,
        results,
        stats: {
          total: subscriptions.length,
          success: successCount,
          failed: subscriptions.length - successCount,
        },
      })
    }

    return NextResponse.json({ success: false, error: "Tipo de ação inválido" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erro no endpoint de notificações:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "vapid") {
      return NextResponse.json({
        success: true,
        vapidPublicKey: vapidPublicKey || null,
        hasVapidKeys: !!(vapidPublicKey && vapidPrivateKey),
        totalSubscriptions: 0,
        environment: process.env.NODE_ENV || "development",
      })
    }

    if (action === "subscriptions") {
      const subscriptions = await sql`
        SELECT id, created_at, active, user_agent 
        FROM admin_push_subscriptions 
        ORDER BY created_at DESC
      `

      return NextResponse.json({
        success: true,
        subscriptions,
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.active).length,
      })
    }

    return NextResponse.json({ success: false, error: "Ação não especificada" }, { status: 400 })
  } catch (error) {
    console.error("❌ Erro no GET de notificações:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
