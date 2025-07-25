import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Buscando histórico de saques do afiliado...")

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let affiliateId: number

    try {
      const { payload } = await jwtVerify(token, secret)
      affiliateId = payload.affiliateId as number
    } catch (error) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Buscar saques do afiliado
    const withdraws = await sql`
      SELECT * FROM affiliate_withdraws 
      WHERE affiliate_id = ${affiliateId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      withdraws,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar saques:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🔍 Cancelando saque do afiliado...")

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let affiliateId: number

    try {
      const { payload } = await jwtVerify(token, secret)
      affiliateId = payload.affiliateId as number
    } catch (error) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { withdraw_id } = await request.json()

    if (!withdraw_id) {
      return NextResponse.json({ error: "ID do saque não fornecido" }, { status: 400 })
    }

    // Buscar o saque
    const [withdraw] = await sql`
      SELECT aw.*, a.balance as affiliate_balance
      FROM affiliate_withdraws aw
      JOIN affiliates a ON a.id = aw.affiliate_id
      WHERE aw.id = ${withdraw_id} AND aw.affiliate_id = ${affiliateId}
    `

    if (!withdraw) {
      return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 })
    }

    if (withdraw.status !== "pending") {
      return NextResponse.json({ error: "Apenas saques pendentes podem ser cancelados" }, { status: 400 })
    }

    // Iniciar transação
    await sql`BEGIN`

    try {
      // Devolver valor ao saldo
      const currentBalance = Number(withdraw.affiliate_balance) || 0
      const refundAmount = Number(withdraw.amount)
      const newBalance = currentBalance + refundAmount

      console.log(`🔄 Devolvendo saldo: ${currentBalance} + ${refundAmount} = ${newBalance}`)

      await sql`
        UPDATE affiliates 
        SET balance = ${newBalance}
        WHERE id = ${affiliateId}
      `

      // Cancelar saque
      await sql`
        UPDATE affiliate_withdraws 
        SET 
          status = 'cancelled',
          processed_at = NOW(),
          admin_notes = 'Cancelado pelo afiliado'
        WHERE id = ${withdraw_id}
      `

      await sql`COMMIT`

      console.log("✅ Saque cancelado com sucesso")

      return NextResponse.json({
        success: true,
        message: "Saque cancelado com sucesso",
        new_balance: newBalance,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("❌ Erro ao cancelar saque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
