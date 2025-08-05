import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Manager {
  id: number
  name: string
  email: string
  username: string
  password_hash: string
  commission_rate: string | number
  total_earnings: string | number
  balance: string | number
  status: string
  created_at: string
  updated_at: string
  total_affiliates?: number
  total_referrals_managed?: number
}

export interface ManagerCommission {
  id: number
  manager_id: number
  affiliate_id: number
  commission_amount: string | number
  commission_type: string
  description?: string
  status: string
  created_at: string
  paid_at?: string
}

export interface ManagerWithdraw {
  id: number
  manager_id: number
  amount: string | number
  pix_key: string
  pix_type: string
  status: string
  admin_notes?: string
  created_at: string
  processed_at?: string
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

export async function createManager(data: {
  name: string
  email: string
  username: string
  password_hash: string
  commission_rate?: number
}): Promise<Manager> {
  const [manager] = await sql`
    INSERT INTO managers (name, email, username, password_hash, commission_rate, balance)
    VALUES (${data.name}, ${data.email.toLowerCase()}, ${data.username.toLowerCase()}, ${data.password_hash}, ${data.commission_rate || 5.0}, 0.00)
    RETURNING *
  `
  return manager
}

export async function getManagerByEmail(email: string): Promise<Manager | null> {
  const [manager] = await sql`
    SELECT * FROM managers WHERE LOWER(email) = LOWER(${email})
  `
  return manager || null
}

export async function getManagerByUsername(username: string): Promise<Manager | null> {
  const [manager] = await sql`
    SELECT * FROM managers WHERE LOWER(username) = LOWER(${username})
  `
  return manager || null
}

export async function getManagerById(id: number): Promise<Manager | null> {
  const [manager] = await sql`
    SELECT * FROM managers WHERE id = ${id}
  `
  return manager || null
}

export async function getAllManagers(): Promise<Manager[]> {
  const managers = await sql`
    SELECT 
      m.*,
      COUNT(DISTINCT a.id) as total_affiliates,
      COUNT(DISTINCT u.id) as total_referrals_managed
    FROM managers m
    LEFT JOIN affiliates a ON m.id = a.manager_id
    LEFT JOIN users u ON a.id = u.affiliate_id
    GROUP BY m.id, m.name, m.email, m.username, m.password_hash, m.commission_rate, m.total_earnings, m.balance, m.status, m.created_at, m.updated_at
    ORDER BY m.created_at DESC
  `
  return managers
}

export async function updateManager(id: number, data: Partial<Manager>): Promise<Manager> {
  const [manager] = await sql`
    UPDATE managers 
    SET name = COALESCE(${data.name}, name),
        email = COALESCE(${data.email}, email),
        username = COALESCE(${data.username}, username),
        commission_rate = COALESCE(${data.commission_rate}, commission_rate),
        status = COALESCE(${data.status}, status),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return manager
}

export async function deleteManager(id: number): Promise<boolean> {
  try {
    // Primeiro, remover a associação dos afiliados
    await sql`
      UPDATE affiliates 
      SET manager_id = NULL, updated_at = NOW()
      WHERE manager_id = ${id}
    `

    // Depois, excluir o gerente
    const [result] = await sql`
      DELETE FROM managers WHERE id = ${id}
      RETURNING id
    `

    return !!result
  } catch (error) {
    console.error("Erro ao excluir gerente:", error)
    return false
  }
}

export async function createManagerCommission(data: {
  manager_id: number
  affiliate_id: number
  commission_amount: number
  commission_type?: string
  description?: string
}): Promise<ManagerCommission> {
  console.log(`💰 Criando comissão do gerente ${data.manager_id}: +R$ ${data.commission_amount.toFixed(2)}`)

  // 1. Criar o registro da comissão
  const [commission] = await sql`
    INSERT INTO manager_commissions (manager_id, affiliate_id, commission_amount, commission_type, description)
    VALUES (${data.manager_id}, ${data.affiliate_id}, ${data.commission_amount}, ${data.commission_type || "game_result"}, ${data.description || null})
    RETURNING *
  `

  // 2. ✅ SISTEMA INCREMENTAL: Apenas somar a nova comissão ao saldo atual
  const [updatedManager] = await sql`
    UPDATE managers 
    SET balance = balance + ${data.commission_amount},
        total_earnings = total_earnings + ${data.commission_amount},
        updated_at = NOW()
    WHERE id = ${data.manager_id}
    RETURNING balance, total_earnings
  `

  const newBalance = Number(updatedManager.balance)
  const newTotalEarnings = Number(updatedManager.total_earnings)

  console.log(`✅ Comissão adicionada ao gerente ${data.manager_id}:`)
  console.log(`   • Nova comissão: +R$ ${data.commission_amount.toFixed(2)}`)
  console.log(`   • Saldo atual: R$ ${newBalance.toFixed(2)}`)
  console.log(`   • Total histórico: R$ ${newTotalEarnings.toFixed(2)}`)

  return commission
}

export async function getManagerCommissions(managerId: number, limit = 50): Promise<ManagerCommission[]> {
  const commissions = await sql`
    SELECT 
      mc.*,
      a.name as affiliate_name,
      a.affiliate_code,
      u.name as user_name,
      u.email as user_email
    FROM manager_commissions mc
    JOIN affiliates a ON mc.affiliate_id = a.id
    LEFT JOIN users u ON a.id = u.affiliate_id
    WHERE mc.manager_id = ${managerId}
    ORDER BY mc.created_at DESC
    LIMIT ${limit}
  `
  return commissions
}

export async function getManagerStats(managerId: number) {
  const [stats] = await sql`
    SELECT 
      COUNT(DISTINCT a.id) as total_affiliates,
      COUNT(DISTINCT u.id) as total_referrals,
      COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END) as active_referrals,
      COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN 1 END) as total_deposits,
      COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposit_volume,
      COALESCE(SUM(mc.commission_amount), 0) as total_commissions,
      COUNT(CASE WHEN mc.status = 'pending' THEN 1 END) as pending_commissions,
      COUNT(CASE WHEN mc.status = 'paid' THEN 1 END) as paid_commissions
    FROM affiliates a
    LEFT JOIN users u ON a.id = u.affiliate_id
    LEFT JOIN transactions t ON u.id = t.user_id
    LEFT JOIN manager_commissions mc ON a.id = mc.affiliate_id AND mc.manager_id = ${managerId}
    WHERE a.manager_id = ${managerId}
  `

  const recentCommissions = await sql`
    SELECT 
      mc.*,
      a.name as affiliate_name,
      a.affiliate_code,
      u.name as user_name,
      u.email as user_email
    FROM manager_commissions mc
    JOIN affiliates a ON mc.affiliate_id = a.id
    LEFT JOIN users u ON a.id = u.affiliate_id
    WHERE mc.manager_id = ${managerId}
    ORDER BY mc.created_at DESC
    LIMIT 10
  `

  return {
    ...stats,
    recent_commissions: recentCommissions,
  }
}

// 🎯 FUNÇÃO CORRIGIDA: Processar comissão do gerente baseada nas comissões dos afiliados
export async function processManagerGameCommission(
  userId: number,
  transactionId: number,
  netAmount: number,
): Promise<void> {
  try {
    console.log(`🎯 Processando comissão do gerente para usuário ${userId}...`)

    // 1. Buscar o usuário e seu afiliado
    const [userWithAffiliate] = await sql`
      SELECT u.*, a.id as affiliate_id, a.name as affiliate_name, a.manager_id
      FROM users u
      JOIN affiliates a ON u.affiliate_id = a.id
      WHERE u.id = ${userId} AND a.manager_id IS NOT NULL
    `

    if (!userWithAffiliate || !userWithAffiliate.manager_id) {
      console.log(`👤 Usuário ${userId} não tem gerente vinculado através do afiliado`)
      return
    }

    // 2. Buscar o gerente
    const manager = await getManagerById(userWithAffiliate.manager_id)
    if (!manager || manager.status !== "active") {
      console.log(`❌ Gerente ${userWithAffiliate.manager_id} não encontrado ou inativo`)
      return
    }

    // 3. Buscar a comissão do afiliado para esta transação
    const [affiliateCommission] = await sql`
      SELECT * FROM affiliate_commissions 
      WHERE affiliate_id = ${userWithAffiliate.affiliate_id} 
      AND transaction_id = ${transactionId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!affiliateCommission) {
      console.log(`ℹ️ Nenhuma comissão de afiliado encontrada para transação ${transactionId}`)
      return
    }

    console.log(`💰 Comissão do afiliado encontrada: R$ ${Number(affiliateCommission.commission_amount).toFixed(2)}`)

    // 4. Verificar se já existe comissão para esta transação (evitar duplicação)
    const [existingCommission] = await sql`
      SELECT id FROM manager_commissions 
      WHERE affiliate_id = ${userWithAffiliate.affiliate_id} 
      AND description LIKE '%transaction_${transactionId}%'
    `

    if (existingCommission) {
      console.log(`⚠️ Comissão de gerente já existe para transação ${transactionId}. Ignorando.`)
      return
    }

    // 5. Calcular 5% APENAS da comissão específica desta transação (não do total)
    const affiliateCommissionAmount = Number(affiliateCommission.commission_amount)
    const managerCommissionRate = Number(manager.commission_rate) || 5.0
    const managerCommissionAmount = (affiliateCommissionAmount * managerCommissionRate) / 100

    if (Math.abs(managerCommissionAmount) < 0.01) {
      console.log(`ℹ️ Comissão de gerente muito baixa (R$ ${managerCommissionAmount.toFixed(4)}) - ignorando`)
      return
    }

    const description = `${managerCommissionRate}% da comissão do afiliado ${userWithAffiliate.affiliate_name} (R$ ${affiliateCommissionAmount.toFixed(2)}) - transaction_${transactionId}`

    console.log(
      `💰 Gerente ${manager.name} receberá ${managerCommissionRate}% da comissão DESTA transação: R$ ${managerCommissionAmount.toFixed(2)}`,
    )
    console.log(`   • Comissão do afiliado nesta transação: R$ ${affiliateCommissionAmount.toFixed(2)}`)
    console.log(`   • Taxa do gerente: ${managerCommissionRate}%`)
    console.log(`   • Comissão do gerente: R$ ${managerCommissionAmount.toFixed(2)}`)

    // 6. Criar comissão do gerente (agora com sistema incremental)
    await createManagerCommission({
      manager_id: userWithAffiliate.manager_id,
      affiliate_id: userWithAffiliate.affiliate_id,
      commission_amount: managerCommissionAmount,
      commission_type: "affiliate_commission",
      description: description,
    })

    console.log(`✅ Comissão de gerente processada: +R$ ${managerCommissionAmount.toFixed(2)}`)
  } catch (error) {
    console.error("❌ Erro ao processar comissão do gerente:", error)
    throw error
  }
}

