import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Estatísticas de usuários (excluindo bloggers)
    const usersStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN user_type != 'blogger' THEN 1 END) as regular_users,
        COUNT(CASE WHEN user_type = 'blogger' THEN 1 END) as blogger_users,
        COUNT(CASE WHEN u.created_at >= CURRENT_DATE AND user_type != 'blogger' THEN 1 END) as active_today,
        COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '7 days' AND user_type != 'blogger' THEN 1 END) as new_this_week,
        COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '1 hour' AND user_type != 'blogger' THEN 1 END) as online_now
      FROM users u
    `

    // Estatísticas de transações (excluindo bloggers)
    const transactionsStats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN t.status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed,
        COALESCE(SUM(t.amount), 0) as total_volume,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as deposits_volume,
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as withdraws_volume,
        COUNT(CASE WHEN t.created_at >= CURRENT_DATE THEN 1 END) as today_transactions,
        COALESCE(SUM(CASE WHEN t.created_at >= CURRENT_DATE THEN t.amount ELSE 0 END), 0) as today_volume
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE u.user_type != 'blogger'
    `

    // Transações detalhadas (últimas 100)
    const detailedTransactions = await sql`
      SELECT
        t.id,
        t.user_id,
        t.type,
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
        u.username as user_username,
        u.email as user_email,
        u.user_type,
        w.balance as user_balance
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.user_type != 'blogger'
      AND t.type IN ('deposit', 'withdraw')
      ORDER BY t.created_at DESC
      LIMIT 100
    `

    // Estatísticas de jogos (excluindo bloggers)
    const gamesStats = await sql`
      SELECT
        COUNT(CASE WHEN t.type = 'game_play' THEN 1 END) as total_plays,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN ABS(t.amount) ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN t.type = 'game_prize' THEN t.amount ELSE 0 END), 0) as total_won,
        COUNT(CASE WHEN t.type = 'game_play' AND t.created_at >= CURRENT_DATE THEN 1 END) as today_plays,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' AND t.created_at >= CURRENT_DATE THEN ABS(t.amount) ELSE 0 END), 0) as today_spent,
        COALESCE(SUM(CASE WHEN t.type = 'game_prize' AND t.created_at >= CURRENT_DATE THEN t.amount ELSE 0 END), 0) as today_won
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('game_play', 'game_prize')
      AND u.user_type != 'blogger'
    `

    // Estatísticas financeiras (excluindo bloggers)
    const financialStats = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) as platform_balance,
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'pending' THEN t.amount ELSE 0 END), 0) as pending_withdraws,
        COALESCE(SUM(w.balance), 0) as total_user_balance
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.user_type != 'blogger'
    `

    // Receitas por período (excluindo bloggers)
    const revenueStats = await sql`
      SELECT
        COALESCE(SUM(CASE
          WHEN t.type = 'game_play' AND t.created_at >= CURRENT_DATE
          THEN ABS(t.amount) ELSE 0 END), 0) -
        COALESCE(SUM(CASE
          WHEN t.type = 'game_prize' AND t.created_at >= CURRENT_DATE
          THEN t.amount ELSE 0 END), 0) as daily_revenue,

        COALESCE(SUM(CASE
          WHEN t.type = 'game_play' AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
          THEN ABS(t.amount) ELSE 0 END), 0) -
        COALESCE(SUM(CASE
          WHEN t.type = 'game_prize' AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
          THEN t.amount ELSE 0 END), 0) as weekly_revenue,

        COALESCE(SUM(CASE
          WHEN t.type = 'game_play' AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
          THEN ABS(t.amount) ELSE 0 END), 0) -
        COALESCE(SUM(CASE
          WHEN t.type = 'game_prize' AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
          THEN t.amount ELSE 0 END), 0) as monthly_revenue
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('game_play', 'game_prize')
      AND u.user_type != 'blogger'
    `

    // Breakdown por jogo (excluindo bloggers)
    const gamesBreakdown = await sql`
      SELECT
        CASE
          WHEN ABS(t.amount) = 1.00 THEN 'Raspe da Esperança'
          WHEN ABS(t.amount) = 3.00 THEN 'Fortuna Dourada'
          WHEN ABS(t.amount) = 5.00 THEN 'Mega Sorte'
          ELSE 'Outros'
        END as game_type,
        COUNT(CASE WHEN t.type = 'game_play' THEN 1 END) as plays,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN ABS(t.amount) ELSE 0 END), 0) as spent,
        COALESCE(SUM(CASE WHEN t.type = 'game_prize' THEN t.amount ELSE 0 END), 0) as won,
        COALESCE(SUM(CASE WHEN t.type = 'game_play' THEN ABS(t.amount) ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'game_prize' THEN t.amount ELSE 0 END), 0) as profit
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('game_play', 'game_prize')
      AND u.user_type != 'blogger'
      GROUP BY
        CASE
          WHEN ABS(t.amount) = 1.00 THEN 'Raspe da Esperança'
          WHEN ABS(t.amount) = 3.00 THEN 'Fortuna Dourada'
          WHEN ABS(t.amount) = 5.00 THEN 'Mega Sorte'
          ELSE 'Outros'
        END
      HAVING COUNT(CASE WHEN t.type = 'game_play' THEN 1 END) > 0
    `

    // Atividades recentes (excluindo bloggers)
    const recentActivities = await sql`
      SELECT
        t.id,
        CASE
          WHEN t.type = 'deposit' THEN 'deposit'
          WHEN t.type = 'withdraw' THEN 'withdraw'
          WHEN t.type = 'game_play' THEN 'game'
          WHEN t.type = 'game_prize' THEN 'game'
          ELSE 'transaction'
        END as type,
        CASE
          WHEN t.type = 'deposit' THEN 'Depósito realizado'
          WHEN t.type = 'withdraw' THEN 'Saque solicitado'
          WHEN t.type = 'game_play' THEN CONCAT('Jogou ',
            CASE
              WHEN ABS(t.amount) = 1.00 THEN 'Raspe da Esperança'
              WHEN ABS(t.amount) = 3.00 THEN 'Fortuna Dourada'
              WHEN ABS(t.amount) = 5.00 THEN 'Mega Sorte'
              ELSE 'jogo'
            END)
          WHEN t.type = 'game_prize' THEN CONCAT('Ganhou prêmio de ',
            CASE
              WHEN t.amount = 1.00 THEN 'Raspe da Esperança'
              WHEN t.amount = 3.00 THEN 'Fortuna Dourada'
              WHEN t.amount = 5.00 THEN 'Mega Sorte'
              ELSE 'jogo'
            END)
          ELSE 'Transação'
        END as description,
        t.amount,
        u.email as user_email,
        t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.created_at >= CURRENT_DATE - INTERVAL '24 hours'
      AND u.user_type != 'blogger'
      ORDER BY t.created_at DESC
      LIMIT 20
    `

    // Estatísticas de saques pendentes
    const withdrawStats = await sql`
      SELECT
        COUNT(CASE WHEN t.type = 'withdraw' AND t.status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'pending' THEN t.amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN t.type = 'withdraw' AND t.status = 'success' AND t.created_at >= CURRENT_DATE THEN 1 END) as processed_today,
        COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'success' AND t.created_at >= CURRENT_DATE THEN t.amount ELSE 0 END), 0) as processed_today_amount
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE u.user_type != 'blogger'
    `

    // New: Performance Statistics
    const performanceStats = await sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE type = 'deposit' AND status = 'success') as avg_deposit_time,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE type = 'withdraw' AND status = 'success') as avg_withdraw_time
      FROM transactions
      WHERE status = 'success'
    `

    // Calcular margem de lucro dos jogos
    const totalSpent = Number.parseFloat(gamesStats[0]?.total_spent || "0")
    const totalWon = Number.parseFloat(gamesStats[0]?.total_won || "0")
    const profitMargin = totalSpent > 0 ? ((totalSpent - totalWon) / totalSpent) * 100 : 0

    // Calcular saldo disponível
    const platformBalance = Number.parseFloat(financialStats[0]?.platform_balance || "0")
    const pendingWithdraws = Number.parseFloat(financialStats[0]?.pending_withdraws || "0")
    const availableBalance = platformBalance - pendingWithdraws

    // Formatar breakdown dos jogos
    const gamesBreakdownFormatted = gamesBreakdown.reduce((acc: any, game: any) => {
      acc[game.game_type] = {
        plays: Number.parseInt(game.plays),
        spent: Number.parseFloat(game.spent),
        won: Number.parseFloat(game.won),
        profit: Number.parseFloat(game.profit),
      }
      return acc
    }, {})

    const stats = {
      users: {
        total: Number.parseInt(usersStats[0]?.regular_users || "0"),
        blogger_count: Number.parseInt(usersStats[0]?.blogger_users || "0"),
        active_today: Number.parseInt(usersStats[0]?.active_today || "0"),
        new_this_week: Number.parseInt(usersStats[0]?.new_this_week || "0"),
        online_now: Number.parseInt(usersStats[0]?.online_now || "0"),
      },
      transactions: {
        total: Number.parseInt(transactionsStats[0]?.total || "0"),
        successful: Number.parseInt(transactionsStats[0]?.successful || "0"),
        pending: Number.parseInt(transactionsStats[0]?.pending || "0"),
        failed: Number.parseInt(transactionsStats[0]?.failed || "0"),
        total_volume: Number.parseFloat(transactionsStats[0]?.total_volume || "0"),
        deposits_volume: Number.parseFloat(transactionsStats[0]?.deposits_volume || "0"),
        withdraws_volume: Number.parseFloat(transactionsStats[0]?.withdraws_volume || "0"),
        today_transactions: Number.parseInt(transactionsStats[0]?.today_transactions || "0"),
        today_volume: Number.parseFloat(transactionsStats[0]?.today_volume || "0"),
        detailed_list: detailedTransactions.map((transaction: any) => ({
          id: transaction.id,
          type: transaction.type,
          amount: Number.parseFloat(transaction.amount),
          status: transaction.status,
          external_id: transaction.external_id,
          end_to_end_id: transaction.end_to_end_id,
          payer_name: transaction.payer_name,
          pix_key: transaction.pix_key,
          pix_type: transaction.pix_type,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          user: {
            id: transaction.user_id,
            name: transaction.user_name,
            username: transaction.user_username,
            email: transaction.user_email,
            user_type: transaction.user_type,
            balance: Number.parseFloat(transaction.user_balance || "0"),
          },
        })),
      },
      games: {
        total_plays: Number.parseInt(gamesStats[0]?.total_plays || "0"),
        total_spent: totalSpent,
        total_won: totalWon,
        profit_margin: profitMargin,
        today_plays: Number.parseInt(gamesStats[0]?.today_plays || "0"),
        today_spent: Number.parseFloat(gamesStats[0]?.today_spent || "0"),
        today_won: Number.parseFloat(gamesStats[0]?.today_won || "0"),
        games_breakdown: gamesBreakdownFormatted,
      },
      financial: {
        platform_balance: platformBalance,
        pending_withdraws: pendingWithdraws,
        available_balance: availableBalance,
        total_user_balance: Number.parseFloat(financialStats[0]?.total_user_balance || "0"),
        daily_revenue: Number.parseFloat(revenueStats[0]?.daily_revenue || "0"),
        weekly_revenue: Number.parseFloat(revenueStats[0]?.weekly_revenue || "0"),
        monthly_revenue: Number.parseFloat(revenueStats[0]?.monthly_revenue || "0"),
      },
      withdraws: {
        pending_count: Number.parseInt(withdrawStats[0]?.pending_count || "0"),
        pending_amount: Number.parseFloat(withdrawStats[0]?.pending_amount || "0"),
        processed_today: Number.parseInt(withdrawStats[0]?.processed_today || "0"),
        processed_today_amount: Number.parseFloat(withdrawStats[0]?.processed_today_amount || "0"),
      },
      recent_activities: recentActivities.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        amount: activity.amount ? Number.parseFloat(activity.amount) : null,
        user_email: activity.user_email,
        created_at: activity.created_at,
      })),
      performance: {
        avg_deposit_time: Number.parseFloat(performanceStats[0]?.avg_deposit_time || "0"),
        avg_withdraw_time: Number.parseFloat(performanceStats[0]?.avg_withdraw_time || "0"),
        api_error_rate: "0.05%", // Placeholder: Implementar monitoramento de logs para dados reais
        system_uptime: "99.9%", // Placeholder: Integrar com serviço de monitoramento de uptime
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas administrativas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
