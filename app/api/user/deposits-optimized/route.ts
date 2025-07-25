import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getUserDepositsOptimized } from "@/lib/database-optimized"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload.userId as number
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await getUserDepositsOptimized(userId)

    return NextResponse.json({
      success: true,
      deposits: data.deposits,
      total_deposited: data.total_deposited,
      bonus_50_claimed: data.bonus_50_claimed,
      bonus_100_claimed: data.bonus_100_claimed,
    })
  } catch (error) {
    console.error("Erro ao buscar depósitos otimizados:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
