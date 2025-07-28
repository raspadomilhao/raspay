import { type NextRequest, NextResponse } from "next/server"
import { getAllPhysicalPrizeWinners } from "@/lib/database-physical-prizes"

export async function GET(request: NextRequest) {
  try {
    console.log("🏆 Listando ganhadores de prêmios físicos...")

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    // Buscar ganhadores
    const winners = await getAllPhysicalPrizeWinners()

    console.log(`✅ ${winners.length} ganhadores encontrados`)

    return NextResponse.json({
      success: true,
      winners,
    })
  } catch (error) {
    console.error("❌ Erro ao listar ganhadores:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
