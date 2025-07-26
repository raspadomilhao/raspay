import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook HorsePay recebido")

    const body = await request.json()
    console.log("📦 Dados do webhook:", body)

    const { external_id, status, amount, end_to_end_id } = body

    if (!external_id) {
      console.error("❌ External ID não fornecido no webhook")
      return NextResponse.json({ error: "External ID obrigatório" }, { status: 400 })
    }

    // Buscar transação pelo external_id
    const [transaction] = await sql`
      SELECT * FROM transactions 
      WHERE external_id = ${external_id}
    `

    if (!transaction) {
      console.error(`❌ Transação não encontrada para external_id: ${external_id}`)
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    console.log(`🔍 Transação encontrada: ${transaction.id} - Status atual: ${transaction.status}`)

    // Processar diferentes status
    if (status === "success") {
      console.log(`✅ Saque aprovado - External ID: ${external_id}`)

      // Atualizar status da transação
      await sql`
        UPDATE transactions 
        SET status = 'approved', 
            end_to_end_id = ${end_to_end_id || transaction.end_to_end_id},
            updated_at = NOW()
        WHERE external_id = ${external_id}
      `

      console.log(`✅ Status atualizado para aprovado - Transação: ${transaction.id}`)
    } else if (status === "refunded" || status === "failed") {
      console.log(`❌ Saque ${status} - External ID: ${external_id}`)

      // Devolver valor ao saldo do usuário
      await sql`
        UPDATE wallets 
        SET balance = balance + ${transaction.amount}
        WHERE user_id = ${transaction.user_id}
      `

      // Atualizar status da transação
      await sql`
        UPDATE transactions 
        SET status = 'failed',
            updated_at = NOW()
        WHERE external_id = ${external_id}
      `

      // Criar transação de devolução
      await sql`
        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
        VALUES (
          ${transaction.user_id}, 
          'deposit', 
          ${transaction.amount}, 
          'approved',
          ${`Devolução de saque ${status} - External ID: ${external_id}`},
          NOW()
        )
      `

      console.log(`💰 Valor devolvido ao saldo - Usuário: ${transaction.user_id}, Valor: R$ ${transaction.amount}`)
    } else {
      console.log(`🔄 Status atualizado para: ${status} - External ID: ${external_id}`)

      // Atualizar apenas o status
      await sql`
        UPDATE transactions 
        SET status = ${status},
            updated_at = NOW()
        WHERE external_id = ${external_id}
      `
    }

    return NextResponse.json({ success: true, message: "Webhook processado com sucesso" })
  } catch (error) {
    console.error("❌ Erro ao processar webhook HorsePay:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
