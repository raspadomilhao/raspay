import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando processamento de saque de afiliado...")

    // Verificar autenticação admin
    const adminToken = request.headers.get("X-Admin-Token")
    console.log("🔐 Token recebido:", adminToken ? "Presente" : "Ausente")

    if (!adminToken || (!adminToken.startsWith("admin-") && !adminToken.startsWith("manager-"))) {
      console.log("❌ Token de admin inválido:", adminToken)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Dados recebidos:", body)

    const { withdraw_id, action, admin_notes } = body

    if (!withdraw_id || !action) {
      console.log("❌ Dados obrigatórios ausentes:", { withdraw_id, action })
      return NextResponse.json({ error: "withdraw_id e action são obrigatórios" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      console.log("❌ Ação inválida:", action)
      return NextResponse.json({ error: "Ação deve ser 'approve' ou 'reject'" }, { status: 400 })
    }

    console.log(`🔄 Processando saque ${withdraw_id} com ação: ${action}`)

    if (action === "approve") {
      // Aprovar saque
      await sql`
        UPDATE affiliate_withdraws 
        SET 
          status = 'approved',
          admin_notes = ${admin_notes || ""},
          processed_at = NOW()
        WHERE id = ${withdraw_id}
      `
      console.log(`✅ Saque ${withdraw_id} aprovado`)
    } else {
      // Rejeitar saque - devolver o valor ao saldo do afiliado
      const withdraw = await sql`
        SELECT affiliate_id, amount 
        FROM affiliate_withdraws 
        WHERE id = ${withdraw_id}
      `

      if (withdraw.length > 0) {
        const { affiliate_id, amount } = withdraw[0]

        // Devolver o valor ao saldo do afiliado
        await sql`
          UPDATE affiliates 
          SET balance = balance + ${amount}
          WHERE id = ${affiliate_id}
        `

        // Atualizar status do saque
        await sql`
          UPDATE affiliate_withdraws 
          SET 
            status = 'rejected',
            admin_notes = ${admin_notes || ""},
            processed_at = NOW()
          WHERE id = ${withdraw_id}
        `

        console.log(`✅ Saque ${withdraw_id} rejeitado e valor R$ ${amount} devolvido ao afiliado ${affiliate_id}`)
      }
    }

    const message = action === "approve" ? "Saque aprovado com sucesso!" : "Saque rejeitado com sucesso!"

    console.log(`✅ Saque do afiliado ${action === "approve" ? "aprovado" : "rejeitado"}:`, withdraw_id)

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("❌ Erro ao processar saque do afiliado:", error)

    // Garantir que sempre retornamos JSON válido
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
