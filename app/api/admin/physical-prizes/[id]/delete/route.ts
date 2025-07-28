import { type NextRequest, NextResponse } from "next/server"
import { deletePhysicalPrize } from "@/lib/database-physical-prizes"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    const prizeId = Number.parseInt(params.id)
    if (isNaN(prizeId)) {
      return NextResponse.json({ error: "ID do prêmio inválido" }, { status: 400 })
    }

    const result = await deletePhysicalPrize(prizeId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao excluir prêmio físico:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
