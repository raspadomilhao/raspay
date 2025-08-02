import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  email: string
  name: string
  username?: string
  phone?: string
  password_hash?: string
  client_key?: string
  client_secret?: string
  user_type?: string
  affiliate_id?: number
  created_at: string
  updated_at: string
  referred_by?: string
}

export interface Wallet {
  id: number
  user_id: number
  balance: string | number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  user_id: number
  type: "deposit" | "withdraw" | "game_play" | "game_prize"
  amount: string | number
  status: string
  external_id?: number
  end_to_end_id?: string
  payer_name?: string
  pix_key?: string
  pix_type?: string
  callback_url?: string
  qr_code?: string
  copy_paste_code?: string
  is_demo?: boolean
  created_at: string
  updated_at: string
  description?: string
}

export interface WebhookLog {
  id: number
  type: string
  external_id?: number
  payload: any
  processed: boolean
  error_message?: string
  created_at: string
}

export interface Affiliate {
  id: number
  name: string
  email: string
  username: string
  affiliate_code: string
  password_hash?: string
  commission_rate: string | number
  loss_commission_rate: string | number
  total_earnings: string | number
  balance?: string | number
  total_referrals: number
  status: string
  created_at: string
  updated_at: string
}

export interface AffiliateCommission {
  id: number
  affiliate_id: number
  user_id: number
  transaction_id: number
  commission_amount: string | number
  commission_type: "deposit" | "loss_gain" | "loss_penalty"
  status: string
  created_at: string
  paid_at?: string
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

export async function createUser(
  email: string,
  name: string,
  username?: string,
  phone?: string,
  passwordHash?: string,
  userType = "regular",
  affiliateId?: number,
): Promise<User> {
  const emailLower = email.toLowerCase()
  const usernameLower = username?.toLowerCase()

  const [user] = await sql`
    INSERT INTO users (email, name, username, phone, password_hash, user_type, affiliate_id)
    VALUES (${emailLower}, ${name}, ${usernameLower || null}, ${phone || null}, ${passwordHash || null}, ${userType}, ${affiliateId || null})
    RETURNING *
  `

  // Criar carteira com saldo inicial - todas as contas começam com R$ 0,00
  const initialBalance = 0.0
  await sql`
    INSERT INTO wallets (user_id, balance)
    VALUES (${user.id}, ${initialBalance})
    ON CONFLICT (user_id) DO NOTHING;
  `

  // Se tem afiliado, incrementar contador de referrals
  if (affiliateId) {
    await sql`
      UPDATE affiliates 
      SET total_referrals = total_referrals + 1,
          updated_at = NOW()
      WHERE id = ${affiliateId}
    `
  }

  return user
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql`
    SELECT * FROM users WHERE LOWER(email) = LOWER(${email})
  `
  return user || null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [user] = await sql`
    SELECT * FROM users WHERE LOWER(username) = LOWER(${username})
  `
  return user || null
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await sql`
    SELECT * FROM users WHERE id = ${id}
  `
  return user || null
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const [user] = await sql`
    UPDATE users 
    SET name = COALESCE(${data.name}, name),
        username = COALESCE(${data.username}, username),
        phone = COALESCE(${data.phone}, phone),
        client_key = COALESCE(${data.client_key}, client_key),
        client_secret = COALESCE(${data.client_secret}, client_secret),
        user_type = COALESCE(${data.user_type}, user_type),
        affiliate_id = COALESCE(${data.affiliate_id}, affiliate_id)
    WHERE id = ${id}
    RETURNING *
  `
  return user
}

export async function getUserWallet(userId: number): Promise<Wallet | null> {
  const [wallet] = await sql`
    SELECT * FROM wallets WHERE user_id = ${userId}
  `
  return wallet || null
}

export async function updateWalletBalance(
  userId: number,
  amount: number,
  operation: "add" | "subtract",
  userType = "regular",
): Promise<Wallet> {
  console.log(
    `💰 updateWalletBalance: userId=${userId}, amount=${amount}, operation=${operation}, userType=${userType}`,
  )

  const operator = operation === "add" ? "+" : "-"
  const absoluteAmount = Math.abs(amount)

  try {
    const [wallet] = await sql`
      INSERT INTO wallets (user_id, balance)
      VALUES (${userId}, ${operation === "add" ? absoluteAmount : -absoluteAmount})
      ON CONFLICT (user_id) DO UPDATE
      SET balance = wallets.balance ${sql.unsafe(operator)} ${absoluteAmount}
      RETURNING *
    `

    if (!wallet) {
      throw new Error(`Falha crítica ao operar na carteira do usuário ${userId}`)
    }

    console.log(`💰 Carteira atualizada com sucesso`)
    return wallet
  } catch (error) {
    console.error(`❌ Erro ao executar updateWalletBalance para userId ${userId}:`, error)
    throw error
  }
}

export async function createTransaction(data: {
  user_id: number
  type: string
  amount: number
  status: string
  external_id?: number
  end_to_end_id?: string
  payer_name?: string
  pix_key?: string
  pix_type?: string
  callback_url?: string
  qr_code?: string
  copy_paste_code?: string
  is_demo?: boolean
  description?: string
}): Promise<Transaction> {
  const [transaction] = await sql`
    INSERT INTO transactions (
      user_id, type, amount, status, external_id, end_to_end_id, 
      payer_name, pix_key, pix_type, callback_url, qr_code, copy_paste_code, is_demo, description
    )
    VALUES (
      ${data.user_id}, ${data.type}, ${data.amount}, ${data.status}, 
      ${data.external_id || null}, ${data.end_to_end_id || null}, ${data.payer_name || null}, 
      ${data.pix_key || null}, ${data.pix_type || null}, ${data.callback_url || null}, 
      ${data.qr_code || null}, ${data.copy_paste_code || null}, ${data.is_demo || false}, ${data.description || null}
    )
    RETURNING *
  `
  return transaction
}

export async function getTransactionByExternalId(externalId: number): Promise<Transaction | null> {
  const [transaction] = await sql`
    SELECT * FROM transactions WHERE external_id = ${externalId}
  `
  return transaction || null
}

export async function getUserTransactions(userId: number, limit = 50): Promise<Transaction[]> {
  const transactions = await sql`
    SELECT * FROM transactions 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return transactions
}

export async function updateTransactionStatus(
  externalId: number,
  status: string,
  endToEndId?: string,
): Promise<Transaction | null> {
  const [transaction] = await sql`
    UPDATE transactions 
    SET status = ${status}, end_to_end_id = COALESCE(${endToEndId || null}, end_to_end_id)
    WHERE external_id = ${externalId}
    RETURNING *
  `
  return transaction || null
}

export async function createWebhookLog(data: Omit<WebhookLog, "id" | "created_at">): Promise<WebhookLog> {
  const [log] = await sql`
    INSERT INTO webhook_logs (type, external_id, payload, processed, error_message)
    VALUES (${data.type}, ${data.external_id}, ${JSON.stringify(data.payload)}, ${data.processed}, ${data.error_message})
    RETURNING *
  `
  return log
}

export async function getWebhookLogs(limit = 100): Promise<WebhookLog[]> {
  const logs = await sql`
    SELECT * FROM webhook_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return logs.map((log) => ({
    ...log,
    payload: typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload,
  }))
}

export async function getUserStats(userId: number) {
  const [stats] = await sql`
    SELECT 
      COUNT(CASE WHEN type = 'deposit' AND status = 'success' THEN 1 END) as successful_deposits,
      COUNT(CASE WHEN type = 'withdraw' AND status = 'success' THEN 1 END) as successful_withdraws,
      COUNT(CASE WHEN type = 'game_play' THEN 1 END) as games_played,
      COUNT(CASE WHEN type = 'game_prize' THEN 1 END) as prizes_won,
      COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as total_deposited,
      COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount ELSE 0 END), 0) as total_withdrawn,
      COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as total_spent_on_games,
      COALESCE(SUM(CASE WHEN type = 'game_prize' THEN amount ELSE 0 END), 0) as total_prizes_won,
      COUNT(*) as total_transactions
    FROM transactions
    WHERE user_id = ${userId}
  `
  return (
    stats || {
      successful_deposits: "0",
      successful_withdraws: "0",
      games_played: "0",
      prizes_won: "0",
      total_deposited: "0",
      total_withdrawn: "0",
      total_spent_on_games: "0",
      total_prizes_won: "0",
      total_transactions: "0",
    }
  )
}

export async function getAdminStats() {
  const [stats] = await sql`
  SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN t.created_at >= NOW() - INTERVAL '24 hours' THEN u.id END) as active_users_24h,
    COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'success' AND t.external_id IS NOT NULL THEN 1 END) as total_deposits,
    COUNT(CASE WHEN t.type = 'withdraw' AND t.status = 'success' AND t.external_id IS NOT NULL THEN 1 END) as total_withdraws,
    COUNT(CASE WHEN t.type = 'game_play' THEN 1 END) as total_games_played,
    COUNT(CASE WHEN t.type = 'game_prize' THEN 1 END) as total_prizes_awarded,
    COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' AND t.external_id IS NOT NULL THEN t.amount ELSE 0 END), 0) as total_deposited,
    COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'success' AND t.external_id IS NOT NULL THEN t.amount ELSE 0 END), 0) as total_withdrawn,
    COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN t.amount ELSE 0 END), 0) as total_game_revenue,
    COALESCE(SUM(CASE WHEN t.type = 'game_prize' THEN t.amount ELSE 0 END), 0) as total_prizes_paid,
    COALESCE(SUM(w.balance), 0) as total_balance_in_wallets
  FROM users u
  LEFT JOIN transactions t ON u.id = t.user_id
  LEFT JOIN wallets w ON u.id = w.user_id
`

  const recentTransactions = await sql`
    SELECT 
      t.*,
      u.name as user_name,
      u.username as user_username,
      u.user_type
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 10
  `

  return {
    ...stats,
    recent_transactions: recentTransactions,
  }
}

export async function getAllUsersWithBalance() {
  const users = await sql`
    SELECT 
      u.id,
      u.name,
      u.username,
      u.email,
      u.user_type,
      u.created_at,
      COALESCE(w.balance, 0) as balance,
      COUNT(t.id) as total_transactions
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    LEFT JOIN transactions t ON u.id = t.user_id
    GROUP BY u.id, u.name, u.username, u.email, u.user_type, u.created_at, w.balance
    ORDER BY u.created_at DESC
  `
  return users
}

// ===== FUNÇÕES DE AFILIADOS =====

export async function createAffiliate(data: {
  name: string
  email: string
  username: string
  affiliate_code: string
  password_hash: string
  commission_rate?: number
  loss_commission_rate?: number
}): Promise<Affiliate> {
  const [affiliate] = await sql`
    INSERT INTO affiliates (name, email, username, affiliate_code, password_hash, commission_rate, loss_commission_rate, balance)
    VALUES (${data.name}, ${data.email.toLowerCase()}, ${data.username.toLowerCase()}, ${data.affiliate_code.toUpperCase()}, ${data.password_hash}, ${data.commission_rate || 10.0}, ${data.loss_commission_rate || 0.0}, 0.00)
    RETURNING *
  `
  return affiliate
}

export async function getAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const [affiliate] = await sql`
    SELECT * FROM affiliates WHERE LOWER(email) = LOWER(${email})
  `
  return affiliate || null
}

