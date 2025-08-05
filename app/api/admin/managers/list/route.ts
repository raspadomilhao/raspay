import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verificando acesso à lista de gerentes...")

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    console.log("🔑 Token recebido:", adminToken ? "Presente" : "Ausente")

    if (!adminToken) {
      console.log("❌ Token de admin não fornecido")
      return NextResponse.json({ error: "Token de admin requerido" }, { status: 401 })
    }

    // Verificar se o token é válido
    const validTokens = ["admin-authenticated", "admin-full-access", "admin-managers-only"]
    if (!validTokens.includes(adminToken)) {
      console.log("❌ Token de admin inválido:", adminToken)
      return NextResponse.json({ error: "Token de admin inválido" }, { status: 401 })
    }

    console.log("✅ Token de admin válido, buscando gerentes...")

    const managers = await sql`
      SELECT 
        m.*,
        COALESCE(
          (SELECT COUNT(*) FROM affiliates WHERE manager_id = m.id),
          0
        ) as total_affiliates,
        COALESCE(
          (SELECT COUNT(*) FROM users u 
           JOIN affiliates a ON u.referred_by = a.affiliate_code 
           WHERE a.manager_id = m.id),
          0
        ) as total_referrals_managed,
        COALESCE(
          (SELECT SUM(t.amount) FROM transactions t
           JOIN users u ON t.user_id = u.id
           JOIN affiliates a ON u.referred_by = a.affiliate_code
           WHERE a.manager_id = m.id AND t.type = 'deposit' AND t.status = 'success'),
          0
        ) as total_deposit_volume
      FROM managers m
      ORDER BY m.created_at DESC
    `

    console.log("📊 Gerentes encontrados:", managers.length)

    return NextResponse.json({
      success: true,
      managers: managers.map((manager) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        username: manager.username,
        commission_rate: Number(manager.commission_rate),
        total_earnings: Number(manager.total_earnings),
        balance: Number(manager.balance),
        status: manager.status,
        created_at: manager.created_at,
        updated_at: manager.updated_at,
        total_affiliates: Number(manager.total_affiliates),
        total_referrals_managed: Number(manager.total_referrals_managed),
        total_deposit_volume: Number(manager.total_deposit_volume),
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao buscar gerentes:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
