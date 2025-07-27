import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const auth = await verifyAuth(request)
    if (!auth || auth.userType !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { gameName, adjustment, reason } = await request.json()

    if (!gameName || typeof adjustment !== "number") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Buscar cofre atual
    const [currentCofre] = await sql`
      SELECT * FROM game_cofres WHERE game_name = ${gameName}
    `

    if (!currentCofre) {
      return NextResponse.json({ error: "Cofre não encontrado" }, { status: 404 })
    }

    const currentBalance = Number.parseFloat(currentCofre.balance.toString())
    const newBalance = currentBalance + adjustment

    // Atualizar saldo do cofre
    await sql`
      UPDATE game_cofres 
      SET balance = ${newBalance},
          updated_at = NOW()
      WHERE game_name = ${gameName}
    `

    // Registrar o ajuste (opcional - pode criar uma tabela de logs)
    console.log(`Ajuste manual do cofre ${gameName}: ${adjustment} (${reason || "Sem motivo especificado"})`)

    return NextResponse.json({
      success: true,
      message: `Cofre ajustado com sucesso`,
      previousBalance: currentBalance,
      newBalance,
      adjustment,
    })
  } catch (error) {
    console.error("Erro ao ajustar cofre:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