export async function createManagerWithdraw(data: {
  manager_id: number
  amount: number
  pix_key: string
  pix_type: string
}): Promise<ManagerWithdraw> {
  console.log(`💸 Criando saque do gerente ${data.manager_id} no valor de R$ ${data.amount.toFixed(2)}`)

  try {
    // 1. Primeiro, verificar o saldo atual do gerente
    const [currentManager] = await sql`
      SELECT balance FROM managers WHERE id = ${data.manager_id}
    `

    if (!currentManager) {
      throw new Error("Gerente não encontrado")
    }

    const currentBalance = Number(currentManager.balance)
    console.log(`💰 Saldo atual do gerente: R$ ${currentBalance.toFixed(2)}`)

    if (currentBalance < data.amount) {
      throw new Error(`Saldo insuficiente. Saldo atual: R$ ${currentBalance.toFixed(2)}`)
    }

    // 2. Criar o registro de saque
    const [withdraw] = await sql`
      INSERT INTO manager_withdraws (manager_id, amount, pix_key, pix_type, status)
      VALUES (${data.manager_id}, ${data.amount}, ${data.pix_key}, ${data.pix_type}, 'pending')
      RETURNING *
    `

    console.log(`📝 Saque criado com ID: ${withdraw.id}`)

    // 3. Debitar do saldo do gerente (mantém total_earnings intacto)
    const [updatedManager] = await sql`
      UPDATE managers 
      SET balance = balance - ${data.amount},
          updated_at = NOW()
      WHERE id = ${data.manager_id}
      RETURNING balance
    `

    const newBalance = Number(updatedManager.balance)
    console.log(`✅ Saldo atualizado: R$ ${currentBalance.toFixed(2)} → R$ ${newBalance.toFixed(2)}`)

    return withdraw
  } catch (error) {
    console.error("❌ Erro ao criar saque do gerente:", error)
    throw error
  }
}

