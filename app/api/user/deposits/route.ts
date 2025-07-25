import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Buscando histórico de depósitos e progresso...")

    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log(`✅ Usuário autenticado: ${auth.userId}`)

    // Data de hoje (início do dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    console.log(`📅 Considerando apenas depósitos a partir de: ${todayISO}`)

    // Buscar todos os depósitos do usuário (incluindo pendentes para histórico)
    const deposits = await sql`
      SELECT * FROM transactions 
      WHERE user_id = ${auth.userId} 
      AND type = 'deposit'
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Calcular total depositado (apenas depósitos bem-sucedidos com external_id A PARTIR DE HOJE)
    const [depositStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'success' AND external_id IS NOT NULL AND created_at >= ${todayISO} THEN amount ELSE 0 END), 0) as total_deposited,
        COUNT(CASE WHEN status = 'success' AND external_id IS NOT NULL AND created_at >= ${todayISO} THEN 1 END) as successful_deposits
      FROM transactions
      WHERE user_id = ${auth.userId} AND type = 'deposit'
    `

    const totalDeposited = Number.parseFloat(depositStats.total_deposited.toString()) || 0
    console.log(`💰 Total depositado válido (a partir de hoje): R$ ${totalDeposited}`)

    // Verificar se os bônus já foram concedidos (também apenas a partir de hoje)
    const [bonusStats] = await sql`
      SELECT 
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 50%' AND created_at >= ${todayISO} THEN 1 END) as bonus_50_count,
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 100%' AND created_at >= ${todayISO} THEN 1 END) as bonus_100_count
      FROM transactions
      WHERE user_id = ${auth.userId} 
      AND type = 'game_prize' 
      AND status = 'success'
      AND (description LIKE '%Bônus de depósito R$ 50%' OR description LIKE '%Bônus de depósito R$ 100%')
    `

    const bonus50Claimed = Number(bonusStats.bonus_50_count) > 0
    const bonus100Claimed = Number(bonusStats.bonus_100_count) > 0

    console.log(`🎁 Bônus R$ 50 já concedido (hoje): ${bonus50Claimed}`)
    console.log(`🎁 Bônus R$ 100 já concedido (hoje): ${bonus100Claimed}`)

    // Verificar se deve conceder bônus
    let bonusAwarded = false

    // Bônus de R$ 50 (R$ 5 de bônus)
    if (!bonus50Claimed && totalDeposited >= 50) {
      console.log(`🎉 Concedendo bônus de R$ 50!`)

      // Creditar bônus na carteira
      await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${auth.userId}, 5.00)
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + 5.00
      `

      // Criar transação de bônus
      await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (${auth.userId}, 'game_prize', 5.00, 'success', 'Bônus de depósito R$ 50 - Parabéns!', NOW())
      `

      bonusAwarded = true
      console.log(`✅ Bônus de R$ 5 creditado por atingir R$ 50 em depósitos hoje`)
    }

    // Bônus de R$ 100 (R$ 10 de bônus)
    if (!bonus100Claimed && totalDeposited >= 100) {
      console.log(`🎉 Concedendo bônus de R$ 100!`)

      // Creditar bônus na carteira
      await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${auth.userId}, 10.00)
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + 10.00
      `

      // Criar transação de bônus
      await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (${auth.userId}, 'game_prize', 10.00, 'success', 'Bônus de depósito R$ 100 - Parabéns!', NOW())
      `

      bonusAwarded = true
      console.log(`✅ Bônus de R$ 10 creditado por atingir R$ 100 em depósitos hoje`)
    }

    // Recalcular status dos bônus após possível concessão
    const finalBonus50Claimed = bonus50Claimed || (totalDeposited >= 50 && bonusAwarded)
    const finalBonus100Claimed = bonus100Claimed || (totalDeposited >= 100 && bonusAwarded)

    const response = {
      success: true,
      deposits: deposits.map((deposit) => ({
        id: deposit.id,
        amount: Number.parseFloat(deposit.amount.toString()),
        status: deposit.status,
        external_id: deposit.external_id,
        qr_code: deposit.qr_code,
        copy_paste_code: deposit.copy_paste_code,
        created_at: deposit.created_at,
        description: deposit.description,
      })),
      total_deposited: totalDeposited,
      successful_deposits: Number(depositStats.successful_deposits),
      bonus_50_claimed: finalBonus50Claimed,
      bonus_100_claimed: finalBonus100Claimed,
      bonus_awarded: bonusAwarded,
      date_filter: todayISO, // Para debug
    }

    console.log(`📊 Resposta final:`, {
      total_deposited: totalDeposited,
      bonus_50_claimed: finalBonus50Claimed,
      bonus_100_claimed: finalBonus100Claimed,
      bonus_awarded: bonusAwarded,
      date_filter: todayISO,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Erro ao buscar depósitos:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
