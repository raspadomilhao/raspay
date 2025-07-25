import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Buscando depósitos PIX reais dos referidos do afiliado...")

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

    const affiliateId = payload.affiliateId

    // Verificar se o afiliado existe e está ativo
    const [affiliate] = await sql`
      SELECT id, name FROM affiliates 
      WHERE id = ${affiliateId} AND status = 'active'
    `

    if (!affiliate) {
      console.log("❌ Afiliado não encontrado ou inativo")
      return NextResponse.json({ success: false, error: "Afiliado não encontrado" }, { status: 404 })
    }

    // Buscar parâmetros de paginação
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    console.log(`📄 Paginação: página ${page}, limite ${limit}, offset ${offset}`)

    // Buscar APENAS depósitos PIX reais confirmados (não jogadas ganhas)
    // Critérios: type = 'deposit', status = 'success', external_id IS NOT NULL, is_demo = false
    const depositsResult = await sql`
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.external_id,
        t.end_to_end_id,
        t.payer_name,
        t.pix_key,
        t.pix_type,
        t.created_at,
        t.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.username as user_username,
        ac.commission_amount,
        ac.created_at as commission_created_at
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN affiliate_commissions ac ON ac.transaction_id = t.id AND ac.affiliate_id = ${affiliateId} AND ac.commission_type = 'deposit'
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type = 'deposit'
        AND t.status = 'success'
        AND t.external_id IS NOT NULL
        AND COALESCE(t.is_demo, false) = false
      ORDER BY t.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    // Contar total de depósitos PIX reais para paginação
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type = 'deposit'
        AND t.status = 'success'
        AND t.external_id IS NOT NULL
        AND COALESCE(t.is_demo, false) = false
    `

    const totalDeposits = Number(countResult.total) || 0
    const totalPages = Math.ceil(totalDeposits / limit)

    // Calcular estatísticas APENAS dos depósitos PIX reais
    const [statsResult] = await sql`
      SELECT 
        COUNT(*) as total_deposits,
        COUNT(DISTINCT u.id) as unique_depositors,
        COALESCE(SUM(t.amount), 0) as total_volume,
        COALESCE(AVG(t.amount), 0) as average_amount,
        COALESCE(MIN(t.amount), 0) as min_amount,
        COALESCE(MAX(t.amount), 0) as max_amount,
        COALESCE(SUM(ac.commission_amount), 0) as total_commissions_earned
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN affiliate_commissions ac ON ac.transaction_id = t.id AND ac.affiliate_id = ${affiliateId} AND ac.commission_type = 'deposit'
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type = 'deposit'
        AND t.status = 'success'
        AND t.external_id IS NOT NULL
        AND COALESCE(t.is_demo, false) = false
    `

    const stats = statsResult || {
      total_deposits: 0,
      unique_depositors: 0,
      total_volume: 0,
      average_amount: 0,
      min_amount: 0,
      max_amount: 0,
      total_commissions_earned: 0,
    }

    // Buscar depósitos PIX reais por mês (últimos 6 meses)
    const monthlyStatsResult = await sql`
      SELECT 
        DATE_TRUNC('month', t.created_at) as month,
        COUNT(*) as deposits_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(DISTINCT u.id) as unique_users
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE u.affiliate_id = ${affiliateId}
        AND t.type = 'deposit'
        AND t.status = 'success'
        AND t.external_id IS NOT NULL
        AND COALESCE(t.is_demo, false) = false
        AND t.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', t.created_at)
      ORDER BY month DESC
    `

    console.log(`✅ Encontrados ${depositsResult.length} depósitos PIX reais na página ${page}`)
    console.log(`📊 Total de depósitos PIX reais: ${totalDeposits}`)
    console.log(`💰 Volume total PIX: R$ ${Number(stats.total_volume).toFixed(2)}`)

    const response = {
      success: true,
      deposits: depositsResult.map((deposit) => ({
        ...deposit,
        amount: Number(deposit.amount),
        commission_amount: Number(deposit.commission_amount) || 0,
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalDeposits,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      stats: {
        total_deposits: Number(stats.total_deposits),
        unique_depositors: Number(stats.unique_depositors),
        total_volume: Number(stats.total_volume),
        average_amount: Number(stats.average_amount),
        min_amount: Number(stats.min_amount),
        max_amount: Number(stats.max_amount),
        total_commissions_earned: Number(stats.total_commissions_earned),
      },
      monthly_stats: monthlyStatsResult.map((month) => ({
        month: month.month,
        deposits_count: Number(month.deposits_count),
        total_amount: Number(month.total_amount),
        unique_users: Number(month.unique_users),
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Erro na API de depósitos PIX do afiliado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
