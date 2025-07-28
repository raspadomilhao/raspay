import { type NextRequest, NextResponse } from "next/server"
import { updatePhysicalPrize, getPhysicalPrizeById } from "@/lib/database-physical-prizes"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const prizeId = Number.parseInt(params.id)
    console.log(`📝 Atualizando prêmio físico ID: ${prizeId}`)

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
    const { name, description, image_url, estimated_value, min_stock_alert, rarity_weight, is_active } = body

    // Validações
    if (estimated_value !== undefined && estimated_value <= 0) {
      return NextResponse.json(
        {
          error: "Valor estimado deve ser maior que zero",
        },
        { status: 400 },
      )
    }

    // Atualizar prêmio
    const updatedPrize = await updatePhysicalPrize(prizeId, {
      name,
      description,
      image_url,
      estimated_value: estimated_value ? Number(estimated_value) : undefined,
      min_stock_alert: min_stock_alert ? Number(min_stock_alert) : undefined,
      rarity_weight: rarity_weight ? Number(rarity_weight) : undefined,
      is_active,
    })

    console.log(`✅ Prêmio físico atualizado: ${updatedPrize.name}`)

    return NextResponse.json({
      success: true,
      message: "Prêmio físico atualizado com sucesso!",
      prize: updatedPrize,
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar prêmio físico:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
