import { type NextRequest, NextResponse } from "next/server"
import { createPhysicalPrize } from "@/lib/database-physical-prizes"

export async function POST(request: NextRequest) {
  try {
    console.log("🎁 Criando novo prêmio físico...")

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, image_url, estimated_value, stock_quantity, min_stock_alert, rarity_weight } = body

    // Validações
    if (!name || !estimated_value || stock_quantity === undefined) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: name, estimated_value, stock_quantity",
        },
        { status: 400 },
      )
    }

    if (estimated_value <= 0) {
      return NextResponse.json(
        {
          error: "Valor estimado deve ser maior que zero",
        },
        { status: 400 },
      )
    }

    if (stock_quantity < 0) {
      return NextResponse.json(
        {
          error: "Quantidade em estoque não pode ser negativa",
        },
        { status: 400 },
      )
    }

    // Criar prêmio
    const prize = await createPhysicalPrize({
      name,
      description,
      image_url,
      estimated_value: Number(estimated_value),
      stock_quantity: Number(stock_quantity),
      min_stock_alert: min_stock_alert ? Number(min_stock_alert) : 5,
      rarity_weight: rarity_weight ? Number(rarity_weight) : 5.0,
    })

    console.log(`✅ Prêmio físico criado: ${prize.name} (ID: ${prize.id})`)

    return NextResponse.json({
      success: true,
      message: "Prêmio físico criado com sucesso!",
      prize,
    })
  } catch (error) {
    console.error("❌ Erro ao criar prêmio físico:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
