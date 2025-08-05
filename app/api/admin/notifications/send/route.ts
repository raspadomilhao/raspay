import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configurar Web Push (você precisa gerar essas chaves)
const vapidKeys = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa40HcCWLWw-o18aGEtH5VJyNjhQRFN-JHoOmqKMFoO4Z4NLB5ZBHSd2F6eY8M",
  privateKey: process.env.VAPID_PRIVATE_KEY || "YUKKRJQbFsajiUIhKoH3UiSTXwbvyeNVggGFWSjVTDI",
}

webpush.setVapidDetails("mailto:admin@raspay.com", vapidKeys.publicKey, vapidKeys.privateKey)

// Armazenar subscriptions em memória (em produção, usar banco de dados)
const subscriptions = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, subscription, notification } = body

    console.log("📱 Requisição de notificação:", { type, hasSubscription: !!subscription, notification })

    // Registrar nova subscription
    if (type === "register" && subscription) {
      const subscriptionString = JSON.stringify(subscription)
      subscriptions.add(subscriptionString)
      console.log("✅ Subscription registrada. Total:", subscriptions.size)

      return NextResponse.json({
        success: true,
        message: "Subscription registrada com sucesso",
        total: subscriptions.size,
      })
    }

    // Enviar notificação para todos os admins
    if (type === "send" && notification) {
      console.log("📤 Enviando notificação para", subscriptions.size, "admins")

      const results = []

      for (const subscriptionString of subscriptions) {
        try {
          const sub = JSON.parse(subscriptionString)

          await webpush.sendNotification(sub, JSON.stringify(notification))
          results.push({ success: true, endpoint: sub.endpoint.substring(0, 50) + "..." })
          console.log("✅ Notificação enviada para:", sub.endpoint.substring(0, 50) + "...")
        } catch (error) {
          console.error("❌ Erro ao enviar para subscription:", error)

          // Se a subscription é inválida, remover
          if (error.statusCode === 410 || error.statusCode === 404) {
            subscriptions.delete(subscriptionString)
            console.log("🗑️ Subscription inválida removida")
          }

          results.push({ success: false, error: error.message })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Notificação enviada para ${results.filter((r) => r.success).length} admins`,
        results,
        total: subscriptions.size,
      })
    }

    // Listar subscriptions ativas
    if (type === "list") {
      return NextResponse.json({
        success: true,
        total: subscriptions.size,
        subscriptions: Array.from(subscriptions).map((sub) => {
          const parsed = JSON.parse(sub)
          return {
            endpoint: parsed.endpoint.substring(0, 50) + "...",
            keys: !!parsed.keys,
          }
        }),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Tipo de requisição inválido",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("❌ Erro na API de notificações:", error)
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

export async function GET() {
  return NextResponse.json({
    success: true,
    vapidPublicKey: vapidKeys.publicKey,
    totalSubscriptions: subscriptions.size,
  })
}
