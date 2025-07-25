import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    console.log("📊 Buscando lista de afiliados...")

    const affiliates = await sql`
      SELECT 
        a.*,
        m.name as manager_name,
        m.username as manager_username,
        COUNT(DISTINCT u.id) as total_referrals
      FROM affiliates a
      LEFT JOIN managers m ON a.manager_id = m.id
      LEFT JOIN users u ON a.id = u.affiliate_id
      GROUP BY a.id, a.name, a.email, a.username, a.affiliate_code, a.password_hash, 
               a.commission_rate, a.loss_commission_rate, a.total_earnings, a.balance, 
               a.status, a.created_at, a.updated_at, a.manager_id, m.name, m.username
      ORDER BY a.created_at DESC
    `

    console.log(`✅ Encontrados ${affiliates.length} afiliados`)

    return NextResponse.json({
      success: true,
      affiliates: affiliates.map((affiliate) => ({
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        username: affiliate.username,
        affiliate_code: affiliate.affiliate_code,
        commission_rate: Number(affiliate.commission_rate),
        loss_commission_rate: Number(affiliate.loss_commission_rate),
        total_earnings: Number(affiliate.total_earnings),
        balance: Number(affiliate.balance),
        status: affiliate.status,
        created_at: affiliate.created_at,
        updated_at: affiliate.updated_at,
        manager_id: affiliate.manager_id,
        manager_name: affiliate.manager_name,
        manager_username: affiliate.manager_username,
        total_referrals: Number(affiliate.total_referrals),
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao buscar afiliados:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
