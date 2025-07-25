import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { updateWalletBalance, sql } from "@/lib/database"

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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    const { transaction_id } = await request.json()

    if (!transaction_id) {
      return NextResponse.json({ error: "ID da transação é obrigatório" }, { status: 400 })
    }

    // Buscar a transação
    const [transaction] = await sql`
      SELECT * FROM transactions 
      WHERE id = ${transaction_id} AND user_id = ${userId} AND type = 'withdraw'
    `

    if (!transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json(
        {
          error: "Apenas saques pendentes podem ser cancelados",
        },
        { status: 400 },
      )
    }

    // Reembolsar o valor
    await updateWalletBalance(userId, Number.parseFloat(transaction.amount), "add")

    // Atualizar status da transação
    await sql`
      UPDATE transactions 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${transaction_id}
    `

    return NextResponse.json({
      success: true,
      message: "Saque cancelado com sucesso! O valor foi reembolsado.",
    })
  } catch (error) {
    console.error("Erro ao cancelar saque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
