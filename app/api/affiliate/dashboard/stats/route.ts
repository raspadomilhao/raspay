import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Carregando estatísticas do dashboard do afiliado...")

    // Verificar token no header Authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token não encontrado no header")
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Verificar e decodificar token
    let payload: any
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secret)
      payload = jwtPayload
      console.log("✅ Token válido para afiliado:", payload.affiliateId)
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    const affiliateId = Number(payload.affiliateId)
    console.log("🔍 Buscando dados para afiliado ID:", affiliateId)

    // Verificar se o afiliado existe e está ativo
    const affiliateResult = await sql`
      SELECT 
        id, 
        name, 
        email, 
        username, 
        affiliate_code, 
        commission_rate, 
        loss_commission_rate,
        total_earnings,
        balance,
        total_referrals,
        status
      FROM affiliates 
      WHERE id = ${affiliateId} AND status = 'active'
    `

    if (affiliateResult.length === 0) {
      console.log("❌ Afiliado não encontrado ou inativo")
      return NextResponse.json({ success: false, error: "Afiliado não encontrado" }, { status: 404 })
    }

    const affiliate = affiliateResult[0]
    console.log("✅ Afiliado encontrado:", affiliate.name)

    // Adicionar link de afiliado
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    affiliate.affiliate_link = `${baseUrl}/auth?ref=${affiliate.affiliate_code}`

    // Buscar estatísticas dos referidos (sem last_login)
    const referralStatsResult = await sql`
      SELECT 
        COUNT(*)::integer as total_referrals,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::integer as active_referrals
      FROM users 
      WHERE affiliate_id = ${affiliateId}
    `

    const referralStats = referralStatsResult[0] || { total_referrals: 0, active_referrals: 0 }
    console.log("📊 Estatísticas de referidos:", referralStats)

    // Buscar estatísticas de DEPÓSITOS PIX REAIS (não jogadas)
    const depositStatsResult = await sql`
      SELECT 
        COUNT(*)::integer as total_real_deposits,
        COALESCE(SUM(t.amount), 0)::numeric as total_deposit_volume
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type = 'deposit'
        AND t.status = 'success'
        AND t.external_id IS NOT NULL
        AND COALESCE(t.is_demo, false) = false
    `

    const depositStats = depositStatsResult[0] || { total_real_deposits: 0, total_deposit_volume: 0 }
    console.log("💰 Estatísticas de depósitos PIX reais:", depositStats)

    // Buscar estatísticas de jogos (separado dos depósitos)
    const gameStatsResult = await sql`
      SELECT 
        COUNT(CASE WHEN t.type = 'game_play' THEN 1 END)::integer as total_games_played,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN t.amount ELSE 0 END), 0)::numeric as total_game_volume,
        COUNT(CASE WHEN t.type = 'game_prize' THEN 1 END)::integer as total_prizes_won
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type IN ('game_play', 'game_prize')
        AND t.status = 'success'
    `

    const gameStats = gameStatsResult[0] || {
      total_games_played: 0,
      total_game_volume: 0,
      total_prizes_won: 0,
    }
    console.log("🎮 Estatísticas de jogos:", gameStats)

    // Buscar estatísticas de comissões
    const commissionStatsResult = await sql`
      SELECT 
        COUNT(*)::integer as total_commissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer as pending_commissions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::integer as paid_commissions,
        COALESCE(SUM(commission_amount), 0)::numeric as total_commission_amount,
        COALESCE(SUM(CASE WHEN commission_type = 'deposit' THEN commission_amount ELSE 0 END), 0)::numeric as deposit_commissions,
        COALESCE(SUM(CASE WHEN commission_type IN ('loss_gain', 'loss_penalty') THEN commission_amount ELSE 0 END), 0)::numeric as loss_commissions
      FROM affiliate_commissions 
      WHERE affiliate_id = ${affiliateId}
    `

    const commissionStats = commissionStatsResult[0] || {
      total_commissions: 0,
      pending_commissions: 0,
      paid_commissions: 0,
      total_commission_amount: 0,
      deposit_commissions: 0,
      loss_commissions: 0,
    }
    console.log("💸 Estatísticas de comissões:", commissionStats)

    // Buscar comissões recentes (últimas 10)
    const recentCommissions = await sql`
      SELECT 
        ac.id,
        ac.commission_amount,
        ac.commission_type,
        ac.status,
        ac.created_at,
        u.name as user_name,
        u.email as user_email,
        COALESCE(t.amount, 0) as transaction_amount,
        COALESCE(t.type, '') as transaction_type,
        COALESCE(t.description, '') as description
      FROM affiliate_commissions ac
      JOIN users u ON u.id = ac.user_id
      LEFT JOIN transactions t ON t.id = ac.transaction_id
      WHERE ac.affiliate_id = ${affiliateId}
      ORDER BY ac.created_at DESC
      LIMIT 10
    `

    console.log(`📋 Comissões recentes encontradas: ${recentCommissions.length}`)

    // Calcular detalhes do saldo
    const balanceDetailsResult = await sql`
      SELECT 
        COALESCE(a.total_earnings, 0)::numeric as total_earnings,
        COALESCE(a.balance, 0)::numeric as available_balance,
        COALESCE((
          SELECT SUM(amount) 
          FROM affiliate_withdraws 
          WHERE affiliate_id = ${affiliateId} AND status IN ('approved', 'paid')
        ), 0)::numeric as withdrawn_amount,
        COALESCE((
          SELECT SUM(amount) 
          FROM affiliate_withdraws 
          WHERE affiliate_id = ${affiliateId} AND status = 'pending'
        ), 0)::numeric as pending_amount
      FROM affiliates a
      WHERE a.id = ${affiliateId}
    `

    const balanceDetails = balanceDetailsResult[0] || {
      total_earnings: 0,
      available_balance: 0,
      withdrawn_amount: 0,
      pending_amount: 0,
    }
    console.log("💰 Detalhes do saldo:", balanceDetails)

    const stats = {
      total_referrals: Number(referralStats.total_referrals || 0),
      active_referrals: Number(referralStats.active_referrals || 0),
      total_real_deposits: Number(depositStats.total_real_deposits || 0), // APENAS PIX reais
      total_deposit_volume: Number(depositStats.total_deposit_volume || 0), // APENAS PIX reais
      total_games_played: Number(gameStats.total_games_played || 0),
      total_game_volume: Number(gameStats.total_game_volume || 0),
      total_prizes_won: Number(gameStats.total_prizes_won || 0),
      total_commissions: Number(commissionStats.total_commissions || 0),
      pending_commissions: Number(commissionStats.pending_commissions || 0),
      paid_commissions: Number(commissionStats.paid_commissions || 0),
      total_commission_amount: Number(commissionStats.total_commission_amount || 0),
      deposit_commissions: Number(commissionStats.deposit_commissions || 0),
      loss_commissions: Number(commissionStats.loss_commissions || 0),
    }

    console.log("📊 Estatísticas finais calculadas:", stats)

    const response = {
      success: true,
      affiliate: {
        id: Number(affiliate.id),
        name: affiliate.name,
        email: affiliate.email,
        username: affiliate.username,
        affiliate_code: affiliate.affiliate_code,
        commission_rate: Number(affiliate.commission_rate || 0),
        loss_commission_rate: Number(affiliate.loss_commission_rate || 0),
        total_earnings: Number(affiliate.total_earnings || 0),
        balance: Number(affiliate.balance || 0),
        total_referrals: Number(affiliate.total_referrals || 0),
        affiliate_link: affiliate.affiliate_link,
      },
      stats,
      recent_commissions: recentCommissions.map((commission) => ({
        id: Number(commission.id),
        commission_amount: Number(commission.commission_amount || 0),
        commission_type: commission.commission_type,
        status: commission.status,
        created_at: commission.created_at,
        user_name: commission.user_name,
        user_email: commission.user_email,
        transaction_amount: Number(commission.transaction_amount || 0),
        transaction_type: commission.transaction_type,
        description: commission.description,
      })),
      balance_details: {
        total_earnings: Number(balanceDetails.total_earnings || 0),
        withdrawn_amount: Number(balanceDetails.withdrawn_amount || 0),
        pending_amount: Number(balanceDetails.pending_amount || 0),
        available_balance: Number(balanceDetails.available_balance || 0),
      },
    }

    console.log("✅ Resposta preparada com sucesso")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Erro na API de estatísticas do afiliado:", error)
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
