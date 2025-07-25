import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("💸 API: Buscando saques do gerente")

    // Verificar token JWT do cookie primeiro
    let token = request.cookies.get("manager-token")?.value

    // Se não encontrar no cookie, verificar no header Authorization
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("✅ Token encontrado no header Authorization")
      }
    } else {
      console.log("✅ Token encontrado nos cookies")
    }

    if (!token) {
      console.log("❌ Token não encontrado")
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    let payload
    try {
      const result = await jwtVerify(token, JWT_SECRET)
      payload = result.payload
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const managerId = payload.managerId as number
    console.log(`🔍 Buscando saques para gerente ID: ${managerId}`)

    // Buscar saques do gerente
    const withdraws = await sql`
      SELECT 
        id,
        amount,
        pix_key,
        pix_type,
        status,
        admin_notes,
        created_at,
        processed_at
      FROM manager_withdraws
      WHERE manager_id = ${managerId}
      ORDER BY created_at DESC
    `

    console.log(`✅ ${withdraws.length} saques encontrados`)

    return NextResponse.json({
      success: true,
      withdraws,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar saques:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
