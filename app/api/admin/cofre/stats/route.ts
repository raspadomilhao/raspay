import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getAllCofres, getCofrePrizeHistory, getCofreStatistics } from "@/lib/cofre-system"

export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const auth = await verifyAuth(request)
    if (!auth || auth.userType !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const gameName = searchParams.get("game")

    if (gameName) {
      // Estatísticas de um jogo específico
      const stats = await getCofreStatistics(gameName)
      const history = await getCofrePrizeHistory(gameName, 20)

      if (!stats) {
        return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        game: gameName,
        stats,
        recentPrizes: history,
      })
    } else {
      // Estatísticas de todos os jogos
      const allCofres = await getAllCofres()

      const detailedStats = await Promise.all(
        allCofres.map(async (cofre) => {
          const stats = await getCofreStatistics(cofre.game_name)
          const recentPrizes = await getCofrePrizeHistory(cofre.game_name, 5)
          return {
            gameName: cofre.game_name,
            stats,
            recentPrizes,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        cofres: detailedStats,
      })
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
