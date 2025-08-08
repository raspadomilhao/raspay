import { type NextRequest, NextResponse } from "next/server"
import { getCachedWinners } from "@/lib/database-optimized"

export async function GET(request: NextRequest) {
  try {
    const winners = await getCachedWinners()

    // Combinar vencedores reais e bots
    const allWinners = [...winners.real, ...winners.bots]

    // Embaralhar e ordenar por data mais recente, limitando a 30
    const sortedWinners = allWinners
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)

    return NextResponse.json({
      success: true,
      winners: sortedWinners,
      total: sortedWinners.length,
      real_winners: winners.real.length,
      bot_winners: winners.bots.length,
      physical_prizes: sortedWinners.filter((w) => w.is_physical_prize).length,
      monetary_prizes: sortedWinners.filter((w) => !w.is_physical_prize).length,
      cached_at: winners.generated_at,
    })
  } catch (error) {
    console.error("Erro ao buscar vencedores:", error)

    // Em caso de erro, retornar dados mínimos
    return NextResponse.json(
      {
        success: false,
        winners: [],
        total: 0,
        real_winners: 0,
        bot_winners: 0,
        physical_prizes: 0,
        monetary_prizes: 0,
        error: "Erro ao carregar vencedores",
      },
      { status: 500 },
    )
  }
}
