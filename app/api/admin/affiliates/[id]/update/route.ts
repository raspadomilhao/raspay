import { type NextRequest, NextResponse } from "next/server"
import { updateAffiliate } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const affiliateId = Number.parseInt(params.id)
    if (isNaN(affiliateId)) {
      return NextResponse.json({ error: "ID de afiliado inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, username, commission_rate, loss_commission_rate, status, password } = body

    // Validações
    if (commission_rate !== undefined && (commission_rate < 0 || commission_rate > 100)) {
      return NextResponse.json({ error: "Taxa de comissão deve estar entre 0% e 100%" }, { status: 400 })
    }

    if (loss_commission_rate !== undefined && (loss_commission_rate < -100 || loss_commission_rate > 100)) {
      return NextResponse.json({ error: "Taxa de comissão por perda deve estar entre -100% e 100%" }, { status: 400 })
    }

    let passwordHash: string | undefined = undefined
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
      }
      passwordHash = await bcrypt.hash(password, 10)
    }

    const updatedAffiliate = await updateAffiliate(affiliateId, {
      name,
      email,
      username,
      commission_rate,
      loss_commission_rate,
      status,
      password_hash: passwordHash,
    })

    return NextResponse.json({
      success: true,
      affiliate: updatedAffiliate,
    })
  } catch (error) {
    console.error("Erro ao atualizar afiliado:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
