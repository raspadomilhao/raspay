import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { processAffiliateLossCommission } from "@/lib/database"
import { contributeToCofreSystem, distributeCofrePrize } from "@/lib/cofre-system"

const sql = neon(process.env.DATABASE_URL!)
const GAME_PRICE = 1.0
const GAME_NAME = "raspe-da-esperanca"

export async function POST(request: NextRequest) {
  try {
    console.log("🎮 === JOGO RASPE DA ESPERANÇA COM COFRE ===")

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

    // 5. Usar o resultado do frontend (hasWon e prizeAmount)
    const hasWon = gameResult.hasWon || false
    let prizeAmount = 0

    if (hasWon) {
      // Usar o valor do prêmio calculado pelo frontend
      prizeAmount = Number.parseFloat(gameResult.prizeAmount) || 0
      console.log(`🏆 Frontend disse que ganhou: R$ ${prizeAmount.toFixed(2)}`)
    } else {
      console.log("💔 Frontend disse que não ganhou")
    }

    // 6. Processar transações
    let gamePlayTransactionId: number
    try {
      // Debitar aposta
      const [gamePlayTransaction] = await sql`
        INSERT INTO transactions (user_id, type, amount, status, created_at)
        VALUES (${auth.userId}, 'game_play', ${-GAME_PRICE}, 'completed', NOW())
        RETURNING id
      `
      gamePlayTransactionId = gamePlayTransaction.id
      console.log(`💸 Debitado: R$ ${GAME_PRICE.toFixed(2)} (Transaction ID: ${gamePlayTransactionId})`)

      // Calcular novo saldo após débito
      let newBalance = currentBalance - GAME_PRICE
      console.log(`💰 Saldo após débito: R$ ${newBalance.toFixed(2)}`)

      // Se ganhou prêmio, creditar
      if (prizeAmount > 0) {
        await sql`
          INSERT INTO transactions (user_id, type, amount, status, created_at)
          VALUES (${auth.userId}, 'game_prize', ${prizeAmount}, 'completed', NOW())
        `
        console.log(`💰 Creditado: R$ ${prizeAmount.toFixed(2)}`)
        newBalance += prizeAmount
      }

      // Calcular resultado líquido
      const netResult = prizeAmount - GAME_PRICE
      console.log(`📊 Resultado líquido: R$ ${netResult.toFixed(2)} (${netResult >= 0 ? "LUCRO" : "PERDA"})`)

      // 🏦 SISTEMA DE COFRE: Contribuir com o valor líquido e verificar sorteio
      const cofreResult = await contributeToCofreSystem(GAME_NAME, netResult, auth.userId, auth.userType)
      console.log(
        `🏦 Cofre - Deve verificar prêmio: ${cofreResult.shouldCheckPrize}, Jogadas: ${cofreResult.gameCount}`,
      )

      // Verificar se ganhou prêmio do cofre (apenas usuários regulares)
      let cofrePrize = null
      if (cofreResult.shouldCheckPrize && auth.userType === "regular") {
        cofrePrize = await distributeCofrePrize(GAME_NAME, auth.userId, auth.userType)

        if (cofrePrize?.won && cofrePrize.prize > 0) {
          console.log(`🎰 PRÊMIO DO COFRE: R$ ${cofrePrize.prize.toFixed(2)}`)

          // Creditar prêmio do cofre
          await sql`
            INSERT INTO transactions (user_id, type, amount, status, created_at, description)
            VALUES (${auth.userId}, 'game_prize', ${cofrePrize.prize}, 'completed', NOW(), 'Prêmio do Cofre - Raspe da Esperança')
          `

          newBalance += cofrePrize.prize
          console.log(`💰 Saldo após prêmio do cofre: R$ ${newBalance.toFixed(2)}`)
        }
      }

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

      // 7. Preparar mensagem baseada no resultado
      let message = ""
      const totalPrize = prizeAmount + (cofrePrize?.prize || 0)
      const finalNetResult = totalPrize - GAME_PRICE

      if (totalPrize === 0) {
        message = "Que pena! Você não ganhou nada desta vez."
      } else if (finalNetResult < 0) {
        message = `Você ganhou R$ ${totalPrize.toFixed(2)}, mas perdeu R$ ${Math.abs(finalNetResult).toFixed(2)} no total.`
      } else if (finalNetResult === 0) {
        message = `Você ganhou R$ ${totalPrize.toFixed(2)} e empatou!`
      } else {
        message = `Parabéns! Você ganhou R$ ${totalPrize.toFixed(2)} e lucrou R$ ${finalNetResult.toFixed(2)}!`
      }

      // Adicionar informação sobre prêmio do cofre na mensagem
      if (cofrePrize?.won && cofrePrize.prize > 0) {
        message += ` 🎰 BÔNUS COFRE: Você ganhou R$ ${cofrePrize.prize.toFixed(2)} do COFRE!`
      }

      // 8. Retornar resultado no formato esperado pelo frontend
      return NextResponse.json({
        success: true,
        gameResult: {
          hasWon: totalPrize > 0,
          prizeAmount: totalPrize,
        },
        cofrePrize: cofrePrize?.won
          ? {
              won: true,
              amount: cofrePrize.prize,
              cofreBalanceBefore: cofrePrize.cofreBalanceBefore,
              cofreBalanceAfter: cofrePrize.cofreBalanceAfter,
            }
          : null,
        newBalance: newBalance,
        message: message,
        debug: {
          balanceBefore: currentBalance,
          gamePrice: GAME_PRICE,
          regularPrize: prizeAmount,
          cofrePrize: cofrePrize?.prize || 0,
          totalPrize: totalPrize,
          netResult: finalNetResult,
          balanceAfter: newBalance,
          userType: auth.userType,
          transactionId: gamePlayTransactionId,
          cofreGameCount: cofreResult.gameCount,
          cofreTriggered: cofreResult.shouldCheckPrize,
          cofreEligible: auth.userType === "regular",
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
