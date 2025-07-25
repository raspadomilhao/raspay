import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Verificar conexão
    const connectionTest = await sql`SELECT NOW() as current_time`

    // Verificar tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    // Verificar usuários
    const users = await sql`
      SELECT 
        id, name, email, user_type, created_at,
        (SELECT balance FROM wallets WHERE user_id = users.id) as balance
      FROM users 
      ORDER BY id
    `

    // Verificar transações
    const transactions = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'deposit') as deposits,
        COUNT(*) FILTER (WHERE type = 'withdraw') as withdraws,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM transactions
    `

    // Verificar jogos
    const games = await sql`
      SELECT 
        COUNT(*) as total_plays,
        COUNT(*) FILTER (WHERE is_winner = true) as total_wins,
        SUM(bet_amount) as total_bet,
        SUM(win_amount) as total_won
      FROM game_results
    `

    // Verificar webhooks
    const webhooks = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE processed = true) as processed,
        COUNT(*) FILTER (WHERE processed = false) as pending
      FROM webhook_logs
    `

    // Calcular estatísticas
    const stats = {
      connection: {
        status: "connected",
        timestamp: connectionTest[0].current_time,
      },
      tables: {
        total: tables.length,
        list: tables.map((t) => t.table_name),
        expected: ["users", "wallets", "transactions", "game_results", "webhook_logs"],
        missing: ["users", "wallets", "transactions", "game_results", "webhook_logs"].filter(
          (expected) => !tables.some((t) => t.table_name === expected),
        ),
      },
      users: {
        total: users.length,
        list: users,
      },
      transactions: transactions[0],
      games: games[0],
      webhooks: webhooks[0],
    }

    // Determinar status geral
    const isSetupComplete = stats.tables.missing.length === 0 && stats.users.total >= 3

    return NextResponse.json({
      success: true,
      setupComplete: isSetupComplete,
      stats,
      recommendations: getRecommendations(stats),
    })
  } catch (error) {
    console.error("Erro ao verificar banco:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        setupComplete: false,
      },
      { status: 500 },
    )
  }
}

function getRecommendations(stats: any): string[] {
  const recommendations: string[] = []

  if (stats.tables.missing.length > 0) {
    recommendations.push(`Execute o script SQL para criar as tabelas: ${stats.tables.missing.join(", ")}`)
  }

  if (stats.users.total === 0) {
    recommendations.push("Execute o script SQL para criar os usuários de teste")
  }

  if (stats.users.total > 0 && stats.users.total < 3) {
    recommendations.push("Execute o script SQL completo para criar todos os usuários de teste")
  }

  if (stats.transactions.total === 0) {
    recommendations.push("Execute o script SQL para criar transações de exemplo")
  }

  if (stats.tables.missing.length === 0 && stats.users.total >= 3) {
    recommendations.push("✅ Setup completo! Você pode começar a usar o sistema")
    recommendations.push("🔐 Use as credenciais: admin@raspay.com / admin123")
    recommendations.push("🧪 Teste com: teste@raspay.com / admin123")
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === "run-setup") {
      // Aqui você poderia executar o script SQL automaticamente
      // Por segurança, vamos apenas retornar instruções
      return NextResponse.json({
        success: true,
        message: "Para executar o setup, copie e execute o script SQL no Neon Console",
        scriptPath: "/scripts/000-setup-complete-database.sql",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Ação não reconhecida",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Erro na ação de setup:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
