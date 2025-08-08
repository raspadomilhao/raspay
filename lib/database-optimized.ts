import { neon } from "@neondatabase/serverless"
import { cache } from "./cache"

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

// Cache para configurações do sistema
export async function getSystemSettings() {
  const cacheKey = "system_settings"
  let settings = cache.get<any>(cacheKey)

  if (!settings) {
    const result = await sql`
      SELECT setting_key, setting_value
      FROM system_settings
    `

    settings = result.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {})

    cache.set(cacheKey, settings, 300) // Cache por 5 minutos
  }

  return settings
}

// Cache para estatísticas administrativas
export async function getAdminStats() {
  const cacheKey = "admin_stats"
  let stats = cache.get<any>(cacheKey)

  if (!stats) {
    const [result] = await sql`
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

    stats = {
      ...result,
      recent_transactions: recentTransactions,
    }

    cache.set(cacheKey, stats, 120) // Cache por 2 minutos
  }

  return stats
}

// Otimizar busca de vencedores com cache
export async function getCachedWinners() {
  const cacheKey = "recent_winners"
  let winners = cache.get<any>(cacheKey)

  if (!winners) {
    // Buscar vencedores reais das últimas 24 horas
    const realWinners = await sql`
      SELECT 
        t.id,
        u.name as user_name,
        'Raspadinha' as game_name,
        t.amount as prize_amount,
        t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'game_prize' 
        AND t.amount > 0
        AND t.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY t.created_at DESC
      LIMIT 5
    `

    // Gerar mais bots para aumentar a frequência de prêmios físicos
    const botWinners = generateBotWinners(30) // Aumentado de 20 para 30
    const specialWinners = generateSpecialWinners()

    winners = {
      real: realWinners.map((winner) => ({
        ...winner,
        is_bot: false,
        is_physical_prize: false,
        prize_image: null,
      })),
      bots: [...specialWinners, ...botWinners],
      generated_at: new Date().toISOString(),
    }

    cache.set(cacheKey, winners, 180) // Cache por 3 minutos
  }

  return winners
}

// Função otimizada para buscar perfil completo do usuário
export async function getUserProfileComplete(userId: number) {
  const cacheKey = `user_profile_${userId}`
  let profile = cache.get<any>(cacheKey)

  if (!profile) {
    const [user] = await sql`
      SELECT 
        u.*,
        w.balance,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN t.amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.id = ${userId}
      GROUP BY u.id, w.balance
    `

    if (user) {
      profile = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          phone: user.phone,
          user_type: user.user_type,
          created_at: user.created_at,
        },
        wallet: {
          balance: user.balance || 0,
        },
        stats: {
          total_transactions: user.total_transactions || 0,
          total_deposited: user.total_deposited || 0,
          total_spent: user.total_spent || 0,
        },
      }

      cache.set(cacheKey, profile, 60) // Cache por 1 minuto
    }
  }

  return profile
}

// Função para invalidar cache do usuário
export function invalidateUserCache(userId: number) {
  cache.delete(`user_profile_${userId}`)
  cache.delete(`user_deposits_${userId}`)
  cache.delete(`user_referrals_${userId}`)
}

// Função otimizada para depósitos do usuário
export async function getUserDepositsOptimized(userId: number) {
  const cacheKey = `user_deposits_${userId}`
  let deposits = cache.get<any>(cacheKey)

  if (!deposits) {
    // Data de hoje (início do dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const [stats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'success' AND external_id IS NOT NULL AND created_at >= ${todayISO} THEN amount ELSE 0 END), 0) as total_deposited_today,
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 50%' AND created_at >= ${todayISO} THEN 1 END) > 0 as bonus_50_claimed,
        COUNT(CASE WHEN description LIKE '%Bônus de depósito R$ 100%' AND created_at >= ${todayISO} THEN 1 END) > 0 as bonus_100_claimed
      FROM transactions
      WHERE user_id = ${userId} 
      AND (type = 'deposit' OR (type = 'game_prize' AND (description LIKE '%Bônus de depósito R$ 50%' OR description LIKE '%Bônus de depósito R$ 100%')))
    `

    const recentDeposits = await sql`
      SELECT *
      FROM transactions
      WHERE user_id = ${userId} AND type = 'deposit'
      ORDER BY created_at DESC
      LIMIT 20
    `

    deposits = {
      deposits: recentDeposits,
      total_deposited: Number.parseFloat(stats.total_deposited_today.toString()) || 0,
      bonus_50_claimed: stats.bonus_50_claimed || false,
      bonus_100_claimed: stats.bonus_100_claimed || false,
    }

    cache.set(cacheKey, deposits, 30) // Cache por 30 segundos
  }

  return deposits
}

