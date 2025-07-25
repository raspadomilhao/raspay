import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getUserTransactions } from "@/lib/database"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function getUserFromRequest(request: NextRequest) {
  // Tentar obter token do cookie primeiro
  let token = request.cookies.get("auth-token")?.value

  // Se não encontrar no cookie, tentar no header Authorization
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    throw new Error("Token não encontrado")
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.userId as number
  } catch (error) {
    throw new Error("Token inválido")
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)

    // Buscar apenas transações de saque
    const transactions = await getUserTransactions(userId, 50)
    const withdrawTransactions = transactions.filter((t) => t.type === "withdraw")

    console.log(`📋 Encontradas ${withdrawTransactions.length} transações de saque para usuário ${userId}`)

    return NextResponse.json({
      success: true,
      withdraws: withdrawTransactions, // Mudança aqui: usar 'withdraws' em vez de 'transactions'
      total: withdrawTransactions.length,
    })
  } catch (error) {
    console.error("Erro ao buscar histórico de saques:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
