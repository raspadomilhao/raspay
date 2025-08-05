import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verificando acesso à lista de afiliados...")

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

    console.log("✅ Token de admin válido, buscando afiliados...")

    const affiliates = await sql`
      SELECT 
        a.*,
        m.name as manager_name,
        COALESCE(
          (SELECT COUNT(*) FROM users WHERE referred_by = a.affiliate_code),
          0
        ) as total_referrals,
        COALESCE(
          (SELECT COUNT(*) FROM transactions t 
           JOIN users u ON t.user_id = u.id 
           WHERE u.referred_by = a.affiliate_code AND t.type = 'deposit' AND t.status = 'success'),
          0
        ) as deposits_count
      FROM affiliates a
      LEFT JOIN managers m ON a.manager_id = m.id
      ORDER BY a.created_at DESC
    `

    console.log("📊 Afiliados encontrados:", affiliates.length)

    return NextResponse.json({
      success: true,
      affiliates,
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
