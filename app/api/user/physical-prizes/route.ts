import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getUserPhysicalPrizeWinners } from "@/lib/database-physical-prizes"

export async function GET(request: NextRequest) {
  try {
    console.log("🎁 Buscando prêmios físicos do usuário...")

    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar prêmios físicos do usuário
    const prizes = await getUserPhysicalPrizeWinners(auth.userId)

    console.log(`✅ ${prizes.length} prêmios físicos encontrados para usuário ${auth.userId}`)

    return NextResponse.json({
      success: true,
      prizes,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar prêmios físicos do usuário:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
