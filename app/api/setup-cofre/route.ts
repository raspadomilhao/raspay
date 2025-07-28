import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🏦 Iniciando setup do sistema de cofre...")

    // Verificar se as tabelas existem
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('game_cofres', 'cofre_prizes')
    `

    console.log("📊 Tabelas encontradas:", tables)

    // Criar tabela de cofres se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS game_cofres (
          id SERIAL PRIMARY KEY,
          game_name VARCHAR(50) UNIQUE NOT NULL,
          balance DECIMAL(10,2) DEFAULT 0.00,
          total_contributed DECIMAL(10,2) DEFAULT 0.00,
          total_distributed DECIMAL(10,2) DEFAULT 0.00,
          game_count INTEGER DEFAULT 0,
          last_distribution TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Criar tabela de prêmios do cofre se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS cofre_prizes (
          id SERIAL PRIMARY KEY,
          game_name VARCHAR(50) NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          prize_amount DECIMAL(10,2) NOT NULL,
          cofre_balance_before DECIMAL(10,2) NOT NULL,
          cofre_balance_after DECIMAL(10,2) NOT NULL,
          game_count_trigger INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Inserir cofres padrão
    const games = ["raspe-da-esperanca", "fortuna-dourada", "mega-sorte"]

    for (const game of games) {
      await sql`
        INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
        VALUES (${game}, 0.00, 0.00, 0.00, 0)
        ON CONFLICT (game_name) DO NOTHING
      `
    }

    // Verificar cofres criados
    const cofres = await sql`
      SELECT * FROM game_cofres ORDER BY game_name
    `

    console.log("✅ Setup do cofre concluído!")
    console.log("📊 Cofres criados:", cofres)

    return NextResponse.json({
      success: true,
      message: "Sistema de cofre configurado com sucesso!",
      cofres: cofres,
      tablesCreated: tables.length < 2 ? "Tabelas criadas" : "Tabelas já existiam",
    })
  } catch (error) {
    console.error("❌ Erro no setup do cofre:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao configurar sistema de cofre",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