export async function getManagerWithdraws(managerId: number, limit = 50): Promise<ManagerWithdraw[]> {
  const withdraws = await sql`
    SELECT * FROM manager_withdraws 
    WHERE manager_id = ${managerId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return withdraws
}

export async function getAllManagerWithdraws(): Promise<ManagerWithdraw[]> {
  const withdraws = await sql`
    SELECT 
      mw.*,
      m.name as manager_name,
      m.email as manager_email,
      m.username as manager_username
    FROM manager_withdraws mw
    JOIN managers m ON mw.manager_id = m.id
    ORDER BY mw.created_at DESC
  `
  return withdraws
}

export async function processManagerWithdraw(
  withdrawId: number,
  action: "approve" | "reject",
  adminNotes?: string,
): Promise<boolean> {
  try {
    console.log(`🔄 Processando saque ${withdrawId} - Ação: ${action}`)

    // Primeiro, buscar o saque para verificar se existe
    const [withdraw] = await sql`
      SELECT * FROM manager_withdraws WHERE id = ${withdrawId}
    `

    if (!withdraw) {
      console.log(`❌ Saque ${withdrawId} não encontrado`)
      return false
    }

    if (withdraw.status !== "pending") {
      console.log(`❌ Saque ${withdrawId} já foi processado (status: ${withdraw.status})`)
      return false
    }

    console.log(`📋 Saque encontrado: R$ ${Number(withdraw.amount).toFixed(2)} do gerente ${withdraw.manager_id}`)

    if (action === "approve") {
      await sql`
        UPDATE manager_withdraws 
        SET status = 'approved', 
            admin_notes = ${adminNotes || null},
            processed_at = NOW()
        WHERE id = ${withdrawId}
      `
      console.log(`✅ Saque ${withdrawId} aprovado`)
    } else {
      // Rejeitar - devolver o valor ao saldo do gerente
      console.log(`💰 Devolvendo R$ ${Number(withdraw.amount).toFixed(2)} ao gerente ${withdraw.manager_id}`)

      await sql`
        UPDATE managers 
        SET balance = balance + ${withdraw.amount},
            updated_at = NOW()
        WHERE id = ${withdraw.manager_id}
      `

      console.log(`✅ Valor devolvido ao saldo do gerente`)

      await sql`
        UPDATE manager_withdraws 
        SET status = 'rejected', 
            admin_notes = ${adminNotes || null},
            processed_at = NOW()
        WHERE id = ${withdrawId}
      `
      console.log(`❌ Saque ${withdrawId} rejeitado`)
    }

    return true
  } catch (error) {
    console.error("❌ Erro ao processar saque de gerente:", error)
    return false
  }
}

// 🎯 NOVA FUNÇÃO: Vincular afiliado ao gerente
export async function assignAffiliateToManager(affiliateId: number, managerId: number): Promise<boolean> {
  try {
    console.log(`🔗 Vinculando afiliado ${affiliateId} ao gerente ${managerId}`)

    // Verificar se o gerente existe e está ativo
    const manager = await getManagerById(managerId)
    if (!manager || manager.status !== "active") {
      console.log(`❌ Gerente ${managerId} não encontrado ou inativo`)
      return false
    }

    // Verificar se o afiliado existe
    const [affiliate] = await sql`
      SELECT id, name FROM affiliates WHERE id = ${affiliateId}
    `

    if (!affiliate) {
      console.log(`❌ Afiliado ${affiliateId} não encontrado`)
      return false
    }

    // Vincular o afiliado ao gerente
    await sql`
      UPDATE affiliates 
      SET manager_id = ${managerId}, updated_at = NOW()
      WHERE id = ${affiliateId}
    `

    console.log(`🎉 Afiliado ${affiliate.name} (${affiliateId}) vinculado ao gerente ${manager.name} (${managerId})`)
    return true
  } catch (error) {
    console.error("❌ Erro ao vincular afiliado ao gerente:", error)
    return false
  }
}

// 🎯 NOVA FUNÇÃO: Desvincular afiliado do gerente
export async function unassignAffiliateFromManager(affiliateId: number): Promise<boolean> {
  try {
    console.log(`🔗 Desvinculando afiliado ${affiliateId} do gerente`)

    await sql`
      UPDATE affiliates 
      SET manager_id = NULL, updated_at = NOW()
      WHERE id = ${affiliateId}
    `

    console.log(`🎉 Afiliado ${affiliateId} desvinculado com sucesso`)
    return true
  } catch (error) {
    console.error("❌ Erro ao desvincular afiliado do gerente:", error)
    return false
  }
}

export { sql }
