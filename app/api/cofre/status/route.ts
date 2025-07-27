import { type NextRequest, NextResponse } from "next/server"
import { getCofreStatistics } from "@/lib/cofre-system"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameName = searchParams.get("game") || "raspe-da-esperanca"

    const stats = await getCofreStatistics(gameName)

    if (!stats) {
      return NextResponse.json({ error: "Cofre não encontrado" }, { status: 404 })
    }

    // Retornar apenas informações públicas
    return NextResponse.json({
      success: true,
      game: gameName,
      balance: stats.balance,
      availableForPrizes: stats.availableForPrizes,
      prizeChance: stats.prizeChance,
      nextPrizeValues: stats.nextPrizeValues,
      gameCount: stats.gameCount,
    })
  } catch (error) {
    console.error("Erro ao buscar status do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
