import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 === SETUP SISTEMA DE COFRE ===")

    // Executar o script de criação das tabelas
    await sql`
      DO $$
      BEGIN
          -- Criar tabela game_cofres se não existir
          IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_cofres') THEN
              CREATE TABLE game_cofres (
                  id SERIAL PRIMARY KEY,
                  game_name VARCHAR(100) UNIQUE NOT NULL,
                  balance DECIMAL(10,2) DEFAULT 0.00,
                  total_contributed DECIMAL(10,2) DEFAULT 0.00,
                  total_distributed DECIMAL(10,2) DEFAULT 0.00,
                  game_count INTEGER DEFAULT 0,
                  last_distribution TIMESTAMP NULL,
                  created_at TIMESTAMP DEFAULT NOW(),
                  updated_at TIMESTAMP DEFAULT NOW()
              );
          END IF;

          -- Criar tabela cofre_prizes se não existir
          IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cofre_prizes') THEN
              CREATE TABLE cofre_prizes (
                  id SERIAL PRIMARY KEY,
                  game_name VARCHAR(100) NOT NULL,
                  user_id INTEGER NOT NULL REFERENCES users(id),
                  prize_amount DECIMAL(10,2) NOT NULL,
                  cofre_balance_before DECIMAL(10,2) NOT NULL,
                  cofre_balance_after DECIMAL(10,2) NOT NULL,
                  game_count_trigger INTEGER NOT NULL,
                  created_at TIMESTAMP DEFAULT NOW()
              );
          END IF;
      END $$;
    `

    console.log("✅ Tabelas criadas/verificadas")

    // Inicializar cofres para todos os jogos
    await sql`
      INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
      VALUES 
          ('raspe-da-esperanca', 0.00, 0.00, 0.00, 0),
          ('fortuna-dourada', 0.00, 0.00, 0.00, 0),
          ('mega-sorte', 0.00, 0.00, 0.00, 0)
      ON CONFLICT (game_name) DO NOTHING;
    `

    console.log("✅ Cofres inicializados")

    // Verificar status final
    const cofres = await sql`
      SELECT * FROM game_cofres ORDER BY game_name
    `

    console.log("🏦 Status final dos cofres:", cofres)

    return NextResponse.json({
      success: true,
      message: "Sistema de cofre configurado com sucesso!",
      cofres: cofres,
    })
  } catch (error) {
    console.error("❌ Erro no setup do cofre:", error)
    return NextResponse.json(
      {
        error: "Erro ao configurar sistema de cofre",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
