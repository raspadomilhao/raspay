import { type NextRequest, NextResponse } from "next/server"
import { addPhysicalPrizeStock, getPhysicalPrizeById } from "@/lib/database-physical-prizes"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prizeId = Number.parseInt(params.id)
    console.log(`📦 Adicionando estoque ao prêmio ID: ${prizeId}`)

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    // Verificar se o prêmio existe
    const existingPrize = await getPhysicalPrizeById(prizeId)
    if (!existingPrize) {
      return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { quantity, reason, admin_user } = body

    // Validações
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        {
          error: "Quantidade deve ser maior que zero",
        },
        { status: 400 },
      )
    }

    // Adicionar estoque
    const success = await addPhysicalPrizeStock(
      prizeId,
      Number(quantity),
      reason || "Reposição manual",
      admin_user || "admin",
    )

    if (!success) {
      return NextResponse.json(
        {
          error: "Falha ao adicionar estoque",
        },
        { status: 500 },
      )
    }

    console.log(`✅ Estoque adicionado: +${quantity} unidades`)

    return NextResponse.json({
      success: true,
      message: `${quantity} unidades adicionadas ao estoque com sucesso!`,
    })
  } catch (error) {
    console.error("❌ Erro ao adicionar estoque:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
