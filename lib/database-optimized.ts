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

// Funções para gerar bots (atualizadas com novos prêmios físicos)
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

const gameNames = ["Raspe da Esperança", "Fortuna Dourada", "Mega Sorte"]

const prizes = {
  "Raspe da Esperança": [2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000],
  "Fortuna Dourada": [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000],
  "Mega Sorte": [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 7500, 10000],
}

// Prêmios físicos com imagens específicas e chances MUITO aumentadas
const physicalPrizes = [
  {
    name: "Smartwatch",
    value: 800,
    rarity: 0.25, // 25% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
  },
  {
    name: "JBL Bluetooth",
    value: 400,
    rarity: 0.3, // 30% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
  },
  {
    name: "PlayStation 5",
    value: 3500,
    rarity: 0.15, // 15% chance - FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
  },
  {
    name: "Cadeira Gamer",
    value: 1200,
    rarity: 0.2, // 20% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
  },
  {
    name: "Redmi Note 14C",
    value: 900,
    rarity: 0.22, // 22% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
  },
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

    const game = gameNames[Math.floor(Math.random() * gameNames.length)]

    // 🔥 NOVA LÓGICA: 70% chance de prêmio físico (MUITO MAIS FREQUENTE)
    let prize
    let prizeType = "monetary"
    let prizeName = null
    let prizeImage = null

    // Chance MUITO ALTA de prêmio físico
    const physicalPrizeRoll = Math.random()
    let wonPhysicalPrize = false

    if (physicalPrizeRoll < 0.7) {
      // 70% chance de prêmio físico
      // Ordenar prêmios por raridade (do mais comum para o menos comum)
      const sortedPhysicalPrizes = [...physicalPrizes].sort((a, b) => b.rarity - a.rarity)

      for (const physicalPrize of sortedPhysicalPrizes) {
        if (Math.random() < physicalPrize.rarity) {
          prize = physicalPrize.value
          prizeName = physicalPrize.name
          prizeImage = physicalPrize.image
          prizeType = "physical"
          wonPhysicalPrize = true
          break
        }
      }
    }

    // Se não ganhou prêmio físico, usar prêmio monetário normal (30% dos casos)
    if (!wonPhysicalPrize) {
      const gamePrizes = prizes[game as keyof typeof prizes]

      // Prêmios menores são mais comuns (80% chance), prêmios maiores são mais raros (20% chance)
      if (Math.random() < 0.8) {
        // 80% chance de prêmio pequeno/médio (primeiros 60% da lista)
        const smallPrizes = gamePrizes.slice(0, Math.ceil(gamePrizes.length * 0.6))
        prize = smallPrizes[Math.floor(Math.random() * smallPrizes.length)]
      } else {
        // 20% chance de prêmio grande (últimos 40% da lista)
        const bigPrizes = gamePrizes.slice(Math.ceil(gamePrizes.length * 0.6))
        prize = bigPrizes[Math.floor(Math.random() * bigPrizes.length)]
      }
    }

    const minutesAgo = Math.floor(Math.random() * 180) + 0.5
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    const city = Math.random() < 0.3 ? cities[Math.floor(Math.random() * cities.length)] : null

    bots.push({
      id: `bot_${Date.now()}_${i}`,
      user_name: name,
      game_name: game,
      prize_amount: prize,
      prize_name: prizeName,
      prize_image: prizeImage,
      created_at: timestamp.toISOString(),
      is_bot: true,
      city: city,
      is_physical_prize: prizeType === "physical",
    })
  }

  return bots
}

function generateSpecialWinners() {
  const specialWinners = []

  // 40% chance de ter um prêmio físico especial recente (AUMENTADO)
  if (Math.random() < 0.4) {
    const specialPhysicalPrizes = [
      {
        name: "PlayStation 5",
        value: 3500,
        image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
      },
      {
        name: "Smartwatch Premium",
        value: 1200,
        image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
      },
      {
        name: "JBL Premium",
        value: 600,
        image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
      },
      {
        name: "Cadeira Gamer Pro",
        value: 1800,
        image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
      },
      {
        name: "Redmi Note 14C Pro",
        value: 1200,
        image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
      },
    ]

    const name = botNames[Math.floor(Math.random() * botNames.length)]
    const game = gameNames[Math.floor(Math.random() * gameNames.length)]
    const physicalPrize = specialPhysicalPrizes[Math.floor(Math.random() * specialPhysicalPrizes.length)]

    // Prêmio físico entre 5 minutos e 2 horas atrás (mais recente)
    const minutesAgo = Math.floor(Math.random() * 115) + 5
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    specialWinners.push({
      id: `physical_special_${Date.now()}`,
      user_name: name,
      game_name: game,
      prize_amount: physicalPrize.value,
      prize_name: physicalPrize.name,
      prize_image: physicalPrize.image,
      created_at: timestamp.toISOString(),
      is_bot: true,
      is_physical_prize: true,
      is_special_physical: true,
    })
  }

  // 10% chance de ter um jackpot recente
  if (Math.random() < 0.1) {
    const jackpotPrizes = [5000, 7500, 10000, 15000, 20000]
    const jackpotGames = ["Mega Sorte", "Fortuna Dourada"]

    const name = botNames[Math.floor(Math.random() * botNames.length)]
    const game = jackpotGames[Math.floor(Math.random() * jackpotGames.length)]
    const prize = jackpotPrizes[Math.floor(Math.random() * jackpotPrizes.length)]

    const minutesAgo = Math.floor(Math.random() * 110) + 10
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    specialWinners.push({
      id: `jackpot_${Date.now()}`,
      user_name: name,
      game_name: game,
      prize_amount: prize,
      prize_name: null,
      prize_image: null,
      created_at: timestamp.toISOString(),
      is_bot: true,
      is_jackpot: true,
      is_physical_prize: false,
    })
  }

  return specialWinners
}

export { sql }
