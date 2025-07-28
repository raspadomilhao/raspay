import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    // Buscar configuração atual
    const [setting] = await sql`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'physical_prize_chance_raspe_esperanca'
    `

    const currentChance = setting ? Number.parseFloat(setting.setting_value) : 0.01 // 1% padrão

    return NextResponse.json({
      success: true,
      chance: currentChance,
      percentage: (currentChance * 100).toFixed(2),
    })
  } catch (error) {
    console.error("Erro ao buscar chance de prêmios físicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    const { percentage } = await request.json()

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "Porcentagem deve ser um número entre 0 e 100" }, { status: 400 })
    }

    const chance = percentage / 100 // Converter para decimal

    // Salvar ou atualizar configuração
    await sql`
      INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
      VALUES (
        'physical_prize_chance_raspe_esperanca', 
        ${chance.toString()}, 
        'Chance de ganhar prêmio físico no jogo Raspe da Esperança (%)',
        NOW()
      )
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = ${chance.toString()},
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: "Chance de prêmios físicos atualizada com sucesso",
      chance: chance,
      percentage: percentage,
    })
  } catch (error) {
    console.error("Erro ao salvar chance de prêmios físicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
