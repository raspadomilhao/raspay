import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { updatePhysicalPrizeWinner, getPhysicalPrizeWinnerById } from "@/lib/database-physical-prizes"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const winnerId = Number.parseInt(params.id)
    console.log(`📝 Atualizando dados de entrega para ganhador ID: ${winnerId}`)

    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o ganhador existe e pertence ao usuário
    const existingWinner = await getPhysicalPrizeWinnerById(winnerId)
    if (!existingWinner) {
      return NextResponse.json({ error: "Prêmio não encontrado" }, { status: 404 })
    }

    if (existingWinner.user_id !== auth.userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
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
    } = body

    // Validações básicas
    if (!winner_name || !winner_phone || !delivery_address || !delivery_city || !delivery_state) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: nome, telefone, endereço, cidade, estado",
        },
        { status: 400 },
      )
    }

    // Atualizar dados de entrega
    const updatedWinner = await updatePhysicalPrizeWinner(winnerId, {
      winner_name,
      winner_phone,
      winner_email,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_zipcode,
      delivery_notes,
      status: "address_collected", // Atualizar status para "dados coletados"
    })

    console.log(`✅ Dados de entrega atualizados para ganhador: ${updatedWinner.winner_name}`)

    return NextResponse.json({
      success: true,
      message: "Dados de entrega salvos com sucesso! Entraremos em contato em breve.",
      winner: updatedWinner,
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar dados de entrega:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
