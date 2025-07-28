import { type NextRequest, NextResponse } from "next/server"
import { updatePhysicalPrizeWinner, getPhysicalPrizeWinnerById } from "@/lib/database-physical-prizes"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const winnerId = Number.parseInt(params.id)
    console.log(`📝 Atualizando ganhador ID: ${winnerId}`)

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    // Verificar se o ganhador existe
    const existingWinner = await getPhysicalPrizeWinnerById(winnerId)
    if (!existingWinner) {
      return NextResponse.json({ error: "Ganhador não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const {
      winner_name,
      winner_phone,
      winner_email,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_zipcode,
      delivery_notes,
      status,
      admin_notes,
      tracking_code,
    } = body

    // Preparar dados de atualização
    const updateData: any = {
      winner_name,
      winner_phone,
      winner_email,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_zipcode,
      delivery_notes,
      status,
      admin_notes,
      tracking_code,
    }

    // Adicionar timestamps baseado no status
    if (status === "contacted" && existingWinner.status !== "contacted") {
      updateData.contacted_at = new Date().toISOString()
    }
    if (status === "shipped" && existingWinner.status !== "shipped") {
      updateData.shipped_at = new Date().toISOString()
    }
    if (status === "delivered" && existingWinner.status !== "delivered") {
      updateData.delivered_at = new Date().toISOString()
    }

    // Atualizar ganhador
    const updatedWinner = await updatePhysicalPrizeWinner(winnerId, updateData)

    console.log(`✅ Ganhador atualizado: ${updatedWinner.winner_name || "N/A"}`)

    return NextResponse.json({
      success: true,
      message: "Dados do ganhador atualizados com sucesso!",
      winner: updatedWinner,
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar ganhador:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
