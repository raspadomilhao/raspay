import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando recálculo dos saldos dos gerentes...")

    // Verificar token de admin
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    // Buscar todos os gerentes ativos
    const managers = await sql`
      SELECT id, name, email FROM managers WHERE status = 'active'
    `

    console.log(`📊 Encontrados ${managers.length} gerentes ativos`)

    let updatedCount = 0
    const results = []

    for (const manager of managers) {
      try {
        // Calcular o total ganho de todos os afiliados deste gerente
        const [affiliateStats] = await sql`
          SELECT 
            COALESCE(SUM(total_earnings), 0) as total_affiliate_earnings,
            COUNT(*) as total_affiliates
          FROM affiliates 
          WHERE manager_id = ${manager.id} AND status = 'active'
        `

        const totalAffiliateEarnings = Number(affiliateStats.total_affiliate_earnings)
        const managerShouldHave = totalAffiliateEarnings * 0.05 // 5%

        console.log(
          `💰 Gerente ${manager.name}: Afiliados ganharam R$ ${totalAffiliateEarnings.toFixed(2)}, gerente deve ter R$ ${managerShouldHave.toFixed(2)}`,
        )

        // Atualizar saldo do gerente
        await sql`
          UPDATE managers 
          SET balance = ${managerShouldHave},
              total_earnings = ${managerShouldHave},
              updated_at = NOW()
          WHERE id = ${manager.id}
        `

        results.push({
          manager_id: manager.id,
          manager_name: manager.name,
          total_affiliate_earnings: totalAffiliateEarnings,
          manager_balance: managerShouldHave,
          total_affiliates: Number(affiliateStats.total_affiliates),
        })

        updatedCount++
        console.log(`✅ Gerente ${manager.name} atualizado`)
      } catch (error) {
        console.error(`❌ Erro ao processar gerente ${manager.name}:`, error)
        results.push({
          manager_id: manager.id,
          manager_name: manager.name,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }
    }

    console.log(`✅ Recálculo concluído: ${updatedCount}/${managers.length} gerentes atualizados`)

    return NextResponse.json({
      success: true,
      message: `Saldos recalculados com sucesso`,
      total_managers: managers.length,
      updated_count: updatedCount,
      results: results,
    })
  } catch (error) {
    console.error("❌ Erro ao recalcular saldos dos gerentes:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
