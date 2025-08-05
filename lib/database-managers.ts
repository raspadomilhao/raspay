import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function getAllManagers() {
  try {
    console.log("🔍 Buscando todos os gerentes...")

    const managers = await sql`
      SELECT 
        m.id,
        m.name,
        m.email,
        m.username,
        m.commission_rate,
        m.balance,
        m.status,
        m.created_at,
        COALESCE(SUM(mc.amount), 0) as total_earnings,
        COUNT(DISTINCT a.id) as total_affiliates,
        COUNT(DISTINCT u.id) as total_referrals_managed,
        COALESCE(SUM(t.amount), 0) as total_deposit_volume
      FROM managers m
      LEFT JOIN manager_commissions mc ON m.id = mc.manager_id
      LEFT JOIN affiliates a ON m.id = a.manager_id
      LEFT JOIN users u ON a.id = u.referred_by_affiliate_id
      LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'deposit' AND t.status = 'success'
      GROUP BY m.id, m.name, m.email, m.username, m.commission_rate, m.balance, m.status, m.created_at
      ORDER BY m.created_at DESC
    `

    console.log(`✅ Encontrados ${managers.length} gerentes`)

    return managers.map((manager) => ({
      ...manager,
      total_earnings: Number(manager.total_earnings) || 0,
      balance: Number(manager.balance) || 0,
      commission_rate: Number(manager.commission_rate) || 0,
      total_affiliates: Number(manager.total_affiliates) || 0,
      total_referrals_managed: Number(manager.total_referrals_managed) || 0,
      total_deposit_volume: Number(manager.total_deposit_volume) || 0,
    }))
  } catch (error) {
    console.error("❌ Erro ao buscar gerentes:", error)
    throw error
  }
}

export async function getAllManagerWithdraws() {
  try {
    console.log("🔍 Buscando todos os saques de gerentes...")

    const withdraws = await sql`
      SELECT 
        mw.id,
        mw.manager_id,
        mw.amount,
        mw.pix_key,
        mw.pix_type,
        mw.status,
        mw.admin_notes,
        mw.created_at,
        mw.processed_at,
        m.name as manager_name,
        m.email as manager_email,
        m.username as manager_username
      FROM manager_withdraws mw
      JOIN managers m ON mw.manager_id = m.id
      ORDER BY mw.created_at DESC
    `

    console.log(`✅ Encontrados ${withdraws.length} saques de gerentes`)

    return withdraws.map((withdraw) => ({
      ...withdraw,
      amount: Number(withdraw.amount) || 0,
    }))
  } catch (error) {
    console.error("❌ Erro ao buscar saques de gerentes:", error)
    throw error
  }
}

export async function processManagerWithdraw(withdrawId: number, action: "approve" | "reject", adminNotes?: string) {
  try {
    console.log(`🔄 Processando saque de gerente ${withdrawId} com ação: ${action}`)

    if (action === "approve") {
      // Aprovar saque
      await sql`
        UPDATE manager_withdraws 
        SET 
          status = 'approved',
          admin_notes = ${adminNotes || ""},
          processed_at = NOW()
        WHERE id = ${withdrawId}
      `
      console.log(`✅ Saque ${withdrawId} aprovado`)
    } else {
      // Rejeitar saque - devolver o valor ao saldo do gerente
      const withdraw = await sql`
        SELECT manager_id, amount 
        FROM manager_withdraws 
        WHERE id = ${withdrawId}
      `

      if (withdraw.length > 0) {
        const { manager_id, amount } = withdraw[0]

        // Devolver o valor ao saldo do gerente
        await sql`
          UPDATE managers 
          SET balance = balance + ${amount}
          WHERE id = ${manager_id}
        `

        // Atualizar status do saque
        await sql`
          UPDATE manager_withdraws 
          SET 
            status = 'rejected',
            admin_notes = ${adminNotes || ""},
            processed_at = NOW()
          WHERE id = ${withdrawId}
        `

        console.log(`✅ Saque ${withdrawId} rejeitado e valor R$ ${amount} devolvido ao gerente ${manager_id}`)
      }
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao processar saque ${withdrawId}:`, error)
    return false
  }
}
