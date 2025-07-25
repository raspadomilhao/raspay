import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Listando indicações do usuário...")

    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar indicações feitas pelo usuário
    const referrals = await sql`
      SELECT 
        ur.*,
        u.name as referred_name,
        u.email as referred_email,
        u.created_at as referred_created_at,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM transactions t 
            WHERE t.user_id = ur.referred_id 
            AND t.type = 'deposit' 
            AND t.status = 'success'
            AND t.external_id IS NOT NULL
          ) THEN true
          ELSE false
        END as has_valid_deposit
      FROM user_referrals ur
      JOIN users u ON ur.referred_id = u.id
      WHERE ur.referrer_id = ${auth.userId}
      ORDER BY ur.created_at DESC
    `

    // Buscar estatísticas
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN ur.bonus_paid = true THEN 1 END) as paid_referrals,
        COALESCE(SUM(CASE WHEN ur.bonus_paid = true THEN ur.bonus_amount ELSE 0 END), 0) as total_earned,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM transactions t 
          WHERE t.user_id = ur.referred_id 
          AND t.type = 'deposit' 
          AND t.status = 'success'
          AND t.external_id IS NOT NULL
        ) THEN 1 END) as active_referrals
      FROM user_referrals ur
      WHERE ur.referrer_id = ${auth.userId}
    `

    console.log(`✅ Encontradas ${referrals.length} indicações`)

    return NextResponse.json({
      success: true,
      referrals,
      stats: stats || {
        total_referrals: 0,
        paid_referrals: 0,
        total_earned: 0,
        active_referrals: 0,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao listar indicações:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
