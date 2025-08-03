import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return false

    const { payload } = await jwtVerify(token, secret)
    return payload.isAdmin === true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")
    const period = searchParams.get("period") || "daily"

    console.log(`📊 Buscando analytics para ${days} dias, período: ${period}`)

    // Calculate date ranges
    const currentDate = new Date()
    const startDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Revenue trend data
    let dateFormat = "YYYY-MM-DD"
    let dateInterval = "1 day"

    if (period === "weekly") {
      dateFormat = 'YYYY-"W"WW'
      dateInterval = "1 week"
    } else if (period === "monthly") {
      dateFormat = "YYYY-MM"
      dateInterval = "1 month"
    }

    const revenueTrend = await sql`
      SELECT 
        TO_CHAR(date_trunc(${period}, created_at), ${dateFormat}) as date,
        COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as deposits,
        COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount ELSE 0 END), 0) as withdraws,
        COUNT(DISTINCT user_id) as users
      FROM transactions
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY date_trunc(${period}, created_at)
      ORDER BY date_trunc(${period}, created_at)
    `

    // Affiliate performance
    const affiliatePerformance = await sql`
      SELECT 
        a.name as affiliate_name,
        COALESCE(a.total_earnings, 0) as total_earnings,
        COALESCE(a.total_referrals, 0) as referrals,
        COALESCE(
          CASE 
            WHEN COUNT(DISTINCT u.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END)::float / COUNT(DISTINCT u.id)::float) * 100
            ELSE 0 
          END, 0
        ) as conversion_rate,
        COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.id END) as deposits_count
      FROM affiliates a
      LEFT JOIN users u ON a.id = u.affiliate_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE a.status = 'active'
      GROUP BY a.id, a.name, a.total_earnings, a.total_referrals
      ORDER BY a.total_earnings DESC
      LIMIT 20
    `

    // Manager performance
    const managerPerformance = await sql`
      SELECT 
        m.name as manager_name,
        COALESCE(m.total_earnings, 0) as total_earnings,
        COUNT(DISTINCT a.id) as affiliates_count,
        COUNT(DISTINCT u.id) as total_referrals,
        COALESCE(
          CASE 
            WHEN COUNT(DISTINCT u.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN u.id END)::float / COUNT(DISTINCT u.id)::float) * 100
            ELSE 0 
          END, 0
        ) as avg_conversion
      FROM managers m
      LEFT JOIN affiliates a ON m.id = a.manager_id
      LEFT JOIN users u ON a.id = u.affiliate_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE m.status = 'active'
      GROUP BY m.id, m.name, m.total_earnings
      ORDER BY m.total_earnings DESC
      LIMIT 20
    `

    // Period comparison
    const [currentPeriodStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'game_prize') THEN amount ELSE 0 END), 0) as affiliates_earnings
      FROM transactions
      WHERE created_at >= ${startDate.toISOString()}
    `

    const [previousPeriodStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'game_prize') THEN amount ELSE 0 END), 0) as affiliates_earnings
      FROM transactions
      WHERE created_at >= ${previousStartDate.toISOString()} AND created_at < ${startDate.toISOString()}
    `

    const analyticsData = {
      revenue_trend: revenueTrend.map((row) => ({
        date: row.date,
        revenue: Number(row.revenue),
        deposits: Number(row.deposits),
        withdraws: Number(row.withdraws),
        users: Number(row.users),
      })),
      affiliate_performance: affiliatePerformance.map((row) => ({
        affiliate_name: row.affiliate_name,
        total_earnings: Number(row.total_earnings),
        referrals: Number(row.referrals),
        conversion_rate: Number(row.conversion_rate),
        deposits_count: Number(row.deposits_count),
      })),
      manager_performance: managerPerformance.map((row) => ({
        manager_name: row.manager_name,
        total_earnings: Number(row.total_earnings),
        affiliates_count: Number(row.affiliates_count),
        total_referrals: Number(row.total_referrals),
        avg_conversion: Number(row.avg_conversion),
      })),
      period_comparison: {
        current_period: {
          revenue: Number(currentPeriodStats?.revenue || 0),
          users: Number(currentPeriodStats?.users || 0),
          transactions: Number(currentPeriodStats?.transactions || 0),
          affiliates_earnings: Number(currentPeriodStats?.affiliates_earnings || 0),
        },
        previous_period: {
          revenue: Number(previousPeriodStats?.revenue || 0),
          users: Number(previousPeriodStats?.users || 0),
          transactions: Number(previousPeriodStats?.transactions || 0),
          affiliates_earnings: Number(previousPeriodStats?.affiliates_earnings || 0),
        },
      },
    }

    console.log(`✅ Analytics gerados com sucesso`)
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("❌ Erro ao buscar analytics:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
