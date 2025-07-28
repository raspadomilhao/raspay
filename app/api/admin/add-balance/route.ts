import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { updateWalletBalance, createTransaction } from "@/lib/database"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return false

    const { payload } = await jwtVerify(token, secret)
    return payload.isAdmin === true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, amount, operation } = body

    if (!user_id || !amount || !operation) {
      return NextResponse.json({ error: "Dados obrigatórios: user_id, amount, operation" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Valor deve ser maior que zero" }, { status: 400 })
    }

    if (!["add", "subtract"].includes(operation)) {
      return NextResponse.json({ error: "Operação deve ser 'add' ou 'subtract'" }, { status: 400 })
    }

    console.log(`💰 Admin ${operation === "add" ? "adicionando" : "removendo"} R$ ${amount} para usuário ${user_id}`)

    // Atualizar saldo na carteira
    const wallet = await updateWalletBalance(user_id, amount, operation)

    // Criar registro da transação
    const transactionType = operation === "add" ? "game_prize" : "game_play"
    const description =
      operation === "add"
        ? `Saldo adicionado pelo administrador: R$ ${amount.toFixed(2)}`
        : `Saldo removido pelo administrador: R$ ${amount.toFixed(2)}`

    await createTransaction({
      user_id: user_id,
      type: transactionType,
      amount: amount,
      status: "success",
      description: description,
    })

    const actionText = operation === "add" ? "adicionado" : "removido"
    const message = `Saldo ${actionText} com sucesso! Novo saldo: R$ ${Number(wallet.balance).toFixed(2)}`

    console.log(`✅ ${message}`)

    return NextResponse.json({
      message,
      new_balance: Number(wallet.balance),
    })
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
