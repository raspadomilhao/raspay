import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    console.log("📝 Registrando nova subscription:", {
      endpoint: subscription.endpoint?.substring(0, 50) + "...",
      hasKeys: !!(subscription.keys?.p256dh && subscription.keys?.auth),
    })

    // Verificar se já existe uma subscription com o mesmo endpoint
    const [existing] = await sql`
      SELECT id FROM admin_push_subscriptions 
      WHERE endpoint = ${subscription.endpoint}
    `

    if (existing) {
      // Atualizar subscription existente
      await sql`
        UPDATE admin_push_subscriptions 
        SET p256dh = ${subscription.keys.p256dh},
            auth = ${subscription.keys.auth},
            active = true,
            updated_at = NOW()
        WHERE endpoint = ${subscription.endpoint}
      `
      console.log("✅ Subscription existente atualizada")
    } else {
      // Criar nova subscription
      await sql`
        INSERT INTO admin_push_subscriptions (endpoint, p256dh, auth, user_agent, active)
        VALUES (
          ${subscription.endpoint},
          ${subscription.keys.p256dh},
          ${subscription.keys.auth},
          ${request.headers.get("user-agent") || "Unknown"},
          true
        )
      `
      console.log("✅ Nova subscription criada")
    }

    // Contar total de subscriptions ativas
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM admin_push_subscriptions WHERE active = true
    `

    return NextResponse.json({
      success: true,
      message: "Subscription registrada com sucesso",
      total: Number(count),
    })
  } catch (error) {
    console.error("❌ Erro ao registrar subscription:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao registrar subscription",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
