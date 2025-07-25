import { type NextRequest, NextResponse } from "next/server"
import { getAffiliateById, getAffiliateStats, getAffiliateCommissions } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const affiliateId = Number.parseInt(params.id)

    // Verificar se afiliado existe
    const affiliate = await getAffiliateById(affiliateId)
    if (!affiliate) {
      return NextResponse.json({ success: false, error: "Afiliado não encontrado" }, { status: 404 })
    }

    // Buscar estatísticas e comissões
    const stats = await getAffiliateStats(affiliateId)
    const commissions = await getAffiliateCommissions(affiliateId, 100)

    return NextResponse.json({
      success: true,
      affiliate,
      stats,
      commissions,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas do afiliado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
