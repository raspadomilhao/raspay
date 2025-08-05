import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configurar Web Push com as chaves VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
}

console.log("🔑 Configurando VAPID keys...")
console.log("🔑 Public key exists:", !!vapidKeys.publicKey)
console.log("🔑 Private key exists:", !!vapidKeys.privateKey)
console.log("🔑 Public key preview:", vapidKeys.publicKey.substring(0, 20) + "...")

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.error("❌ VAPID keys não configuradas!")
  console.error("❌ Verifique as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY")
} else {
  try {
    webpush.setVapidDetails("mailto:admin@raspay.com", vapidKeys.publicKey, vapidKeys.privateKey)
    console.log("✅ VAPID configurado com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao configurar VAPID:", error)
  }
}

// Armazenar subscriptions em memória (em produção, usar banco de dados)
const subscriptions = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, subscription, notification } = body

    console.log("📱 Requisição de notificação recebida:")
    console.log("📱 Tipo:", type)
    console.log("📱 Has subscription:", !!subscription)
    console.log("📱 Has notification:", !!notification)
    console.log("📱 Total subscriptions ativas:", subscriptions.size)

    // Registrar nova subscription
    if (type === "register" && subscription) {
      const subscriptionString = JSON.stringify(subscription)
      subscriptions.add(subscriptionString)

      console.log("✅ Nova subscription registrada!")
      console.log("📊 Total de subscriptions:", subscriptions.size)
      console.log("🔗 Endpoint:", subscription.endpoint.substring(0, 50) + "...")

      return NextResponse.json({
        success: true,
        message: "Subscription registrada com sucesso",
        total: subscriptions.size,
      })
    }

    // Enviar notificação para todos os admins
    if (type === "send" && notification) {
      console.log("📤 Enviando notificação para", subscriptions.size, "admins")
      console.log("📤 Notificação:", notification)

      if (subscriptions.size === 0) {
        console.log("⚠️ Nenhuma subscription ativa encontrada!")
        return NextResponse.json({
          success: false,
          error: "Nenhuma subscription ativa encontrada",
          total: 0,
        })
      }

      const results = []
      let successCount = 0
      let errorCount = 0

      for (const subscriptionString of subscriptions) {
        try {
          const sub = JSON.parse(subscriptionString)

          console.log("📤 Enviando para:", sub.endpoint.substring(0, 50) + "...")

          const payload = JSON.stringify({
            title: notification.title || "Raspay Admin",
            body: notification.body || "Nova notificação",
            icon: notification.icon || "/icon-192.png",
            badge: notification.badge || "/icon-192.png",
            image: notification.image,
            data: notification.data || {},
            tag: notification.tag || "admin-notification",
            actions: notification.actions || [],
            requireInteraction: true,
            silent: false,
          })

          await webpush.sendNotification(sub, payload)

          results.push({
            success: true,
            endpoint: sub.endpoint.substring(0, 50) + "...",
            message: "Enviado com sucesso",
          })
          successCount++

          console.log("✅ Notificação enviada com sucesso para:", sub.endpoint.substring(0, 50) + "...")
        } catch (error: any) {
          console.error("❌ Erro ao enviar notificação:", error)

          // Se a subscription é inválida, remover
          if (error.statusCode === 410 || error.statusCode === 404) {
            subscriptions.delete(subscriptionString)
            console.log("🗑️ Subscription inválida removida")
          }

          results.push({
            success: false,
            error: error.message,
            statusCode: error.statusCode,
            endpoint: subscriptionString.substring(0, 50) + "...",
          })
          errorCount++
        }
      }

      console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`)

      return NextResponse.json({
        success: successCount > 0,
        message: `Notificação enviada para ${successCount} de ${subscriptions.size} admins`,
        results,
        stats: {
          total: subscriptions.size,
          success: successCount,
          errors: errorCount,
        },
      })
    }

    // Listar subscriptions ativas
    if (type === "list") {
      const subscriptionList = Array.from(subscriptions).map((sub, index) => {
        try {
          const parsed = JSON.parse(sub)
          return {
            id: index + 1,
            endpoint: parsed.endpoint.substring(0, 50) + "...",
            keys: !!parsed.keys,
            auth: !!parsed.keys?.auth,
            p256dh: !!parsed.keys?.p256dh,
          }
        } catch (error) {
          return {
            id: index + 1,
            error: "Invalid subscription",
            raw: sub.substring(0, 50) + "...",
          }
        }
      })

      return NextResponse.json({
        success: true,
        total: subscriptions.size,
        subscriptions: subscriptionList,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Tipo de requisição inválido. Use 'register', 'send' ou 'list'",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("❌ Erro crítico na API de notificações:", error)
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
  console.log("📊 GET /api/admin/notifications/send")
  console.log("📊 VAPID Public Key exists:", !!vapidKeys.publicKey)
  console.log("📊 Total subscriptions:", subscriptions.size)

  return NextResponse.json({
    success: true,
    vapidPublicKey: vapidKeys.publicKey,
    totalSubscriptions: subscriptions.size,
    hasVapidKeys: !!(vapidKeys.publicKey && vapidKeys.privateKey),
    environment: process.env.NODE_ENV,
  })
}
