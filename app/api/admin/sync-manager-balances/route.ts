import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🔄 Iniciando sincronização dos saldos dos gerentes...")

    // Buscar todos os gerentes ativos
    const managers = await sql`
      SELECT id, name, commission_rate FROM managers WHERE status = 'active'
    `

    console.log(`📊 Encontrados ${managers.length} gerentes para sincronizar`)

    for (const manager of managers) {
      // Calcular o total ganho pelos afiliados deste gerente
      const [affiliateStats] = await sql`
        SELECT COALESCE(SUM(total_earnings), 0) as total_affiliate_earnings
        FROM affiliates 
        WHERE manager_id = ${manager.id}
      `

      const totalAffiliateEarnings = Number(affiliateStats.total_affiliate_earnings) || 0
      const commissionRate = Number(manager.commission_rate) || 5.0
      const calculatedBalance = (totalAffiliateEarnings * commissionRate) / 100

      // Atualizar o saldo do gerente
      await sql`
        UPDATE managers 
        SET balance = ${calculatedBalance},
            total_earnings = ${calculatedBalance},
            updated_at = NOW()
        WHERE id = ${manager.id}
      `

      console.log(
        `✅ Gerente ${manager.name}: R$ ${calculatedBalance.toFixed(2)} (${commissionRate}% de R$ ${totalAffiliateEarnings.toFixed(2)})`,
      )
    }

    console.log("🎉 Sincronização concluída com sucesso!")

    return NextResponse.json({
      success: true,
      message: `${managers.length} gerentes sincronizados com sucesso`,
      managers_updated: managers.length,
    })
  } catch (error) {
    console.error("❌ Erro na sincronização:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
