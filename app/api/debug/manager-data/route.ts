import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const managerId = searchParams.get("managerId")

    console.log("🔍 Debug: Verificando dados do gerente", managerId)

    if (!managerId) {
      return NextResponse.json({ error: "managerId é obrigatório" }, { status: 400 })
    }

    // Verificar se o gerente existe
    const [manager] = await sql`
      SELECT id, name, username, status, balance, total_earnings
      FROM managers 
      WHERE id = ${managerId}
    `

    console.log("👤 Gerente encontrado:", manager)

    // Verificar afiliados vinculados ao gerente
    const affiliates = await sql`
      SELECT id, name, email, affiliate_code, manager_id, status
      FROM affiliates 
      WHERE manager_id = ${managerId}
    `

    console.log("👥 Afiliados vinculados:", affiliates)

    // Verificar todos os afiliados e seus gerentes
    const allAffiliates = await sql`
      SELECT id, name, affiliate_code, manager_id
      FROM affiliates 
      ORDER BY id
    `

    console.log("🌐 Todos os afiliados:", allAffiliates)

    // Verificar todos os gerentes
    const allManagers = await sql`
      SELECT id, name, username, status
      FROM managers 
      ORDER BY id
    `

    console.log("👔 Todos os gerentes:", allManagers)

    return NextResponse.json({
      success: true,
      debug: {
        manager,
        affiliates_linked_to_manager: affiliates,
        all_affiliates: allAffiliates,
        all_managers: allManagers,
      },
    })
  } catch (error) {
    console.error("❌ Erro no debug:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
