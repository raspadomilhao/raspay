import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Check admin token from header (same as other admin APIs)
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      console.log("❌ Token de admin não encontrado no header")
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

    console.log(`📊 Buscando dados de receita desde ${startDate.toISOString()}`)

    // Revenue trend data - using different queries for different periods
    let revenueTrend = []

    if (period === "daily") {
      revenueTrend = await sql`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as deposits,
          COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount ELSE 0 END), 0) as withdraws,
          COUNT(DISTINCT user_id) as users
        FROM transactions
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `.catch((error) => {
        console.error("❌ Erro na query de revenue_trend (daily):", error)
        return []
      })
    } else if (period === "weekly") {
      revenueTrend = await sql`
        SELECT 
          TO_CHAR(date_trunc('week', created_at), 'YYYY-"W"WW') as date,
          COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as deposits,
          COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount ELSE 0 END), 0) as withdraws,
          COUNT(DISTINCT user_id) as users
        FROM transactions
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY date_trunc('week', created_at)
        ORDER BY date_trunc('week', created_at)
      `.catch((error) => {
        console.error("❌ Erro na query de revenue_trend (weekly):", error)
        return []
      })
    } else if (period === "monthly") {
      revenueTrend = await sql`
        SELECT 
          TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as date,
          COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as deposits,
          COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount ELSE 0 END), 0) as withdraws,
          COUNT(DISTINCT user_id) as users
        FROM transactions
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
      `.catch((error) => {
        console.error("❌ Erro na query de revenue_trend (monthly):", error)
        return []
      })
    }

    console.log(`📊 Revenue trend encontrado: ${revenueTrend.length} registros`)

    // Affiliate performance
    console.log(`📊 Buscando performance de afiliados`)
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
      LEFT JOIN transactions t ON u.id = t.user_id AND t.created_at >= ${startDate.toISOString()}
      WHERE a.status = 'active'
      GROUP BY a.id, a.name, a.total_earnings, a.total_referrals
      ORDER BY a.total_earnings DESC
      LIMIT 20
    `.catch((error) => {
      console.error("❌ Erro na query de affiliate_performance:", error)
      return []
    })

    console.log(`📊 Affiliate performance encontrado: ${affiliatePerformance.length} registros`)

    // Manager performance
    console.log(`📊 Buscando performance de gerentes`)
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
      LEFT JOIN transactions t ON u.id = t.user_id AND t.created_at >= ${startDate.toISOString()}
      WHERE m.status = 'active'
      GROUP BY m.id, m.name, m.total_earnings
      ORDER BY m.total_earnings DESC
      LIMIT 20
    `.catch((error) => {
      console.error("❌ Erro na query de manager_performance:", error)
      return []
    })

    console.log(`📊 Manager performance encontrado: ${managerPerformance.length} registros`)

    // Period comparison
    console.log(`📊 Buscando comparação de períodos`)
    const [currentPeriodStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'game_prize') THEN amount ELSE 0 END), 0) as affiliates_earnings
      FROM transactions
      WHERE created_at >= ${startDate.toISOString()}
    `.catch((error) => {
      console.error("❌ Erro na query de current_period:", error)
      return [{ revenue: 0, users: 0, transactions: 0, affiliates_earnings: 0 }]
    })

    const [previousPeriodStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'game_play' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'game_prize') THEN amount ELSE 0 END), 0) as affiliates_earnings
      FROM transactions
      WHERE created_at >= ${previousStartDate.toISOString()} AND created_at < ${startDate.toISOString()}
    `.catch((error) => {
      console.error("❌ Erro na query de previous_period:", error)
      return [{ revenue: 0, users: 0, transactions: 0, affiliates_earnings: 0 }]
    })

    console.log(`📊 Período atual: receita=${currentPeriodStats?.revenue}, usuários=${currentPeriodStats?.users}`)
    console.log(`📊 Período anterior: receita=${previousPeriodStats?.revenue}, usuários=${previousPeriodStats?.users}`)

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

    console.log(`✅ Analytics gerados com sucesso:`)
    console.log(`   - Revenue trend: ${analyticsData.revenue_trend.length} pontos`)
    console.log(`   - Affiliates: ${analyticsData.affiliate_performance.length} registros`)
    console.log(`   - Managers: ${analyticsData.manager_performance.length} registros`)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("❌ Erro geral ao buscar analytics:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