// Funções originais mantidas para compatibilidade
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

  // Criar carteira com saldo inicial
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
  // Invalidar cache do usuário
  invalidateUserCache(id)

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

  // Invalidar cache do usuário
  invalidateUserCache(userId)

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
  // Invalidar cache do usuário
  invalidateUserCache(data.user_id)

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

  if (transaction) {
    // Invalidar cache do usuário
    invalidateUserCache(transaction.user_id)
  }

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
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return affiliate
}

// 🔥 NOVA LÓGICA SIMPLIFICADA: Gerente sempre tem 5% do Total Ganho do afiliado
export async function updateManagerBalanceFromAffiliate(affiliateId: number): Promise<void> {
  try {
    console.log(`🎯 Atualizando saldo do gerente baseado no afiliado ${affiliateId}...`)

    // 1. Buscar o afiliado e seu gerente
    const [affiliate] = await sql`
      SELECT a.*, m.id as manager_id, m.name as manager_name
      FROM affiliates a
      LEFT JOIN managers m ON a.manager_id = m.id
      WHERE a.id = ${affiliateId} AND m.id IS NOT NULL AND m.status = 'active'
    `

    if (!affiliate || !affiliate.manager_id) {
      console.log(`ℹ️ Afiliado ${affiliateId} não tem gerente ativo vinculado`)
      return
    }

    // 2. Calcular 5% do total_earnings do afiliado
    const affiliateTotalEarnings = toNumber(affiliate.total_earnings)
    const managerShouldHave = (affiliateTotalEarnings * 5.0) / 100

    console.log(`💰 Afiliado ${affiliate.name} tem R$ ${affiliateTotalEarnings.toFixed(2)} total ganho`)
    console.log(`💰 Gerente ${affiliate.manager_name} deve ter R$ ${managerShouldHave.toFixed(2)} (5%)`)

    // 3. Definir o saldo do gerente como exatamente 5% do total do afiliado
    await sql`
      UPDATE managers 
      SET balance = ${managerShouldHave},
          total_earnings = ${managerShouldHave},
          updated_at = NOW()
      WHERE id = ${affiliate.manager_id}
    `

    console.log(`✅ Saldo do gerente ${affiliate.manager_name} atualizado para R$ ${managerShouldHave.toFixed(2)}`)
  } catch (error) {
    console.error("❌ Erro ao atualizar saldo do gerente:", error)
    throw error
  }
}

