import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("👥 API: Buscando afiliados do gerente")

    // Verificar token JWT
    let token = request.cookies.get("manager-token")?.value

    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    let payload
    try {
      const result = await jwtVerify(token, JWT_SECRET)
      payload = result.payload
    } catch (error) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    if (payload.type !== "manager") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const managerId = payload.managerId as number
    console.log(`🔍 Buscando afiliados para gerente ID: ${managerId}`)

    // Buscar afiliados do gerente com estatísticas atualizadas
    const affiliates = await sql`
      SELECT 
        a.id,
        a.name,
        a.email,
        a.username,
        a.affiliate_code,
        a.commission_rate,
        a.total_earnings,
        a.status,
        a.created_at,
        COUNT(DISTINCT u.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END) as active_referrals,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposit_volume,
        COALESCE(SUM(mc.commission_amount), 0) as manager_commissions_generated
      FROM affiliates a
      LEFT JOIN users u ON u.affiliate_id = a.id
      LEFT JOIN transactions t ON u.id = t.user_id
      LEFT JOIN manager_commissions mc ON mc.affiliate_id = a.id AND mc.manager_id = ${managerId}
      WHERE a.manager_id = ${managerId}
      GROUP BY a.id, a.name, a.email, a.username, a.affiliate_code, a.commission_rate, a.total_earnings, a.status, a.created_at
      ORDER BY a.created_at DESC
    `

    console.log(`✅ ${affiliates.length} afiliados encontrados`)

    return NextResponse.json({
      success: true,
      affiliates: affiliates,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar afiliados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
