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

    console.log("🔧 === FORÇAR ATUALIZAÇÃO DO COFRE ===")

    // Adicionar saldo de teste ao cofre do Raspe da Esperança
    const testAmount = 500.0 // R$ 500 de teste

    await sql`
      UPDATE game_cofres 
      SET balance = balance + ${testAmount},
          total_contributed = total_contributed + ${testAmount},
          game_count = game_count + 10,
          updated_at = NOW()
      WHERE game_name = 'raspe-da-esperanca'
    `

    console.log(`✅ Adicionado R$ ${testAmount} ao cofre para teste`)

    // Buscar status atualizado
    const [cofre] = await sql`
      SELECT * FROM game_cofres WHERE game_name = 'raspe-da-esperanca'
    `

    return NextResponse.json({
      success: true,
      message: `Cofre atualizado com R$ ${testAmount} para teste`,
      cofre: cofre,
    })
  } catch (error) {
    console.error("❌ Erro ao forçar atualização do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar cofre",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
