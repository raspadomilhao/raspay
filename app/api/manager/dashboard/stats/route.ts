import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("📊 API: Carregando estatísticas do dashboard do gerente")

    // Verificar token JWT
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (payload.type !== "manager") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const managerId = payload.managerId as number
    console.log(`👤 Carregando stats para gerente ID: ${managerId}`)

    // 1. Buscar dados básicos do gerente
    const [manager] = await sql`
      SELECT * FROM managers WHERE id = ${managerId}
    `

    if (!manager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    console.log(`💰 Saldo atual do gerente: R$ ${Number(manager.balance).toFixed(2)}`)

    // 2. Estatísticas dos afiliados
    const [affiliateStats] = await sql`
      SELECT 
        COUNT(*) as total_affiliates,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_affiliates,
        COALESCE(SUM(total_earnings), 0) as total_affiliate_earnings
      FROM affiliates 
      WHERE manager_id = ${managerId}
    `

    // 3. Estatísticas de indicações
    const [referralStats] = await sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END) as active_referrals,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as total_deposit_volume_managed,
        COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN 1 END) as total_deposits_managed
      FROM affiliates a
      LEFT JOIN users u ON a.id = u.affiliate_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE a.manager_id = ${managerId}
    `

    // 4. Saques pendentes
    const [withdrawStats] = await sql`
      SELECT COUNT(*) as pending_withdraws
      FROM manager_withdraws 
      WHERE manager_id = ${managerId} AND status = 'pending'
    `

    // 5. Transações do mês atual
    const [monthlyStats] = await sql`
      SELECT COUNT(*) as this_month_transactions
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN affiliates a ON u.affiliate_id = a.id
      WHERE a.manager_id = ${managerId}
      AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    // 6. Atividade recente (últimos ganhos dos afiliados)
    const recentActivity = await sql`
      SELECT 
        'affiliate_earnings' as activity_type,
        a.name as affiliate_name,
        a.total_earnings,
        a.updated_at as activity_date,
        (a.total_earnings * ${manager.commission_rate} / 100) as manager_share
      FROM affiliates a
      WHERE a.manager_id = ${managerId}
      AND a.total_earnings > 0
      ORDER BY a.updated_at DESC
      LIMIT 10
    `

    // Calcular valores
    const totalAffiliateEarnings = Number(affiliateStats.total_affiliate_earnings) || 0
    const commissionRate = Number(manager.commission_rate) || 5.0
    const currentBalance = Number(manager.balance) || 0

    const stats = {
      total_affiliates: Number(affiliateStats.total_affiliates) || 0,
      active_affiliates: Number(affiliateStats.active_affiliates) || 0,
      total_referrals: Number(referralStats.total_referrals) || 0,
      current_balance: currentBalance,
      commission_rate: commissionRate,
      pending_withdraws: Number(withdrawStats.pending_withdraws) || 0,
      total_affiliate_earnings: totalAffiliateEarnings,
      calculated_manager_earnings: currentBalance, // USAR O SALDO ATUAL EM VEZ DO CÁLCULO
      this_month_transactions: Number(monthlyStats.this_month_transactions) || 0,
      total_deposits_managed: Number(referralStats.total_deposits_managed) || 0,
      total_deposit_volume_managed: Number(referralStats.total_deposit_volume_managed) || 0,
      recent_activity: recentActivity.map((activity) => ({
        ...activity,
        total_earnings: Number(activity.total_earnings),
        manager_share: Number(activity.manager_share),
      })),
    }

    console.log("📊 Stats calculadas:", {
      current_balance: stats.current_balance,
      total_affiliate_earnings: stats.total_affiliate_earnings,
      calculated_manager_earnings: stats.calculated_manager_earnings, // Agora será igual ao current_balance
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("❌ Erro ao carregar estatísticas do gerente:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar estatísticas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
