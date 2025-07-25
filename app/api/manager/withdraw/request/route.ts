import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { createManagerWithdraw, getManagerById } from "@/lib/database-managers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function POST(request: NextRequest) {
  try {
    console.log("💸 API: Solicitando saque do gerente")

    // Verificar token JWT
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, JWT_SECRET)

    if (payload.type !== "manager") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { amount, pix_key, pix_type } = body

    console.log("📝 Dados do saque:", { amount, pix_key, pix_type, managerId: payload.managerId })

    // Validações básicas
    if (!amount || !pix_key || !pix_type) {
      return NextResponse.json({ error: "Valor, chave PIX e tipo são obrigatórios" }, { status: 400 })
    }

    const withdrawAmount = Number.parseFloat(amount)

    if (isNaN(withdrawAmount) || withdrawAmount < 10) {
      return NextResponse.json({ error: "Valor mínimo para saque é R$ 10,00" }, { status: 400 })
    }

    // 🔒 VALIDAÇÃO CRÍTICA: Verificar saldo atual do gerente
    const manager = await getManagerById(payload.managerId as number)
    if (!manager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    const currentBalance = Number.parseFloat(manager.balance.toString())
    console.log(`💰 Saldo atual do gerente: R$ ${currentBalance.toFixed(2)}`)
    console.log(`💸 Valor solicitado: R$ ${withdrawAmount.toFixed(2)}`)

    if (currentBalance < withdrawAmount) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Saldo disponível: R$ ${currentBalance.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // ✅ Criar saque (já deduz automaticamente do saldo)
    const withdraw = await createManagerWithdraw({
      manager_id: payload.managerId as number,
      amount: withdrawAmount,
      pix_key,
      pix_type,
    })

    // Buscar o saldo atualizado
    const updatedManager = await getManagerById(payload.managerId as number)
    const newBalance = updatedManager ? Number.parseFloat(updatedManager.balance.toString()) : 0

    console.log(`✅ Solicitação de saque criada e valor deduzido do saldo`)
    console.log(`💰 Novo saldo: R$ ${newBalance.toFixed(2)}`)

    return NextResponse.json({
      success: true,
      message: `Solicitação de saque de R$ ${withdrawAmount.toFixed(2)} criada com sucesso! O valor foi deduzido do seu saldo.`,
      withdraw,
      old_balance: currentBalance,
      new_balance: newBalance,
    })
  } catch (error) {
    console.error("❌ Erro ao solicitar saque:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao solicitar saque",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
