import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("🏆 Carregando ranking de afiliados...")

    // Verificar token no header Authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token não encontrado no header")
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Verificar e decodificar token
    let payload: any
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secret)
      payload = jwtPayload
      console.log("✅ Token válido para afiliado:", payload.affiliateId)
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    const currentAffiliateId = Number(payload.affiliateId)

    // Buscar ranking dos top 5 afiliados por total_earnings
    const ranking = await sql`
      SELECT 
        id,
        name,
        username,
        total_earnings,
        total_referrals,
        ROW_NUMBER() OVER (ORDER BY total_earnings DESC) as position
      FROM affiliates 
      WHERE status = 'active' AND total_earnings > 0
      ORDER BY total_earnings DESC
      LIMIT 5
    `

    console.log(`🏆 Ranking encontrado: ${ranking.length} afiliados`)

    // Encontrar a posição do afiliado atual se não estiver no top 5
    let currentAffiliatePosition = null
    const currentInTop5 = ranking.find((a) => a.id === currentAffiliateId)

    if (!currentInTop5) {
      const [currentPosition] = await sql`
        SELECT 
          position
        FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY total_earnings DESC) as position
          FROM affiliates 
          WHERE status = 'active' AND total_earnings > 0
        ) ranked
        WHERE id = ${currentAffiliateId}
      `

      if (currentPosition) {
        currentAffiliatePosition = Number(currentPosition.position)
      }
    }

    const response = {
      success: true,
      ranking: ranking.map((affiliate, index) => ({
        position: index + 1,
        name: affiliate.name,
        username: affiliate.username,
        is_current_user: affiliate.id === currentAffiliateId,
      })),
      current_affiliate_position: currentInTop5 ? currentInTop5.position : currentAffiliatePosition,
    }

    console.log("✅ Ranking preparado com sucesso")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Erro na API de ranking:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
