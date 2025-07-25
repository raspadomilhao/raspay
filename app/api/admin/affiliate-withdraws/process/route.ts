import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Processando ação de saque de afiliado...")

    const { withdraw_id, action, admin_notes } = await request.json()

    console.log("📋 Dados recebidos:", { withdraw_id, action, admin_notes })

    // Validações
    if (!withdraw_id || !action) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    // Buscar a solicitação de saque
    const [withdraw] = await sql`
      SELECT aw.*, a.name as affiliate_name, a.balance as affiliate_balance
      FROM affiliate_withdraws aw
      JOIN affiliates a ON a.id = aw.affiliate_id
      WHERE aw.id = ${withdraw_id}
    `

    if (!withdraw) {
      return NextResponse.json({ error: "Solicitação de saque não encontrada" }, { status: 404 })
    }

    if (withdraw.status !== "pending") {
      return NextResponse.json({ error: "Esta solicitação já foi processada" }, { status: 400 })
    }

    console.log(`💰 Saque encontrado: R$ ${Number(withdraw.amount).toFixed(2)} - Status: ${withdraw.status}`)

    // Iniciar transação
    await sql`BEGIN`

    try {
      if (action === "approve") {
        // Aprovar saque - não altera saldo (já foi debitado)
        await sql`
          UPDATE affiliate_withdraws 
          SET 
            status = 'approved',
            processed_at = NOW(),
            admin_notes = ${admin_notes || null}
          WHERE id = ${withdraw_id}
        `

        console.log("✅ Saque aprovado - saldo já havia sido debitado")
      } else if (action === "reject") {
        // Rejeitar saque - devolver valor ao saldo
        const currentBalance = Number(withdraw.affiliate_balance) || 0
        const refundAmount = Number(withdraw.amount)
        const newBalance = currentBalance + refundAmount

        console.log(`🔄 Devolvendo saldo: ${currentBalance} + ${refundAmount} = ${newBalance}`)

        await sql`
          UPDATE affiliates 
          SET balance = ${newBalance}
          WHERE id = ${withdraw.affiliate_id}
        `

        await sql`
          UPDATE affiliate_withdraws 
          SET 
            status = 'rejected',
            processed_at = NOW(),
            admin_notes = ${admin_notes || null}
          WHERE id = ${withdraw_id}
        `

        console.log("✅ Saque rejeitado - valor devolvido ao saldo")
      }

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: `Saque ${action === "approve" ? "aprovado" : "rejeitado"} com sucesso`,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("❌ Erro ao processar saque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