export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  const [affiliate] = await sql`
    SELECT * FROM affiliates WHERE UPPER(affiliate_code) = UPPER(${code})
  `
  return affiliate || null
}

export async function getAffiliateById(id: number): Promise<Affiliate | null> {
  const [affiliate] = await sql`
    SELECT * FROM affiliates WHERE id = ${id}
  `
  return affiliate || null
}

export async function getAllAffiliates(): Promise<Affiliate[]> {
  const affiliates = await sql`
    SELECT * FROM affiliates ORDER BY created_at DESC
  `
  return affiliates
}

export async function updateAffiliate(id: number, data: Partial<Affiliate>): Promise<Affiliate> {
  const [affiliate] = await sql`
    UPDATE affiliates 
    SET name = COALESCE(${data.name}, name),
        email = COALESCE(${data.email}, email),
        username = COALESCE(${data.username}, username),
        commission_rate = COALESCE(${data.commission_rate}, commission_rate),
        loss_commission_rate = COALESCE(${data.loss_commission_rate}, loss_commission_rate),
        status = COALESCE(${data.status}, status),
        ${data.password_hash ? sql`password_hash = ${data.password_hash},` : sql``}
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return affiliate
}

export async function createAffiliateCommission(data: {
  affiliate_id: number
  user_id: number
  transaction_id: number
  commission_amount: number
  commission_type?: "deposit" | "loss_gain" | "loss_penalty"
}): Promise<AffiliateCommission> {
  // Definir o tipo de comissão padrão se não for fornecido
  const commissionType = data.commission_type || "deposit"

  console.log(
    `💰 Criando comissão para afiliado ${data.affiliate_id}: R$ ${data.commission_amount.toFixed(2)} (${commissionType})`,
  )

  try {
    // Inserir a comissão na tabela affiliate_commissions
    const [commission] = await sql`
      INSERT INTO affiliate_commissions (affiliate_id, user_id, transaction_id, commission_amount, commission_type)
      VALUES (${data.affiliate_id}, ${data.user_id}, ${data.transaction_id}, ${data.commission_amount}, ${commissionType})
      RETURNING *
    `

    console.log(`✅ Comissão criada com ID: ${commission.id}`)

    // Atualizar o saldo e total_earnings do afiliado
    await sql`
      UPDATE affiliates 
      SET total_earnings = total_earnings + ${data.commission_amount},
          balance = COALESCE(balance, 0) + ${data.commission_amount},
          updated_at = NOW()
      WHERE id = ${data.affiliate_id}
    `

    console.log(`✅ Saldo do afiliado ${data.affiliate_id} atualizado`)

    // Verificar se o afiliado tem gerente
    const [affiliate] = await sql`
      SELECT manager_id, total_earnings FROM affiliates 
      WHERE id = ${data.affiliate_id} AND manager_id IS NOT NULL
    `

    if (affiliate?.manager_id) {
      console.log(`👨‍💼 Afiliado tem gerente ${affiliate.manager_id}`)

      // Buscar informações do gerente
      const [manager] = await sql`
        SELECT commission_rate, status FROM managers WHERE id = ${affiliate.manager_id}
      `

      if (manager && manager.status === "active") {
        const managerCommissionRate = toNumber(manager.commission_rate)
        const affiliateTotalEarnings = toNumber(affiliate.total_earnings) + data.commission_amount
        const managerShouldHave = (affiliateTotalEarnings * managerCommissionRate) / 100

        // Verificar saldo atual do gerente
        const [managerData] = await sql`
          SELECT balance FROM managers WHERE id = ${affiliate.manager_id}
        `

        const managerCurrentBalance = toNumber(managerData?.balance || 0)
        const commissionDue = managerShouldHave - managerCurrentBalance

        if (Math.abs(commissionDue) >= 0.01) {
          console.log(
            `💰 Ajustando saldo do gerente: R$ ${managerCurrentBalance.toFixed(2)} → R$ ${managerShouldHave.toFixed(2)}`,
          )

          // Criar registro da comissão do gerente
          await sql`
            INSERT INTO manager_commissions (manager_id, affiliate_id, commission_amount, commission_type, description)
            VALUES (
              ${affiliate.manager_id}, 
              ${data.affiliate_id}, 
              ${commissionDue}, 
              ${commissionType}, 
              ${"Ajuste baseado no total_earnings do afiliado (R$ " + affiliateTotalEarnings.toFixed(2) + ")"}
            )
          `

          // Atualizar saldo do gerente
          await sql`
            UPDATE managers 
            SET total_earnings = total_earnings + ${commissionDue},
                balance = ${managerShouldHave},
                updated_at = NOW()
            WHERE id = ${affiliate.manager_id}
          `

          console.log(`✅ Saldo do gerente ajustado para R$ ${managerShouldHave.toFixed(2)}`)
        }
      }
    }

    return commission
  } catch (error) {
    console.error("❌ Erro ao criar comissão de afiliado:", error)
    throw error
  }
}

export async function getAffiliateCommissions(affiliateId: number, limit = 50): Promise<AffiliateCommission[]> {
  const commissions = await sql`
    SELECT 
      ac.*,
      u.name as user_name,
      u.email as user_email,
      t.amount as transaction_amount,
      t.type as transaction_type
    FROM affiliate_commissions ac
    JOIN users u ON ac.user_id = u.id
    JOIN transactions t ON ac.transaction_id = t.id
    WHERE ac.affiliate_id = ${affiliateId}
    ORDER BY ac.created_at DESC
    LIMIT ${limit}
  `
  return commissions
}

export async function getAffiliateStats(affiliateId: number) {
  const [stats] = await sql`
    SELECT 
      COUNT(DISTINCT u.id) as total_referrals,
      COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END) as active_referrals,
      COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN 1 END) as total_deposits,
      COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposit_volume,
      COALESCE(SUM(CASE WHEN ac.commission_type = 'deposit' THEN ac.commission_amount ELSE 0 END), 0) as deposit_commissions,
      COALESCE(SUM(CASE WHEN ac.commission_type IN ('loss_gain', 'loss_penalty') THEN ac.commission_amount ELSE 0 END), 0) as loss_commissions,
      COALESCE(SUM(ac.commission_amount), 0) as total_commissions,
      COUNT(CASE WHEN ac.status = 'pending' THEN 1 END) as pending_commissions,
      COUNT(CASE WHEN ac.status = 'paid' THEN 1 END) as paid_commissions
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id
    LEFT JOIN affiliate_commissions ac ON u.id = ac.user_id AND ac.affiliate_id = ${affiliateId}
    WHERE u.affiliate_id = ${affiliateId}
  `

  const recentCommissions = await sql`
    SELECT 
      ac.*,
      u.name as user_name,
      u.email as user_email,
      t.amount as transaction_amount
    FROM affiliate_commissions ac
    JOIN users u ON ac.user_id = u.id
    JOIN transactions t ON ac.transaction_id = t.id
    WHERE ac.affiliate_id = ${affiliateId}
    ORDER BY ac.created_at DESC
    LIMIT 10
  `

  return {
    ...stats,
    recent_commissions: recentCommissions,
  }
}

export async function processAffiliateCommission(userId: number, transactionId: number, amount: number): Promise<void> {
  console.log(`🤝 Processando comissão de afiliado para usuário ${userId} - TODOS OS DEPÓSITOS`)

  const user = await getUserById(userId)
  if (!user?.affiliate_id) {
    console.log(`👤 Usuário ${userId} não tem afiliado vinculado`)
    return
  }

  const affiliate = await getAffiliateById(user.affiliate_id)
  if (!affiliate || affiliate.status !== "active") {
    console.log(`❌ Afiliado ${user.affiliate_id} não encontrado ou inativo`)
    return
  }

  // Verificar se já existe comissão para esta transação (evitar duplicação)
  const [existingCommission] = await sql`
    SELECT id FROM affiliate_commissions 
    WHERE transaction_id = ${transactionId} AND affiliate_id = ${user.affiliate_id}
  `

  if (existingCommission) {
    console.log(`⚠️ Comissão já existe para transação ${transactionId}. Ignorando.`)
    return
  }

  const commissionAmount = toNumber(affiliate.commission_rate)
  console.log(`💰 Criando comissão de R$ ${commissionAmount} para afiliado ${affiliate.name} (REDEPÓSITO)`)

  await createAffiliateCommission({
    affiliate_id: user.affiliate_id,
    user_id: userId,
    transaction_id: transactionId,
    commission_amount: commissionAmount,
    commission_type: "deposit",
  })

  console.log(`✅ Comissão de redepósito criada com sucesso!`)
}

// Nova função para processar comissão por perda/ganho
export async function processAffiliateLossCommission(
  userId: number,
  transactionId: number,
  netAmount: number,
): Promise<void> {
  try {
    console.log(`🤝 Processando comissão por perda/ganho para usuário ${userId}...`)

    const user = await getUserById(userId)
    if (!user?.affiliate_id) {
      console.log(`👤 Usuário ${userId} não tem afiliado vinculado`)
      return
    }

    const affiliate = await getAffiliateById(user.affiliate_id)
    if (!affiliate || affiliate.status !== "active") {
      console.log(`❌ Afiliado ${user.affiliate_id} não encontrado ou inativo`)
      return
    }

    const lossCommissionRate = toNumber(affiliate.loss_commission_rate)
    if (lossCommissionRate === 0) {
      console.log(`ℹ️ Afiliado ${affiliate.name} não tem comissão por perda configurada (${lossCommissionRate}%)`)
      return
    }

    // Calcular comissão
    let commissionAmount = 0
    let commissionType: "loss_gain" | "loss_penalty" = "loss_gain"

    if (netAmount < 0) {
      // Usuário perdeu - afiliado ganha
      const lossAmount = Math.abs(netAmount)
      commissionAmount = (lossAmount * lossCommissionRate) / 100
      commissionType = "loss_gain"
      console.log(
        `💸 Usuário perdeu R$ ${lossAmount.toFixed(2)} - Afiliado ganha R$ ${commissionAmount.toFixed(2)} (${lossCommissionRate}%)`,
      )
    } else if (netAmount > 0) {
      // Usuário ganhou - afiliado perde (comissão negativa)
      commissionAmount = -((netAmount * lossCommissionRate) / 100)
      commissionType = "loss_penalty"
      console.log(
        `🎉 Usuário ganhou R$ ${netAmount.toFixed(2)} - Afiliado perde R$ ${Math.abs(commissionAmount).toFixed(2)} (${lossCommissionRate}%)`,
      )
    } else {
      console.log(`⚖️ Usuário empatou - sem comissão`)
      return
    }

    if (Math.abs(commissionAmount) < 0.01) {
      console.log(`ℹ️ Comissão muito baixa (R$ ${commissionAmount.toFixed(4)}) - ignorando`)
      return
    }

    // Verificar se já existe comissão para esta transação (evitar duplicação)
    const [existingCommission] = await sql`
      SELECT id FROM affiliate_commissions 
      WHERE transaction_id = ${transactionId} AND affiliate_id = ${user.affiliate_id} AND commission_type IN ('loss_gain', 'loss_penalty')
    `

    if (existingCommission) {
      console.log(`⚠️ Comissão por perda já existe para transação ${transactionId}. Ignorando.`)
      return
    }

    await createAffiliateCommission({
      affiliate_id: user.affiliate_id,
      user_id: userId,
      transaction_id: transactionId,
      commission_amount: commissionAmount,
      commission_type: commissionType,
    })

    console.log(`✅ Comissão por perda processada: R$ ${commissionAmount.toFixed(2)} (${commissionType})`)
  } catch (error) {
    console.error("❌ Erro ao processar comissão por perda:", error)
    throw error
  }
}

// 🔥 NOVA FUNÇÃO: Processar saque de afiliado (só diminui balance, não total_earnings)
export async function processAffiliateWithdraw(affiliateId: number, withdrawAmount: number): Promise<void> {
  console.log(`💸 Processando saque de afiliado ${affiliateId}: R$ ${withdrawAmount}`)

  // Verificar saldo disponível
  const [affiliate] = await sql`
    SELECT balance, total_earnings FROM affiliates WHERE id = ${affiliateId}
  `

  if (!affiliate) {
    throw new Error(`Afiliado ${affiliateId} não encontrado`)
  }

  const currentBalance = toNumber(affiliate.balance)
  const totalEarnings = toNumber(affiliate.total_earnings)

  if (currentBalance < withdrawAmount) {
    throw new Error(
      `Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}, Solicitado: R$ ${withdrawAmount.toFixed(2)}`,
    )
  }

  // 🔥 IMPORTANTE: Só diminuir o BALANCE, não o TOTAL_EARNINGS
  console.log(
    `💰 Antes do saque: balance=R$ ${currentBalance.toFixed(2)}, total_earnings=R$ ${totalEarnings.toFixed(2)}`,
  )

  await sql`
    UPDATE affiliates 
    SET balance = balance - ${withdrawAmount},
        updated_at = NOW()
    WHERE id = ${affiliateId}
  `

  const newBalance = currentBalance - withdrawAmount
  console.log(
    `💰 Após o saque: balance=R$ ${newBalance.toFixed(2)}, total_earnings=R$ ${totalEarnings.toFixed(2)} (inalterado)`,
  )
  console.log(`✅ Saque processado! O gerente continua com comissão baseada em R$ ${totalEarnings.toFixed(2)}`)
}

export { sql }
