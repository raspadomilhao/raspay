import { type NextRequest, NextResponse } from "next/server"
import { activeConnections } from "../stream/route"

interface NotificationPayload {
  type: "withdraw" | "deposit"
  title: string
  body: string
  data?: any
  tag?: string
  requireInteraction?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json()

    console.log("📨 Enviando notificação:", payload)

    // Validar payload
    if (!payload.type || !payload.title || !payload.body) {
      return NextResponse.json({ error: "Campos obrigatórios: type, title, body" }, { status: 400 })
    }

    // Enviar para todas as conexões ativas
    const message = JSON.stringify({
      type: "NOTIFICATION",
      payload: {
        ...payload,
        timestamp: Date.now(),
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    })

    let sentCount = 0
    const connectionsToRemove = new Set()

    for (const connection of activeConnections) {
      try {
        await connection.send(message)
        sentCount++
      } catch (error) {
        console.error("Erro ao enviar para conexão:", error)
        connectionsToRemove.add(connection)
      }
    }

    // Remove failed connections
    for (const connection of connectionsToRemove) {
      activeConnections.delete(connection)
    }

    console.log(`✅ Notificação enviada para ${sentCount} conexões ativas`)

    return NextResponse.json({
      success: true,
      message: `Notificação enviada para ${sentCount} conexões`,
      payload,
      activeConnections: activeConnections.size,
    })
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função helper para enviar notificações
export async function sendNotification(payload: NotificationPayload) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/notifications/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    if (response.ok) {
      console.log("✅ Notificação enviada via API")
      return true
    } else {
      console.error("❌ Erro ao enviar notificação via API:", response.status)
      return false
    }
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error)
    return false
  }
}
