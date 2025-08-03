import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Processando solicitação de saque de afiliado...")

    // Verificar token no header Authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token não encontrado no header")
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove "Bearer "

    // Verificar e decodificar token
    let payload: any
    try {
      const { payload: jwtPayload } = await jwtVerify(token, secret)
      payload = jwtPayload
      console.log("✅ Token válido para afiliado:", payload.affiliateId)
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    const affiliateId = payload.affiliateId

    // Verificar se o afiliado existe e está ativo
    const [affiliate] = await sql`
      SELECT id, name, balance FROM affiliates 
      WHERE id = ${affiliateId} AND status = 'active'
    `

    if (!affiliate) {
      console.log("❌ Afiliado não encontrado ou inativo")
      return NextResponse.json({ success: false, error: "Afiliado não encontrado" }, { status: 404 })
    }

    // Obter dados do corpo da requisição
    const { amount, pix_key, pix_type } = await request.json()

    // Validações
    if (!amount || !pix_key || !pix_type) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const withdrawAmount = Number.parseFloat(amount)
    if (withdrawAmount <= 0) {
      return NextResponse.json({ success: false, error: "Valor deve ser maior que zero" }, { status: 400 })
    }

    if (withdrawAmount < 10) {
      return NextResponse.json({ success: false, error: "Valor mínimo para saque é R$ 10,00" }, { status: 400 })
    }

    const availableBalance = Number(affiliate.balance) || 0
    console.log(`💰 Saldo disponível: R$ ${availableBalance.toFixed(2)}`)
    console.log(`💸 Valor solicitado: R$ ${withdrawAmount.toFixed(2)}`)

    if (withdrawAmount > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Iniciar transação
    await sql`BEGIN`

    try {
      // Debitar saldo imediatamente
      const newBalance = availableBalance - withdrawAmount
      console.log(`🔄 Debitando saldo: ${availableBalance} - ${withdrawAmount} = ${newBalance}`)

      await sql`
        UPDATE affiliates 
        SET balance = ${newBalance}
        WHERE id = ${affiliateId}
      `

      // Criar solicitação de saque
      const [withdrawRequest] = await sql`
        INSERT INTO affiliate_withdraws (
          affiliate_id, 
          amount, 
          pix_key, 
          pix_type, 
          status, 
          created_at
        ) VALUES (
          ${affiliateId}, 
          ${withdrawAmount}, 
          ${pix_key}, 
          ${pix_type}, 
          'pending', 
          NOW()
        )
        RETURNING *
      `

      await sql`COMMIT`

      console.log("✅ Saque solicitado com sucesso!")
      console.log(`💰 Novo saldo: R$ ${newBalance.toFixed(2)}`)

      return NextResponse.json({
        success: true,
        message: "Solicitação de saque enviada com sucesso",
        withdraw_request: withdrawRequest,
        new_balance: newBalance,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("❌ Erro na API de solicitação de saque:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
