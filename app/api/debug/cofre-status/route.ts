import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 === DEBUG COFRE STATUS ===")

    // Verificar se as tabelas existem
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('game_cofres', 'cofre_prizes')
      ORDER BY table_name
    `

    console.log("📋 Tabelas encontradas:", tablesCheck)

    // Verificar cofres existentes
    const cofres = await sql`
      SELECT * FROM game_cofres ORDER BY game_name
    `

    console.log("🏦 Cofres encontrados:", cofres)

    // Verificar prêmios do cofre
    const prizes = await sql`
      SELECT 
        cp.*,
        u.name as user_name,
        u.username as user_username
      FROM cofre_prizes cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
      LIMIT 10
    `

    console.log("🎁 Prêmios do cofre:", prizes)

    // Verificar transações de jogos recentes
    const recentGames = await sql`
      SELECT 
        t.*,
        u.name as user_name,
        u.user_type
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'game_play'
      ORDER BY t.created_at DESC
      LIMIT 10
    `

    console.log("🎮 Jogos recentes:", recentGames)

    return NextResponse.json({
      success: true,
      debug: {
        tables_exist: tablesCheck,
        cofres: cofres,
        recent_prizes: prizes,
        recent_games: recentGames,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Erro no debug do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro ao verificar status do cofre",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
