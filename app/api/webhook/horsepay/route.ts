import { type NextRequest, NextResponse } from "next/server"
import { createWebhookLog, getUserWallet, sql, processAffiliateCommission } from "@/lib/database"

interface DepositCallback {
  external_id: number
  status: "success" | "pending" | "failed" | "true" | "false"
  amount: number
  payer_name?: string
  end_to_end_id?: string
}

interface WithdrawCallback {
  external_id: number
  end_to_end_id: string
  status: "success" | "refunded" | "pending" | "true" | "false"
  amount: number
}

type WebhookPayload = DepositCallback | WithdrawCallback

// Função para normalizar o status (HorsePay usa "true"/"false")
function normalizeStatus(status: string | boolean): string {
  console.log(`🔄 Normalizando status: ${status} (tipo: ${typeof status})`)

  if (status === "true" || status === true) {
    console.log(`✅ Status "true" detectado - convertendo para "success"`)
    return "success"
  }
  if (status === "false" || status === false) {
    console.log(`❌ Status "false" detectado - convertendo para "failed"`)
    return "failed"
  }

  console.log(`📝 Status mantido como: ${status}`)
  return status.toString()
}

// 🔗 FUNÇÃO PARA PROCESSAR BÔNUS DE INDICAÇÃO
async function processReferralBonus(userId: number, transactionId: number): Promise<void> {
  try {
    console.log(`👥 Verificando bônus de indicação para usuário ${userId}...`)

    // Verificar se o usuário foi indicado por outro usuário
    const [referral] = await sql`
    SELECT ur.*, u.name as referrer_name
    FROM user_referrals ur
    JOIN users u ON ur.referrer_id = u.id
    WHERE ur.referred_id = ${userId} AND ur.bonus_paid = false
  `

    if (!referral) {
      console.log(`ℹ️ Usuário ${userId} não foi indicado ou bônus já foi pago`)
      return
    }

    console.log(`👥 Usuário foi indicado por: ${referral.referrer_name} (ID: ${referral.referrer_id})`)

    // Data de hoje (início do dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Verificar se é o primeiro depósito válido do usuário indicado A PARTIR DE HOJE
    const [firstDeposit] = await sql`
    SELECT COUNT(*) as deposit_count
    FROM transactions 
    WHERE user_id = ${userId} 
    AND type = 'deposit' 
    AND status = 'success' 
    AND external_id IS NOT NULL
    AND created_at >= ${todayISO}
  `

    if (Number(firstDeposit.deposit_count) !== 1) {
      console.log(`ℹ️ Não é o primeiro depósito válido do usuário ${userId} hoje`)
      return
    }

    const bonusAmount = Number(referral.bonus_amount) || 5.0
    console.log(`💰 Processando bônus de indicação: R$ ${bonusAmount}`)

    // Creditar bônus na carteira do indicador
    await sql`
    INSERT INTO wallets (user_id, balance)
    VALUES (${referral.referrer_id}, ${bonusAmount})
    ON CONFLICT (user_id) DO UPDATE
    SET balance = wallets.balance + ${bonusAmount}
  `

    // Criar transação de bônus
    await sql`
    INSERT INTO transactions (user_id, type, amount, status, description, created_at)
    VALUES (${referral.referrer_id}, 'game_prize', ${bonusAmount}, 'success', 'Bônus de indicação - Amigo fez primeiro depósito', NOW())
  `

    // Marcar bônus como pago
    await sql`
    UPDATE user_referrals 
    SET bonus_paid = true, bonus_paid_at = NOW(), updated_at = NOW()
    WHERE id = ${referral.id}
  `

    console.log(`✅ Bônus de indicação pago: R$ ${bonusAmount} para usuário ${referral.referrer_id}`)
  } catch (error) {
    console.error("❌ Erro ao processar bônus de indicação:", error)
    // Não falhar o webhook por causa do bônus
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json()

    console.log("🔔 Webhook HorsePay recebido:", JSON.stringify(payload, null, 2))
    console.log(`📝 Status recebido: "${payload.status}" (${typeof payload.status})`)

    // Determinar o tipo de callback
    const isWithdraw = "end_to_end_id" in payload && payload.end_to_end_id
    const type = isWithdraw ? "withdraw" : "deposit"

    console.log(`📝 Tipo de webhook identificado: ${type}`)

    let processed = false
    let errorMessage = ""

    try {
      // Processar o webhook baseado no tipo
      if (type === "deposit") {
        console.log("💰 Processando callback de depósito...")
        await processDepositCallback(payload as DepositCallback)
      } else {
        console.log("💸 Processando callback de saque...")
        await processWithdrawCallback(payload as WithdrawCallback)
      }
      processed = true
      console.log("✅ Webhook processado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao processar webhook:", error)
      errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    }

    // Salvar log do webhook no banco
    const webhookLog = await createWebhookLog({
      type,
      external_id: payload.external_id,
      payload,
      processed,
      error_message: errorMessage || undefined,
    })

    console.log(`📊 Log do webhook salvo com ID: ${webhookLog.id}`)

    return NextResponse.json({
      success: processed,
      message: processed ? "Webhook processado com sucesso" : "Erro ao processar webhook",
      webhook_id: webhookLog.id,
      status: payload.status,
      error: errorMessage || undefined,
    })
  } catch (error) {
    console.error("💥 Erro crítico no webhook:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

async function processDepositCallback(payload: DepositCallback) {
  console.log(`🔍 Processando callback de depósito:`, JSON.stringify(payload, null, 2))

  // Validar dados obrigatórios
  if (!payload.external_id) {
    throw new Error("external_id é obrigatório")
  }

  if (!payload.amount || payload.amount <= 0) {
    throw new Error("amount deve ser maior que zero")
  }

  if (!payload.status) {
    throw new Error("status é obrigatório")
  }

  // Buscar a transação no banco
  console.log(`🔎 Buscando transação com external_id: ${payload.external_id}`)
  const [transaction] = await sql`
  SELECT * FROM transactions WHERE external_id = ${payload.external_id}
`

  if (!transaction) {
    const errorMsg = `Transação com external_id ${payload.external_id} não encontrada`
    console.error(`❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }

  console.log(`📋 Transação encontrada:`, JSON.stringify(transaction, null, 2))

  // 💰 LÓGICA DE ABSORÇÃO DE TAXA
  const originalAmount = Number.parseFloat(transaction.amount.toString()) // Valor que o usuário solicitou
  const webhookAmount = payload.amount // Valor líquido que a HorsePay enviou
  const absorvedFee = originalAmount - webhookAmount // Taxa absorvida pela empresa

  console.log(`💰 ABSORÇÃO DE TAXA:`)
  console.log(`💰 Valor solicitado pelo usuário: R$ ${originalAmount.toFixed(2)}`)
  console.log(`💰 Valor líquido da HorsePay: R$ ${webhookAmount.toFixed(2)}`)
  console.log(`💰 Taxa absorvida pela empresa: R$ ${absorvedFee.toFixed(2)}`)
  console.log(`💰 Usuário receberá: R$ ${originalAmount.toFixed(2)} (valor integral!)`)

  // Normalizar o status
  const normalizedStatus = normalizeStatus(payload.status)
  console.log(`📝 Status original: ${payload.status} → Status normalizado: ${normalizedStatus}`)

  if (normalizedStatus === "success") {
    // Verificar se já foi processada
    if (transaction.status === "success") {
      console.log(`⚠️ Transação ${payload.external_id} já processada. Ignorando.`)
      return
    }

    console.log(`🎉 DEPÓSITO APROVADO! Creditando valor INTEGRAL: R$ ${originalAmount}`)

    try {
      // 1. Atualizar status da transação
      console.log(`📝 Atualizando status da transação...`)
      await sql`
      UPDATE transactions
      SET status = ${normalizedStatus}, 
          end_to_end_id = COALESCE(${payload.end_to_end_id || null}, end_to_end_id)
      WHERE external_id = ${payload.external_id}
    `

      // 2. Creditar o VALOR ORIGINAL na carteira (não o valor do webhook)
      console.log(
        `💰 Creditando valor ORIGINAL: R$ ${originalAmount} (absorvendo taxa de R$ ${absorvedFee.toFixed(2)})`,
      )
      await sql`
      INSERT INTO wallets (user_id, balance)
      VALUES (${transaction.user_id}, ${originalAmount})
      ON CONFLICT (user_id) DO UPDATE
      SET balance = wallets.balance + ${originalAmount}
    `

      console.log(`🎉 Sucesso! Valor integral creditado ao usuário!`)

      console.log(`📊 VERIFICANDO PROGRESSO DE BÔNUS PARA USUÁRIO ${transaction.user_id}`)

      // Data de hoje (início do dia)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      console.log(`📅 Considerando apenas depósitos a partir de: ${todayISO}`)

      // Verificar total depositado após este depósito (APENAS A PARTIR DE HOJE)
      const [userDepositStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'success' AND external_id IS NOT NULL AND created_at >= ${todayISO} THEN amount ELSE 0 END), 0) as total_deposited
      FROM transactions
      WHERE user_id = ${transaction.user_id} AND type = 'deposit'
    `

      const userTotalDeposited = Number.parseFloat(userDepositStats.total_deposited.toString()) || 0
      console.log(
        `💰 Total depositado pelo usuário ${transaction.user_id} (a partir de hoje): R$ ${userTotalDeposited}`,
      )

      // Verificar se deve conceder bônus (apenas bônus concedidos hoje)
      const [existingBonuses] = await sql`
      SELECT 
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 50%' AND created_at >= ${todayISO} THEN 1 END) as bonus_50_count,
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 100%' AND created_at >= ${todayISO} THEN 1 END) as bonus_100_count
      FROM transactions
      WHERE user_id = ${transaction.user_id} 
      AND type = 'game_prize' 
      AND status = 'success'
      AND (description LIKE '%Bônus de depósito R$ 50%' OR description LIKE '%Bônus de depósito R$ 100%')
    `

      const bonus50AlreadyClaimed = Number(existingBonuses.bonus_50_count) > 0
      const bonus100AlreadyClaimed = Number(existingBonuses.bonus_100_count) > 0

      console.log(`🎁 Bônus R$ 50 já concedido hoje: ${bonus50AlreadyClaimed}`)
      console.log(`🎁 Bônus R$ 100 já concedido hoje: ${bonus100AlreadyClaimed}`)

      // Conceder bônus se aplicável
      if (!bonus50AlreadyClaimed && userTotalDeposited >= 50) {
        console.log(`🎉 CONCEDENDO BÔNUS DE R$ 50! (Total hoje: R$ ${userTotalDeposited})`)

        await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${transaction.user_id}, 5.00)
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + 5.00
      `

        await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (${transaction.user_id}, 'game_prize', 5.00, 'success', 'Bônus de depósito R$ 50 - Parabéns!', NOW())
      `

        console.log(`✅ Bônus de R$ 5 creditado!`)
      }

      if (!bonus100AlreadyClaimed && userTotalDeposited >= 100) {
        console.log(`🎉 CONCEDENDO BÔNUS DE R$ 100! (Total hoje: R$ ${userTotalDeposited})`)

        await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${transaction.user_id}, 10.00)
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + 10.00
      `

        await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (${transaction.user_id}, 'game_prize', 10.00, 'success', 'Bônus de depósito R$ 100 - Parabéns!', NOW())
      `

        console.log(`✅ Bônus de R$ 10 creditado!`)
      }

      // 3. 🤝 PROCESSAR COMISSÃO DE AFILIADO PARA TODOS OS DEPÓSITOS
      console.log(`🤝 Processando comissão de afiliado para TODOS os depósitos...`)
      try {
        await processAffiliateCommission(transaction.user_id, transaction.id, originalAmount)
      } catch (affiliateError) {
        console.error(`❌ Erro ao processar comissão de afiliado:`, affiliateError)
        // Não falhar o webhook por causa da comissão
      }

      // 4. 👥 PROCESSAR BÔNUS DE INDICAÇÃO
      console.log(`👥 Processando bônus de indicação...`)
      try {
        await processReferralBonus(transaction.user_id, transaction.id)
      } catch (referralError) {
        console.error(`❌ Erro ao processar bônus de indicação:`, referralError)
        // Não falhar o webhook por causa do bônus
      }

      // Verificar saldo final
      const walletAfter = await getUserWallet(transaction.user_id)
      console.log(`💰 Novo saldo: R$ ${walletAfter?.balance || 0}`)

      // Log para controle interno
      console.log(`📊 RESUMO FINANCEIRO:`)
      console.log(`📊 Receita bruta: R$ ${originalAmount.toFixed(2)}`)
      console.log(`📊 Taxa HorsePay: R$ ${absorvedFee.toFixed(2)}`)
      console.log(`📊 Receita líquida: R$ ${webhookAmount.toFixed(2)}`)
      console.log(`📊 Margem: ${absorvedFee > 0 ? `-R$ ${absorvedFee.toFixed(2)}` : "Positiva"}`)
    } catch (error) {
      console.error(`❌ Erro ao processar depósito:`, error)
      throw new Error(`Erro ao creditar saldo: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    }
  } else if (normalizedStatus === "failed") {
    console.log(`❌ Depósito falhou`)
    await sql`
    UPDATE transactions
    SET status = ${normalizedStatus}
    WHERE external_id = ${payload.external_id}
  `
  } else {
    console.log(`⏳ Status: ${normalizedStatus}`)
  }
}

async function processWithdrawCallback(payload: WithdrawCallback) {
  console.log(`🔍 Processando callback de saque:`, JSON.stringify(payload, null, 2))

  // Validar dados obrigatórios
  if (!payload.external_id) {
    throw new Error("external_id é obrigatório")
  }

  if (!payload.amount || payload.amount <= 0) {
    throw new Error("amount deve ser maior que zero")
  }

  if (!payload.status) {
    throw new Error("status é obrigatório")
  }

  // Buscar a transação no banco
  console.log(`🔎 Buscando transação com external_id: ${payload.external_id}`)
  const [transaction] = await sql`
    SELECT * FROM transactions WHERE external_id = ${payload.external_id}
  `

  if (!transaction) {
    const errorMsg = `Transação com external_id ${payload.external_id} não encontrada`
    console.error(`❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }

  console.log(`📋 Transação encontrada:`, JSON.stringify(transaction, null, 2))

  // Normalizar o status
  const normalizedStatus = normalizeStatus(payload.status)
  console.log(`📝 Status original: ${payload.status} → Status normalizado: ${normalizedStatus}`)

  // Atualizar status da transação
  console.log(`📝 Atualizando status da transação para: ${normalizedStatus}`)
  await sql`
    UPDATE transactions 
    SET status = ${normalizedStatus}, 
        end_to_end_id = COALESCE(${payload.end_to_end_id || null}, end_to_end_id),
        updated_at = NOW()
    WHERE external_id = ${payload.external_id}
  `

  // Processar baseado no status
  if (normalizedStatus === "success") {
    console.log(`✅ Saque ${payload.external_id} confirmado com sucesso: R$ ${payload.amount}`)
    console.log(`🎉 Pagamento PIX realizado - End-to-End ID: ${payload.end_to_end_id}`)
  } else if (normalizedStatus === "refunded") {
    console.log(`🔄 Saque ${payload.external_id} foi estornado! Devolvendo R$ ${payload.amount} ao saldo`)

    try {
      // Devolver o valor ao saldo do usuário
      await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${transaction.user_id}, ${payload.amount})
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + ${payload.amount}
      `

      console.log(`💰 Saldo do usuário ${transaction.user_id} atualizado (estorno): +R$ ${payload.amount}`)

      // Criar transação de estorno para histórico
      await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (
          ${transaction.user_id}, 
          'game_prize', 
          ${payload.amount}, 
          'success', 
          'Estorno de saque - PIX não processado', 
          NOW()
        )
      `

      // Verificar saldo após a atualização
      const walletAfter = await getUserWallet(transaction.user_id)
      console.log(`💰 Novo saldo após estorno: R$ ${walletAfter?.balance || 0}`)
    } catch (walletError) {
      console.error(`❌ Erro ao processar estorno:`, walletError)
      throw new Error(
        `Erro ao processar estorno: ${walletError instanceof Error ? walletError.message : "Erro desconhecido"}`,
      )
    }
  } else if (normalizedStatus === "pending") {
    console.log(`⏳ Saque ${payload.external_id} ainda está pendente: R$ ${payload.amount}`)
  } else if (normalizedStatus === "failed") {
    console.log(`❌ Saque ${payload.external_id} falhou: R$ ${payload.amount}`)

    // Para saques que falharam, também devolver o valor
    try {
      await sql`
        INSERT INTO wallets (user_id, balance)
        VALUES (${transaction.user_id}, ${payload.amount})
        ON CONFLICT (user_id) DO UPDATE
        SET balance = wallets.balance + ${payload.amount}
      `

      console.log(`💰 Saldo devolvido devido à falha no saque: +R$ ${payload.amount}`)

      // Criar transação de devolução para histórico
      await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (
          ${transaction.user_id}, 
          'game_prize', 
          ${payload.amount}, 
          'success', 
          'Devolução - Saque falhou', 
          NOW()
        )
      `
    } catch (walletError) {
      console.error(`❌ Erro ao devolver saldo:`, walletError)
    }
  } else {
    console.log(`❓ Status desconhecido para saque ${payload.external_id}: ${normalizedStatus}`)
  }

  console.log(`✅ Callback de saque processado com sucesso`)
}

// Endpoint para buscar logs dos webhooks
export async function GET() {
  try {
    const logs = await sql`
      SELECT * FROM webhook_logs
      ORDER BY created_at DESC
      LIMIT 100
    `

    // Converter o payload JSONB se for uma string
    const formattedLogs = logs.map((log) => ({
      ...log,
      payload: typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total: formattedLogs.length,
    })
  } catch (error) {
    console.error("Erro ao buscar logs:", error)
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 })
  }
}
