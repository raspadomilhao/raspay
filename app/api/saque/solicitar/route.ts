import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { createTransaction, getUserWallet, updateWalletBalance, sql } from "@/lib/database"

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
    const { amount, pix_key, pix_type } = await request.json()

    // Validar dados de entrada
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    if (!pix_key || !pix_type) {
      return NextResponse.json({ error: "Chave PIX é obrigatória" }, { status: 400 })
    }

    // Buscar informações do usuário
    const [user] = await sql`
      SELECT user_type, name FROM users WHERE id = ${userId}
    `

    // Buscar valor mínimo de saque das configurações
    const [minWithdrawSetting] = await sql`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'min_withdraw_amount'
    `

    const minWithdraw = minWithdrawSetting ? Number.parseFloat(minWithdrawSetting.setting_value) : 10.0

    if (amount < minWithdraw) {
      return NextResponse.json(
        {
          error: `Valor mínimo para saque é R$ ${minWithdraw.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Verificar saldo
    const wallet = await getUserWallet(userId)
    if (!wallet || Number.parseFloat(wallet.balance.toString()) < amount) {
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
    }

    // Verificar se já existe saque pendente
    const [pendingWithdraw] = await sql`
      SELECT id FROM transactions 
      WHERE user_id = ${userId} AND type = 'withdraw' AND status = 'pending'
    `

    if (pendingWithdraw) {
      return NextResponse.json(
        {
          error: "Você já possui um saque pendente. Aguarde o processamento ou cancele-o.",
        },
        { status: 400 },
      )
    }

    // Debitar o valor do saldo imediatamente
    await updateWalletBalance(userId, amount, "subtract")

    // Criar transação de saque
    const transaction = await createTransaction({
      user_id: userId,
      type: "withdraw",
      amount,
      status: "pending",
      pix_key,
      pix_type,
      description: `Saque via PIX - ${pix_type}: ${pix_key}`,
    })

    // Se o usuário for blogger, processar automaticamente em 10 segundos
    if (user && user.user_type === "blogger") {
      console.log(`🤖 Usuário blogger detectado - processamento automático em 10s para ${user.name}`)

      // Processar automaticamente após 10 segundos
      setTimeout(async () => {
        try {
          console.log(`🔄 Processando saque automático para blogger ${user.name} - Transação ${transaction.id}`)

          // Atualizar status da transação para aprovado
          await sql`
            UPDATE transactions 
            SET status = 'approved', updated_at = NOW()
            WHERE id = ${transaction.id}
          `

          console.log(`✅ Saque automático processado para blogger ${user.name} - Transação ${transaction.id}`)
        } catch (error) {
          console.error(`❌ Erro no processamento automático do saque:`, error)
        }
      }, 10000) // 10 segundos
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: "Solicitação de saque criada com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao solicitar saque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
