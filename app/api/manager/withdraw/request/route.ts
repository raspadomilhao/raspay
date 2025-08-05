import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("💸 API: Solicitando saque do gerente")

    // Verificar token JWT
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token não fornecido")
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload

    try {
      const result = await jwtVerify(token, JWT_SECRET)
      payload = result.payload
    } catch (jwtError) {
      console.log("❌ Token inválido:", jwtError)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    if (payload.type !== "manager") {
      console.log("❌ Tipo de usuário inválido:", payload.type)
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.log("❌ Erro ao parsear JSON:", parseError)
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { amount, pix_key, pix_type } = body

    console.log("📝 Dados do saque:", { amount, pix_key, pix_type, managerId: payload.managerId })

    // Validações básicas
    if (!amount || !pix_key || !pix_type) {
      console.log("❌ Dados obrigatórios faltando")
      return NextResponse.json({ error: "Valor, chave PIX e tipo são obrigatórios" }, { status: 400 })
    }

    const withdrawAmount = Number.parseFloat(amount)

    if (isNaN(withdrawAmount) || withdrawAmount < 10) {
      console.log("❌ Valor inválido:", withdrawAmount)
      return NextResponse.json({ error: "Valor mínimo para saque é R$ 10,00" }, { status: 400 })
    }

    // 🔒 VALIDAÇÃO CRÍTICA: Verificar saldo atual do gerente
    let manager
    try {
      const managers = await sql`
        SELECT id, name, email, balance 
        FROM managers 
        WHERE id = ${payload.managerId as number}
      `
      manager = managers[0]
    } catch (dbError) {
      console.error("❌ Erro ao buscar gerente:", dbError)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    if (!manager) {
      console.log("❌ Gerente não encontrado:", payload.managerId)
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    const currentBalance = Number.parseFloat(manager.balance.toString())
    console.log(`💰 Saldo atual do gerente: R$ ${currentBalance.toFixed(2)}`)
    console.log(`💸 Valor solicitado: R$ ${withdrawAmount.toFixed(2)}`)

    if (currentBalance < withdrawAmount) {
      console.log("❌ Saldo insuficiente")
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Saldo disponível: R$ ${currentBalance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // ✅ Criar saque e deduzir do saldo em uma transação
    let withdraw
    let newBalance
    try {
      // Iniciar transação
      await sql`BEGIN`

      // Criar o saque
      const withdrawResult = await sql`
        INSERT INTO manager_withdraws (manager_id, amount, pix_key, pix_type, status, created_at)
        VALUES (${payload.managerId as number}, ${withdrawAmount}, ${pix_key}, ${pix_type}, 'pending', NOW())
        RETURNING *
      `
      withdraw = withdrawResult[0]

      // Deduzir do saldo do gerente
      await sql`
        UPDATE managers 
        SET balance = balance - ${withdrawAmount}
        WHERE id = ${payload.managerId as number}
      `

      // Buscar o saldo atualizado
      const updatedManagers = await sql`
        SELECT balance FROM managers WHERE id = ${payload.managerId as number}
      `
      newBalance = Number.parseFloat(updatedManagers[0].balance.toString())

      // Confirmar transação
      await sql`COMMIT`

      console.log(`✅ Solicitação de saque criada e valor deduzido do saldo`)
      console.log(`💰 Novo saldo: R$ ${newBalance.toFixed(2)}`)
    } catch (withdrawError) {
      // Reverter transação em caso de erro
      await sql`ROLLBACK`
      console.error("❌ Erro ao processar saque:", withdrawError)
      return NextResponse.json({ error: "Erro ao processar saque" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Solicitação de saque de R$ ${withdrawAmount.toFixed(2)} criada com sucesso! O valor foi deduzido do seu saldo.`,
      withdraw,
      old_balance: currentBalance,
      new_balance: newBalance,
    })
  } catch (error) {
    console.error("❌ Erro geral ao solicitar saque:", error)

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
