import { type NextRequest, NextResponse } from "next/server"
import { getAllPhysicalPrizes, getPhysicalPrizesStats } from "@/lib/database-physical-prizes"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Listando prêmios físicos...")

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    // Buscar prêmios e estatísticas
    const [prizes, stats] = await Promise.all([getAllPhysicalPrizes(), getPhysicalPrizesStats()])

    console.log(`✅ ${prizes.length} prêmios físicos encontrados`)

    return NextResponse.json({
      success: true,
      prizes,
      stats,
    })
  } catch (error) {
    console.error("❌ Erro ao listar prêmios físicos:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
