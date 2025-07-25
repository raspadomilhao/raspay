import { neon } from "@neondatabase/serverless"

export class NeonSetup {
  private sql: any

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não configurada")
    }
    this.sql = neon(process.env.DATABASE_URL)
  }

  async testConnection() {
    try {
      const result = await this.sql`SELECT NOW() as current_time, version() as version`
      return {
        success: true,
        timestamp: result[0].current_time,
        version: result[0].version,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  async checkTables() {
    try {
      const tables = await this.sql`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name
      `

      const expectedTables = ["users", "wallets", "transactions", "game_results", "webhook_logs"]
      const existingTables = tables.map((t: any) => t.table_name)
      const missingTables = expectedTables.filter((table) => !existingTables.includes(table))

      return {
        success: true,
        tables: tables,
        expected: expectedTables,
        missing: missingTables,
        isComplete: missingTables.length === 0,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao verificar tabelas",
      }
    }
  }

  async checkUsers() {
    try {
      const users = await this.sql`
        SELECT u.id, u.name, u.email, u.user_type, u.created_at,
               w.balance, w.total_deposited, w.total_withdrawn
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        ORDER BY u.id
      `

      const userTypes = users.reduce((acc: any, user: any) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1
        return acc
      }, {})

      return {
        success: true,
        users: users,
        count: users.length,
        types: userTypes,
        hasTestUsers: users.some((u: any) => u.email.includes("test") || u.email.includes("admin")),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao verificar usuários",
      }
    }
  }

  async getStats() {
    try {
      // Estatísticas de transações
      const transactionStats = await this.sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type = 'deposit') as deposits,
          COUNT(*) FILTER (WHERE type = 'withdraw') as withdraws,
          COUNT(*) FILTER (WHERE type = 'game_bet') as game_bets,
          COUNT(*) FILTER (WHERE type = 'game_win') as game_wins,
          COUNT(*) FILTER (WHERE status = 'success') as successful,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'success'), 0) as total_deposited,
          COALESCE(SUM(amount) FILTER (WHERE type = 'withdraw' AND status = 'success'), 0) as total_withdrawn
        FROM transactions
      `

      // Estatísticas de jogos
      const gameStats = await this.sql`
        SELECT 
          COUNT(*) as total_plays,
          COUNT(*) FILTER (WHERE is_winner = true) as total_wins,
          COUNT(*) FILTER (WHERE is_jackpot = true) as total_jackpots,
          COALESCE(SUM(bet_amount), 0) as total_bet,
          COALESCE(SUM(win_amount), 0) as total_won,
          COALESCE(SUM(bet_amount) - SUM(win_amount), 0) as house_profit
        FROM game_results
      `

      // Estatísticas de carteiras
      const walletStats = await this.sql`
        SELECT 
          COUNT(*) as total_wallets,
          COALESCE(SUM(balance), 0) as total_balance,
          COALESCE(AVG(balance), 0) as avg_balance,
          COALESCE(MAX(balance), 0) as max_balance
        FROM wallets
      `

      // Estatísticas de webhooks
      const webhookStats = await this.sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE processed = true) as processed,
          COUNT(*) FILTER (WHERE processed = false) as pending,
          COUNT(*) FILTER (WHERE error_message IS NOT NULL) as errors
        FROM webhook_logs
      `

      return {
        success: true,
        transactions: transactionStats[0],
        games: gameStats[0],
        wallets: walletStats[0],
        webhooks: webhookStats[0],
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter estatísticas",
      }
    }
  }

  async getSystemHealth() {
    const connection = await this.testConnection()
    const tables = await this.checkTables()
    const users = await this.checkUsers()
    const stats = await this.getStats()

    const health = {
      overall: "healthy" as "healthy" | "warning" | "error",
      connection,
      tables,
      users,
      stats,
      issues: [] as string[],
      recommendations: [] as string[],
    }

    // Verificar problemas
    if (!connection.success) {
      health.overall = "error"
      health.issues.push("Falha na conexão com o banco de dados")
    }

    if (!tables.success || !tables.isComplete) {
      health.overall = "error"
      health.issues.push("Tabelas do banco não estão completas")
      health.recommendations.push("Execute o script SQL completo")
    }

    if (!users.success || users.count === 0) {
      health.overall = "warning"
      health.issues.push("Nenhum usuário encontrado")
      health.recommendations.push("Execute o script SQL para criar usuários de teste")
    }

    if (users.success && !users.hasTestUsers) {
      health.recommendations.push("Considere criar usuários de teste para desenvolvimento")
    }

    if (stats.success && stats.transactions.total === 0) {
      health.recommendations.push("Sistema pronto para receber as primeiras transações")
    }

    if (health.issues.length === 0 && health.overall !== "error") {
      health.overall = "healthy"
      health.recommendations.push("✅ Sistema funcionando perfeitamente!")
    }

    return health
  }
}

export const neonSetup = new NeonSetup()
