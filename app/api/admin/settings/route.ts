import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const settings = await sql`
      SELECT setting_key, setting_value, description, updated_at
      FROM system_settings
      ORDER BY setting_key
    `

    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updated_at: setting.updated_at,
      }
      return acc
    }, {})

    return NextResponse.json({ success: true, settings: settingsMap })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { setting_key, setting_value } = await request.json()

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json({ error: "Chave e valor são obrigatórios" }, { status: 400 })
    }

    // Validações específicas
    if (setting_key === "min_deposit_amount") {
      const value = Number.parseFloat(setting_value)
      if (isNaN(value) || value < 1 || value > 1000) {
        return NextResponse.json(
          { error: "Valor mínimo de depósito deve estar entre R$ 1,00 e R$ 1.000,00" },
          { status: 400 },
        )
      }
    }

    if (setting_key === "min_withdraw_amount") {
      const value = Number.parseFloat(setting_value)
      if (isNaN(value) || value < 1 || value > 1000) {
        return NextResponse.json(
          { error: "Valor mínimo de saque deve estar entre R$ 1,00 e R$ 1.000,00" },
          { status: 400 },
        )
      }
    }

    await sql`
      INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES (${setting_key}, ${setting_value}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: "Configuração atualizada com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
