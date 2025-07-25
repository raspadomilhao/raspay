import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    console.log("🔧 Iniciando migração do sistema de gerentes...")

    // Executar o script de migração
    await sql`
      -- 1. Criar tabela managers se não existir
      CREATE TABLE IF NOT EXISTS managers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          commission_rate DECIMAL(5,2) DEFAULT 5.00,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          total_earnings DECIMAL(15,2) DEFAULT 0.00,
          balance DECIMAL(15,2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Verificar se a coluna manager_id existe
    const [columnExists] = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'manager_id'
      ) as exists
    `

    if (!columnExists.exists) {
      await sql`ALTER TABLE affiliates ADD COLUMN manager_id INTEGER`
      console.log("✅ Coluna manager_id adicionada à tabela affiliates")
    }

    // Remover constraint antiga se existir
    await sql`
      DO $$ 
      BEGIN 
          IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'affiliates_manager_id_fkey' 
              AND table_name = 'affiliates'
          ) THEN
              ALTER TABLE affiliates DROP CONSTRAINT affiliates_manager_id_fkey;
          END IF;
      END $$
    `

    // Limpar dados inconsistentes
    await sql`
      UPDATE affiliates 
      SET manager_id = NULL 
      WHERE manager_id IS NOT NULL 
      AND manager_id NOT IN (SELECT id FROM managers)
    `

    // Adicionar constraint
    await sql`
      ALTER TABLE affiliates 
      ADD CONSTRAINT affiliates_manager_id_fkey 
      FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE SET NULL
    `

    // Criar índices
    await sql`CREATE INDEX IF NOT EXISTS idx_affiliates_manager_id ON affiliates(manager_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_managers_status ON managers(status)`

    // Inserir gerente de teste se não existir nenhum
    const [managerCount] = await sql`SELECT COUNT(*) as count FROM managers`

    if (Number(managerCount.count) === 0) {
      await sql`
        INSERT INTO managers (name, email, username, password_hash, commission_rate, balance, status) 
        VALUES (
            'Gerente Teste', 
            'gerente@teste.com', 
            'gerente_teste', 
            '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            5.00,
            0.00,
            'active'
        )
      `
      console.log("✅ Gerente de teste criado")
    }

    // Verificar resultado final
    const [finalManagerCount] = await sql`SELECT COUNT(*) as count FROM managers`
    const [finalAffiliateCount] = await sql`SELECT COUNT(*) as count FROM affiliates`

    console.log("🎉 Migração concluída com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Sistema de gerentes migrado com sucesso!",
      stats: {
        managers: Number(finalManagerCount.count),
        affiliates: Number(finalAffiliateCount.count),
      },
    })
  } catch (error) {
    console.error("❌ Erro na migração:", error)
    return NextResponse.json(
      {
        error: "Erro na migração do sistema",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
