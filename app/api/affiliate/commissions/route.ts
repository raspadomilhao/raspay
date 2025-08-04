import { type NextRequest, NextResponse } from "next/server"
import { getAffiliateCommissions } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function GET(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get("affiliate-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Token n����o encontrado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const affiliateId = payload.affiliateId as number

    // Buscar comissões
    const commissions = await getAffiliateCommissions(affiliateId, 100)

    return NextResponse.json({
      success: true,
      commissions,
    })
  } catch (error) {
    console.error("Erro ao buscar comissões:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
