import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { processAffiliateLossCommission } from "@/lib/database"
import {
  selectRandomPhysicalPrize,
  decrementPhysicalPrizeStock,
  createPhysicalPrizeWinner,
} from "@/lib/database-physical-prizes"

const sql = neon(process.env.DATABASE_URL!)
const GAME_PRICE = 1.0

async function getPhysicalPrizeChance(): Promise<number> {
  try {
    const [setting] = await sql`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'physical_prize_chance_raspe_esperanca'
    `

    if (setting) {
      const chance = Number.parseFloat(setting.setting_value)
      return isNaN(chance) ? 0.01 : chance // 1% padrão se inválido
    }

    return 0.01 // 1% padrão se não encontrado
  } catch (error) {
    console.error("Erro ao buscar chance de prêmios físicos:", error)
    return 0.01 // 1% padrão em caso de erro
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🎮 === JOGO RASPE DA ESPERANÇA ===")

    // 1. Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log(`👤 Usuário: ${auth.userId} (${auth.userType})`)

    // 2. Parse do body da requisição
    let gameResult
    try {
      const body = await request.json()
      gameResult = body.gameResult
      console.log("📦 Dados recebidos do frontend:", body)
    } catch (error) {
      console.error("❌ Erro ao fazer parse do JSON:", error)
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    if (!gameResult) {
      console.log("❌ gameResult não fornecido")
      return NextResponse.json({ error: "Resultado do jogo não fornecido" }, { status: 400 })
    }

    // 3. Buscar saldo atual
    const walletResult = await sql`
      SELECT balance FROM wallets WHERE user_id = ${auth.userId}
    `

    if (!walletResult || walletResult.length === 0) {
      console.log("❌ Carteira não encontrada")
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 })
    }

    const currentBalance = Number.parseFloat(walletResult[0].balance.toString())
    console.log(`💰 Saldo atual: R$ ${currentBalance.toFixed(2)}`)

    // 4. Verificar saldo suficiente
    if (currentBalance < GAME_PRICE) {
      console.log(`❌ Saldo insuficiente: R$ ${currentBalance.toFixed(2)} < R$ ${GAME_PRICE.toFixed(2)}`)
      return NextResponse.json(
        {
          error: "Saldo insuficiente",
          required: GAME_PRICE,
          current: currentBalance,
        },
        { status: 400 },
      )
    }

    // 5. Verificar se ganhou prêmio físico (chance especial)
    let wonPhysicalPrize = false
    let physicalPrize = null
    let physicalPrizeWinner = null

    const physicalPrizeChance = await getPhysicalPrizeChance()
    console.log(`🎁 Chance de prêmio físico: ${(physicalPrizeChance * 100).toFixed(2)}%`)

    if (Math.random() < physicalPrizeChance) {
      console.log("🎁 Verificando prêmios físicos disponíveis...")
      physicalPrize = await selectRandomPhysicalPrize()

      if (physicalPrize) {
        console.log(`🎁 Prêmio físico selecionado: ${physicalPrize.name}`)

        // Tentar decrementar estoque
        const stockDecremented = await decrementPhysicalPrizeStock(
          physicalPrize.id,
          `Ganho no jogo Raspe da Esperança pelo usuário ${auth.userId}`,
        )

        if (stockDecremented) {
          wonPhysicalPrize = true
          console.log(`✅ Estoque decrementado para prêmio: ${physicalPrize.name}`)
        } else {
          console.log(`❌ Falha ao decrementar estoque para prêmio: ${physicalPrize.name}`)
          physicalPrize = null
        }
      }
    }

    // 6. Determinar resultado final
    let hasWon = false
    let prizeAmount = 0

    if (wonPhysicalPrize) {
      // Se ganhou prêmio físico, considera como vitória (mas sem prêmio monetário)
      hasWon = true
      prizeAmount = 0
      console.log(`🎁 Ganhou prêmio físico: ${physicalPrize?.name}`)
    } else {
      // Usar resultado do frontend para prêmios monetários
      hasWon = gameResult.hasWon || false
      prizeAmount = hasWon ? Number.parseFloat(gameResult.prizeAmount) || 0 : 0

      if (hasWon) {
        console.log(`🏆 Frontend disse que ganhou: R$ ${prizeAmount.toFixed(2)}`)
      } else {
        console.log("💔 Frontend disse que não ganhou")
      }
    }

    // 7. Processar transações
    let gamePlayTransactionId: number
    try {
      // Debitar aposta
      const [gamePlayTransaction] = await sql`
        INSERT INTO transactions (user_id, type, amount, status, created_at, description)
        VALUES (${auth.userId}, 'game_play', ${-GAME_PRICE}, 'completed', NOW(), 'Raspe da Esperança')
        RETURNING id
      `
      gamePlayTransactionId = gamePlayTransaction.id
      console.log(`💸 Debitado: R$ ${GAME_PRICE.toFixed(2)} (Transaction ID: ${gamePlayTransactionId})`)

      // Calcular novo saldo após débito
      let newBalance = currentBalance - GAME_PRICE
      console.log(`💰 Saldo após débito: R$ ${newBalance.toFixed(2)}`)

      // Se ganhou prêmio monetário, creditar
      if (prizeAmount > 0) {
        await sql`
          INSERT INTO transactions (user_id, type, amount, status, created_at, description)
          VALUES (${auth.userId}, 'game_prize', ${prizeAmount}, 'completed', NOW(), 'Prêmio Raspe da Esperança')
        `
        console.log(`💰 Creditado: R$ ${prizeAmount.toFixed(2)}`)
        newBalance += prizeAmount
      }

      // Se ganhou prêmio físico, registrar ganhador
      if (wonPhysicalPrize && physicalPrize) {
        physicalPrizeWinner = await createPhysicalPrizeWinner({
          user_id: auth.userId,
          physical_prize_id: physicalPrize.id,
          transaction_id: gamePlayTransactionId,
          game_name: "Raspe da Esperança",
        })
        console.log(`🎁 Ganhador de prêmio físico registrado (ID: ${physicalPrizeWinner.id})`)
      }

      // Calcular resultado líquido
      const netResult = prizeAmount - GAME_PRICE
      console.log(`📊 Resultado líquido: R$ ${netResult.toFixed(2)} (${netResult >= 0 ? "LUCRO" : "PERDA"})`)

      // Atualizar carteira
      await sql`
        UPDATE wallets 
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE user_id = ${auth.userId}
      `

      console.log(`✅ Novo saldo: R$ ${newBalance.toFixed(2)}`)

      // 🤝 PROCESSAR COMISSÃO POR PERDA/GANHO DO AFILIADO
      try {
        console.log(`🤝 Processando comissão por perda/ganho...`)
        await processAffiliateLossCommission(auth.userId, gamePlayTransactionId, netResult)
      } catch (affiliateError) {
        console.error(`❌ Erro ao processar comissão por perda/ganho:`, affiliateError)
        // Não falhar o jogo por causa da comissão
      }

      // 8. Preparar mensagem baseada no resultado
      let message = ""
      if (wonPhysicalPrize && physicalPrize) {
        message = `🎁 PARABÉNS! Você ganhou um prêmio físico: ${physicalPrize.name}! Entraremos em contato para entrega.`
      } else if (prizeAmount === 0) {
        message = "Que pena! Você não ganhou nada desta vez."
      } else if (netResult < 0) {
        message = `Você ganhou R$ ${prizeAmount.toFixed(2)}, mas perdeu R$ ${Math.abs(netResult).toFixed(2)} no total.`
      } else if (netResult === 0) {
        message = `Você ganhou R$ ${prizeAmount.toFixed(2)} e empatou!`
      } else {
        message = `Parabéns! Você ganhou R$ ${prizeAmount.toFixed(2)} e lucrou R$ ${netResult.toFixed(2)}!`
      }

      // 9. Retornar resultado no formato esperado pelo frontend
      return NextResponse.json({
        success: true,
        gameResult: {
          hasWon: hasWon, // true para prêmios físicos e monetários
          prizeAmount: prizeAmount,
          wonPhysicalPrize: wonPhysicalPrize,
          physicalPrize: physicalPrize
            ? {
                id: physicalPrize.id,
                name: physicalPrize.name,
                description: physicalPrize.description,
                image_url: physicalPrize.image_url,
                estimated_value: physicalPrize.estimated_value,
              }
            : null,
          physicalPrizeWinnerId: physicalPrizeWinner?.id || null,
        },
        newBalance: newBalance,
        message: message,
        debug: {
          balanceBefore: currentBalance,
          gamePrice: GAME_PRICE,
          prize: prizeAmount,
          netResult: netResult,
          balanceAfter: newBalance,
          userType: auth.userType,
          transactionId: gamePlayTransactionId,
          wonPhysicalPrize: wonPhysicalPrize,
          physicalPrizeName: physicalPrize?.name || null,
        },
      })
    } catch (dbError) {
      console.error("❌ Erro nas transações do banco:", dbError)
      return NextResponse.json(
        {
          error: "Erro ao processar jogo no banco de dados",
          details: dbError instanceof Error ? dbError.message : "Erro desconhecido",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Erro geral na API:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
