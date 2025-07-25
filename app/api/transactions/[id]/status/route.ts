import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { sql } from "@/lib/database"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAuth(request: NextRequest) {
  try {
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
      console.log("[SERVER] ❌ Token não encontrado")
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    console.log("[SERVER] ✅ Token válido para userId:", payload.userId)
    return { userId: payload.userId as number }
  } catch (error) {
    console.log("[SERVER] ❌ Erro ao verificar token:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const externalId = params.id
    console.log(`[SERVER] 🔍 API Status - Verificando transação: ${externalId}`)

    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Usar EXATAMENTE a mesma query que o webhook usa
    const [transaction] = await sql`
      SELECT id, user_id, amount, status, external_id, created_at
      FROM transactions 
      WHERE external_id = ${externalId} 
      AND type = 'deposit'
      AND user_id = ${auth.userId}
    `

    if (!transaction) {
      console.log(`[SERVER] ❌ Transação não encontrada: ${externalId}`)
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    console.log(`[SERVER] 📊 Transação encontrada:`, {
      id: transaction.id,
      status: transaction.status,
      external_id: transaction.external_id,
    })

    // Usar EXATAMENTE a mesma condição que o webhook usa
    const processed = transaction.status === "success"

    const response = {
      processed,
      status: transaction.status,
      amount: Number.parseFloat(transaction.amount.toString()),
      external_id: transaction.external_id,
      created_at: transaction.created_at,
    }

    console.log(`[SERVER] 📤 Resposta:`, response)

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[SERVER] ❌ Erro ao verificar status da transação:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
