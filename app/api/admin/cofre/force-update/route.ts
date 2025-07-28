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

    const { action, gameName, amount } = await request.json()

    console.log(`🔧 Ação administrativa no cofre: ${action}`)

    switch (action) {
      case "reset":
        // Resetar todos os cofres
        await sql`
          UPDATE game_cofres 
          SET balance = 0.00, 
              total_contributed = 0.00, 
              total_distributed = 0.00, 
              game_count = 0,
              last_distribution = NULL,
              updated_at = NOW()
        `

        // Limpar histórico de prêmios
        await sql`DELETE FROM cofre_prizes`

        return NextResponse.json({
          success: true,
          message: "Todos os cofres foram resetados com sucesso!",
        })

      case "add_balance":
        if (!gameName || !amount) {
          return NextResponse.json({ error: "Nome do jogo e valor são obrigatórios" }, { status: 400 })
        }

        await sql`
          UPDATE game_cofres 
          SET balance = balance + ${amount},
              total_contributed = total_contributed + ${Math.max(0, amount)},
              updated_at = NOW()
          WHERE game_name = ${gameName}
        `

        return NextResponse.json({
          success: true,
          message: `R$ ${amount.toFixed(2)} adicionado ao cofre ${gameName}`,
        })

      case "force_prize":
        if (!gameName || !amount) {
          return NextResponse.json({ error: "Nome do jogo e valor são obrigatórios" }, { status: 400 })
        }

        // Simular um prêmio forçado
        const [cofre] = await sql`SELECT * FROM game_cofres WHERE game_name = ${gameName}`

        if (!cofre) {
          return NextResponse.json({ error: "Cofre não encontrado" }, { status: 404 })
        }

        const cofreBalance = Number.parseFloat(cofre.balance.toString())
        const newBalance = cofreBalance - amount

        await sql`
          UPDATE game_cofres 
          SET balance = ${newBalance},
              total_distributed = total_distributed + ${amount},
              last_distribution = NOW(),
              updated_at = NOW()
          WHERE game_name = ${gameName}
        `

        // Registrar prêmio administrativo
        await sql`
          INSERT INTO cofre_prizes (
            game_name, user_id, prize_amount, 
            cofre_balance_before, cofre_balance_after, game_count_trigger
          )
          VALUES (
            ${gameName}, 1, ${amount},
            ${cofreBalance}, ${newBalance}, ${cofre.game_count}
          )
        `

        return NextResponse.json({
          success: true,
          message: `Prêmio de R$ ${amount.toFixed(2)} forçado no cofre ${gameName}`,
        })

      default:
        return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro na ação administrativa do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
