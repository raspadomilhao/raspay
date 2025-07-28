import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 Verificando status do sistema de cofre...")

    // Verificar se as tabelas existem
    const tables = await sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('game_cofres', 'cofre_prizes')
    `

    // Verificar dados dos cofres
    let cofres = []
    let prizes = []

    try {
      cofres = await sql`SELECT * FROM game_cofres ORDER BY game_name`
      prizes = await sql`
        SELECT cp.*, u.name as user_name, u.username as user_username
        FROM cofre_prizes cp
        LEFT JOIN users u ON cp.user_id = u.id
        ORDER BY cp.created_at DESC
        LIMIT 10
      `
    } catch (error) {
      console.log("⚠️ Erro ao buscar dados:", error)
    }

    // Verificar estrutura das colunas
    const cofreColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'game_cofres' AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    const prizeColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cofre_prizes' AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      success: true,
      status: {
        tablesExist: tables.length === 2,
        tables: tables,
        cofreCount: cofres.length,
        prizeCount: prizes.length,
        structure: {
          game_cofres: cofreColumns,
          cofre_prizes: prizeColumns,
        },
      },
      data: {
        cofres: cofres,
        recentPrizes: prizes,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Erro ao verificar status do cofre:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar status do cofre",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
