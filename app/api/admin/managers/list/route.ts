import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    console.log("📊 Buscando lista de gerentes...")

    const managers = await sql`
      SELECT 
        m.*,
        COUNT(DISTINCT a.id) as total_affiliates,
        COUNT(DISTINCT u.id) as total_referrals_managed,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposit_volume
      FROM managers m
      LEFT JOIN affiliates a ON m.id = a.manager_id
      LEFT JOIN users u ON a.id = u.affiliate_id
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY m.id, m.name, m.email, m.username, m.password_hash, m.commission_rate, 
               m.status, m.total_earnings, m.balance, m.created_at, m.updated_at
      ORDER BY m.created_at DESC
    `

    console.log(`✅ Encontrados ${managers.length} gerentes`)

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
