import { type NextRequest, NextResponse } from "next/server"
import { processAffiliateWithdraw } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get("affiliate-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const affiliateId = payload.affiliateId as number

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valor inválido" }, { status: 400 })
    }

    // Processar saque (só afeta balance, não total_earnings)
    await processAffiliateWithdraw(affiliateId, amount)

    return NextResponse.json({
      success: true,
      message: `Saque de R$ ${amount.toFixed(2)} processado com sucesso`,
    })
  } catch (error) {
    console.error("Erro ao processar saque:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