export async function createAffiliateCommission(data: {
  affiliate_id: number
  user_id: number
  transaction_id: number
  commission_amount: number
  commission_type?: "deposit" | "loss_gain" | "loss_penalty"
}): Promise<AffiliateCommission> {
  const [commission] = await sql`
    INSERT INTO affiliate_commissions (affiliate_id, user_id, transaction_id, commission_amount, commission_type)
    VALUES (${data.affiliate_id}, ${data.user_id}, ${data.transaction_id}, ${data.commission_amount}, ${data.commission_type || "deposit"})
    RETURNING *
  `

  // Atualizar total_earnings E balance do afiliado
  await sql`
    UPDATE affiliates 
    SET total_earnings = total_earnings + ${data.commission_amount},
        balance = COALESCE(balance, 0) + ${data.commission_amount},
        updated_at = NOW()
    WHERE id = ${data.affiliate_id}
  `

  console.log(`💰 Saldo do afiliado ${data.affiliate_id} atualizado: +R$ ${data.commission_amount.toFixed(2)}`)

  // 🔥 NOVA LÓGICA: Atualizar saldo do gerente baseado no total ganho do afiliado
  await updateManagerBalanceFromAffiliate(data.affiliate_id)

  return commission
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

// Prêmios específicos do gameContentDisplay de cada jogo
const gameContentDisplayPrizes = [
  // Raspe da Esperança
  { name: "R$ 2,00", value: 2, image: "/images/2reais.png", game: "Raspe da Esperança" },
  { name: "R$ 5,00", value: 5, image: "/images/5reais.png", game: "Raspe da Esperança" },
  { name: "R$ 10,00", value: 10, image: "/images/10reais.png", game: "Raspe da Esperança" },
  { name: "R$ 20,00", value: 20, image: "/images/20reais.png", game: "Raspe da Esperança" },
  { name: "R$ 50,00", value: 50, image: "/images/50reais.png", game: "Raspe da Esperança" },
  { name: "R$ 100,00", value: 100, image: "/images/100reais.png", game: "Raspe da Esperança" },
  { name: "R$ 200,00", value: 200, image: "/images/200reais.png", game: "Raspe da Esperança" },
  { name: "R$ 500,00", value: 500, image: "/images/500reais.png", game: "Raspe da Esperança" },
  { name: "R$ 1.000,00", value: 1000, image: "/images/1mil.png", game: "Raspe da Esperança" },
  { name: "R$ 2.000,00", value: 2000, image: "/images/2mil.png", game: "Raspe da Esperança" },
  { name: "R$ 5.000,00", value: 5000, image: "/images/5mil.png", game: "Raspe da Esperança" },
  { name: "R$ 10.000,00", value: 10000, image: "/images/10mil.png", game: "Raspe da Esperança" },
  { name: "R$ 25.000,00", value: 25000, image: "/images/25mil.png", game: "Raspe da Esperança" },

  // Fortuna Dourada
  { name: "R$ 5,00", value: 5, image: "/images/memimei5.webp", game: "Fortuna Dourada" },
  { name: "R$ 10,00", value: 10, image: "/images/memimei10.webp", game: "Fortuna Dourada" },
  { name: "R$ 20,00", value: 20, image: "/images/memimei20.webp", game: "Fortuna Dourada" },
  { name: "R$ 25,00", value: 25, image: "/images/memimei25.webp", game: "Fortuna Dourada" },
  { name: "R$ 30,00", value: 30, image: "/images/memimei30.webp", game: "Fortuna Dourada" },
  { name: "R$ 50,00", value: 50, image: "/images/memimei50.webp", game: "Fortuna Dourada" },
  { name: "R$ 200,00", value: 200, image: "/images/memimei200.webp", game: "Fortuna Dourada" },
  { name: "R$ 400,00", value: 400, image: "/images/memimei400.webp", game: "Fortuna Dourada" },
  { name: "R$ 500,00", value: 500, image: "/images/memimei500.webp", game: "Fortuna Dourada" },
  { name: "R$ 1.000,00", value: 1000, image: "/images/memimei1000.webp", game: "Fortuna Dourada" },

  // Mega Sorte
  { name: "R$ 50,00", value: 50, image: "/images/eletro50.png", game: "Mega Sorte" },
  { name: "R$ 70,00", value: 70, image: "/images/eletro70.webp", game: "Mega Sorte" },
  { name: "R$ 80,00", value: 80, image: "/images/eletro80.png", game: "Mega Sorte" },
  { name: "R$ 90,00", value: 90, image: "/images/eletro90.webp", game: "Mega Sorte" },
  { name: "R$ 110,00", value: 110, image: "/images/eletro110.png", game: "Mega Sorte" },
  { name: "R$ 130,00", value: 130, image: "/images/eletro130.png", game: "Mega Sorte" },
  { name: "R$ 260,00", value: 260, image: "/images/eletro260.png", game: "Mega Sorte" },
  { name: "R$ 450,00", value: 450, image: "/images/eletro450.webp", game: "Mega Sorte" },
  { name: "R$ 500,00", value: 500, image: "/images/eletro500.png", game: "Mega Sorte" },
  { name: "R$ 1.500,00", value: 1500, image: "/images/eletro1500.png", game: "Mega Sorte" },
  { name: "R$ 2.000,00", value: 2000, image: "/images/eletro2000.png", game: "Mega Sorte" },
  { name: "R$ 2.500,00", value: 2500, image: "/images/eletro2500.png", game: "Mega Sorte" },
  { name: "R$ 4.000,00", value: 4000, image: "/images/eletro4000.png", game: "Mega Sorte" },

  // Sonho de Consumo
  { name: "R$ 5,00", value: 5, image: "/images/sonhodeconsumo5.webp", game: "Sonho de Consumo" },
  { name: "R$ 10,00", value: 10, image: "/images/sonhodeconsumo10.webp", game: "Sonho de Consumo" },
  { name: "R$ 15,00", value: 15, image: "/images/sonhodeconsumo15.webp", game: "Sonho de Consumo" },
  { name: "R$ 20,00", value: 20, image: "/images/sonhodeconsumo20.webp", game: "Sonho de Consumo" },
  { name: "R$ 35,00", value: 35, image: "/images/sonhodeconsumo35.webp", game: "Sonho de Consumo" },
  { name: "R$ 50,00", value: 50, image: "/images/sonhodeconsumo50.webp", game: "Sonho de Consumo" },
  { name: "R$ 80,00", value: 80, image: "/images/sonhodeconsumo80.webp", game: "Sonho de Consumo" },
  { name: "R$ 150,00", value: 150, image: "/images/sonhodeconsumo150.webp", game: "Sonho de Consumo" },
  { name: "R$ 400,00", value: 400, image: "/images/sonhodeconsumo400.webp", game: "Sonho de Consumo" },
  { name: "R$ 700,00", value: 700, image: "/images/sonhodeconsumo700.webp", game: "Sonho de Consumo" },
  { name: "R$ 900,00", value: 900, image: "/images/sonhodeconsumo900.webp", game: "Sonho de Consumo" },
  { name: "R$ 1.500,00", value: 1500, image: "/images/sonhodeconsumo1500.webp", game: "Sonho de Consumo" },
  { name: "R$ 2.000,00", value: 2000, image: "/images/sonhodeconsumo2000.webp", game: "Sonho de Consumo" },
  { name: "R$ 2.500,00", value: 2500, image: "/images/sonhodeconsumo2500.webp", game: "Sonho de Consumo" },
  { name: "R$ 3.000,00", value: 3000, image: "/images/sonhodeconsumo3000.webp", game: "Sonho de Consumo" },
  { name: "R$ 5.000,00", value: 5000, image: "/images/sonhodeconsumo5000.webp", game: "Sonho de Consumo" },

  // Super Prêmios
  { name: "R$ 5,00", value: 5, image: "/images/superpremio5.webp", game: "Super Prêmios" },
  { name: "R$ 25,00", value: 25, image: "/images/superpremio25.webp", game: "Super Prêmios" },
  { name: "R$ 40,00", value: 40, image: "/images/superpremio40.webp", game: "Super Prêmios" },
  { name: "R$ 150,00", value: 150, image: "/images/superpremio150.webp", game: "Super Prêmios" },
  { name: "R$ 300,00", value: 300, image: "/images/superpremio300.webp", game: "Super Prêmios" },
  { name: "R$ 700,00", value: 700, image: "/images/superpremio700.webp", game: "Super Prêmios" },
  { name: "R$ 1.000,00", value: 1000, image: "/images/superpremio1000.webp", game: "Super Prêmios" },
  { name: "R$ 1.500,00", value: 1500, image: "/images/superpremio1500.webp", game: "Super Prêmios" },
  { name: "R$ 10.000,00", value: 10000, image: "/images/superpremio10000.webp", game: "Super Prêmios" },
  { name: "Moto", value: 10000, image: "/images/superpremio10000bike.webp", game: "Super Prêmios", is_physical_prize: true },
  { name: "R$ 20.000,00", value: 20000, image: "/images/superpremio20000.webp", game: "Super Prêmios" },

  // Outfit
  { name: "R$ 25,00", value: 25, image: "/images/out25.png", game: "Outfit" },
  { name: "R$ 50,00", value: 50, image: "/images/out50.webp", game: "Outfit" },
  { name: "R$ 100,00", value: 100, image: "/images/out100.webp", game: "Outfit" },
  { name: "R$ 200,00", value: 200, image: "/images/out200.webp", game: "Outfit" },
  { name: "R$ 250,00", value: 250, image: "/images/out250.webp", game: "Outfit" },
  { name: "R$ 280,00", value: 280, image: "/images/out280.webp", game: "Outfit" },
  { name: "R$ 300,00", value: 300, image: "/images/out300.png", game: "Outfit" },
  { name: "R$ 350,00", value: 350, image: "/images/out350.png", game: "Outfit" },
  { name: "R$ 400,00", value: 400, image: "/images/out400.webp", game: "Outfit" },
  { name: "R$ 600,00", value: 600, image: "/images/out600.webp", game: "Outfit" },
  { name: "R$ 1.000,00", value: 1000, image: "/images/out1000.png", game: "Outfit" },
  { name: "R$ 1.500,00", value: 1500, image: "/images/out1500.webp", game: "Outfit" },
  { name: "R$ 3.500,00", value: 3500, image: "/images/out3500.webp", game: "Outfit" },
  { name: "R$ 12.000,00", value: 12000, image: "/images/out12000.webp", game: "Outfit" },
  { name: "R$ 20.000,00", value: 20000, image: "/images/out20000.webp", game: "Outfit" },
  { name: "R$ 80.000,00", value: 80000, image: "/images/out80000.webp", game: "Outfit" },
]

const botNames = [
  "Carlos M.",
  "Ana S.",
  "Pedro L.",
  "Julia R.",
  "Roberto K.",
  "Maria F.",
  "João P.",
  "Fernanda C.",
  "Ricardo T.",
  "Camila B.",
  "Bruno H.",
  "Larissa M.",
  "Diego A.",
  "Patrícia V.",
  "Marcos L.",
  "Beatriz O.",
  "Rafael N.",
  "Gabriela S.",
  "Lucas E.",
  "Amanda R.",
  "Thiago M.",
  "Juliana P.",
  "Felipe G.",
  "Carla D.",
  "André W.",
  "Renata L.",
  "Gustavo F.",
  "Priscila B.",
  "Rodrigo C.",
  "Vanessa T.",
  "Daniel K.",
  "Tatiana M.",
  "Leandro S.",
  "Cristina A.",
  "Fábio R.",
  "Mônica H.",
  "Vinicius L.",
  "Simone P.",
  "Eduardo N.",
  "Adriana G.",
  "Marcelo D.",
  "Luciana F.",
  "Alessandro B.",
  "Karina S.",
  "Henrique M.",
  "Débora R.",
  "William T.",
  "Eliane C.",
  "Matheus A.",
  "Silvia L.",
]

const cities = [
  "São Paulo - SP",
  "Rio de Janeiro - RJ",
  "Belo Horizonte - MG",
  "Salvador - BA",
  "Brasília - DF",
  "Fortaleza - CE",
  "Curitiba - PR",
  "Recife - PE",
  "Porto Alegre - RS",
  "Manaus - AM",
  "Belém - PA",
  "Goiânia - GO",
  "Guarulhos - SP",
  "Campinas - SP",
  "São Luís - MA",
  "São Gonçalo - RJ",
  "Maceió - AL",
  "Duque de Caxias - RJ",
  "Natal - RN",
  "Teresina - PI",
]

function generateBotWinners(count: number) {
  const bots = []
  const usedNames = new Set()

  for (let i = 0; i < count; i++) {
    let name
    do {
      name = botNames[Math.floor(Math.random() * botNames.length)]
    } while (usedNames.has(name) && usedNames.size < botNames.length)

    usedNames.add(name)

    // Selecionar um prêmio aleatório do gameContentDisplayPrizes
    const randomPrizeIndex = Math.floor(Math.random() * gameContentDisplayPrizes.length)
    const selectedPrize = gameContentDisplayPrizes[randomPrizeIndex]

    const prize = selectedPrize.value
    const prizeName = selectedPrize.name
    const prizeImage = selectedPrize.image
    const gameName = selectedPrize.game
    const isPhysicalPrize = selectedPrize.is_physical_prize || false; // Adiciona a propriedade is_physical_prize

    const minutesAgo = Math.floor(Math.random() * 180) + 0.5
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    const city = Math.random() < 0.3 ? cities[Math.floor(Math.random() * cities.length)] : null

    bots.push({
      id: `bot_${Date.now()}_${i}`,
      user_name: name,
      game_name: gameName,
      prize_amount: prize,
      prize_name: prizeName,
      prize_image: prizeImage,
      created_at: timestamp.toISOString(),
      is_bot: true,
      city: city,
      is_physical_prize: isPhysicalPrize, // Usar a propriedade do objeto de prêmio
    })
  }

  return bots
}

function generateSpecialWinners() {
  const specialWinners = []

  // 40% chance de ter um prêmio especial recente
  if (Math.random() < 0.4) {
    // Filtrar prêmios de alto valor do gameContentDisplayPrizes
    const highValuePrizes = gameContentDisplayPrizes.filter(p => p.value >= 5000)

    if (highValuePrizes.length > 0) {
      const name = botNames[Math.floor(Math.random() * botNames.length)]
      const specialPrize = highValuePrizes[Math.floor(Math.random() * highValuePrizes.length)]

      // Prêmio especial entre 5 minutos e 2 horas atrás
      const minutesAgo = Math.floor(Math.random() * 115) + 5
      const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

      specialWinners.push({
        id: `special_${Date.now()}`,
        user_name: name,
        game_name: specialPrize.game,
        prize_amount: specialPrize.value,
        prize_name: specialPrize.name,
        prize_image: specialPrize.image,
        created_at: timestamp.toISOString(),
        is_bot: true,
        is_physical_prize: specialPrize.is_physical_prize || false, // Usar a propriedade do objeto de prêmio
        is_special: true,
      })
    }
  }

  return specialWinners
}

export { sql }
