import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("🔍 Buscando saques de afiliados pendentes...")

    const withdraws = await sql`
      SELECT 
        aw.*,
        a.name as affiliate_name,
        a.email as affiliate_email,
        a.username as affiliate_username,
        a.affiliate_code
      FROM affiliate_withdraws aw
      JOIN affiliates a ON aw.affiliate_id = a.id
      ORDER BY aw.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({
      success: true,
      withdraws,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar saques de afiliados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
