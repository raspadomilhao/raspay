import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("💰 API: Buscando comissões do gerente")

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
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    console.log(`🔍 Buscando comissões para gerente ID: ${managerId}`)

    // Buscar comissões do gerente com a nova estrutura
    const commissions = await sql`
      SELECT 
        mc.id,
        mc.commission_amount as amount,
        mc.commission_type,
        mc.description,
        mc.created_at,
        a.name as affiliate_name,
        a.affiliate_code,
        u.name as user_name,
        u.email as user_email,
        CASE 
          WHEN mc.commission_amount > 0 THEN 'win'
          WHEN mc.commission_amount < 0 THEN 'loss'
          ELSE 'neutral'
        END as result_type
      FROM manager_commissions mc
      JOIN affiliates a ON mc.affiliate_id = a.id
      LEFT JOIN users u ON a.id = u.affiliate_id
      WHERE mc.manager_id = ${managerId}
      ORDER BY mc.created_at DESC
      LIMIT ${limit}
    `

    console.log(`✅ ${commissions.length} comissões encontradas`)

    return NextResponse.json({
      success: true,
      commissions: commissions,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar comissões:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
