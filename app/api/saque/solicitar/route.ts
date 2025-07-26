import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { createTransaction, getUserWallet, updateWalletBalance, sql } from "@/lib/database"
import { config } from "@/lib/config"

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

// Função para obter token de autenticação da HorsePay
async function getHorsePayToken(): Promise<string> {
  console.log("🔐 Obtendo token de autenticação da HorsePay...")

  // Verificar se as credenciais estão configuradas
  const clientKey = process.env.HORSEPAY_CLIENT_KEY || process.env.NEXT_PUBLIC_HORSEPAY_CLIENT_KEY
  const clientSecret = process.env.HORSEPAY_CLIENT_SECRET

  console.log("🔑 Client Key:", clientKey ? `${clientKey.substring(0, 10)}...` : "Não configurado")
  console.log("🔑 Client Secret:", clientSecret ? "Configurado" : "Não configurado")

  if (!clientKey || !clientSecret) {
    throw new Error("Credenciais da HorsePay não configuradas nas variáveis de ambiente")
  }

  try {
    const authPayload = {
      client_key: clientKey,
      client_secret: clientSecret,
    }

    console.log("📤 Enviando requisição de autenticação para:", `${config.horsepay.apiUrl}/auth`)
    console.log("📦 Payload:", { client_key: clientKey.substring(0, 10) + "...", client_secret: "***" })

    const authResponse = await fetch(`${config.horsepay.apiUrl}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "RasPay/1.0",
      },
      body: JSON.stringify(authPayload),
    })

    console.log("📡 Status da resposta de autenticação:", authResponse.status)
    console.log("📋 Headers da resposta:", Object.fromEntries(authResponse.headers.entries()))

    const responseText = await authResponse.text()
    console.log("📄 Resposta completa:", responseText)

    if (!authResponse.ok) {
      console.error("❌ Erro na autenticação HorsePay:", responseText)
      throw new Error(`Erro na autenticação HorsePay: ${authResponse.status} - ${responseText}`)
    }

    let authData
    try {
      authData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse da resposta:", parseError)
      throw new Error(`Resposta inválida da API: ${responseText}`)
    }

    console.log("✅ Resposta de autenticação recebida:", {
      hasToken: !!authData.token,
      tokenLength: authData.token?.length || 0,
      keys: Object.keys(authData),
    })

    if (!authData.token) {
      console.error("❌ Token não retornado pela API:", authData)
      throw new Error("Token não retornado pela API da HorsePay")
    }

    return authData.token
  } catch (error) {
    console.error("❌ Erro ao obter token HorsePay:", error)
    throw error
  }
}

// Função para criar saque na HorsePay
async function createHorsePayWithdraw(data: {
  amount: number
  pix_key: string
  pix_type: string
  callback_url: string
}): Promise<{
  external_id: number
  end_to_end_id?: string
  amount: number
  status: string
}> {
  console.log("💸 Criando saque na HorsePay:", {
    amount: data.amount,
    pix_key: data.pix_key,
    pix_type: data.pix_type,
    callback_url: data.callback_url,
  })

  try {
    // Obter token de autenticação
    const token = await getHorsePayToken()
    console.log("🔑 Token obtido:", token.substring(0, 20) + "...")

    const withdrawPayload = {
      amount: data.amount,
      pix_key: data.pix_key,
      pix_type: data.pix_type.toUpperCase(),
      callback_url: data.callback_url,
    }

    console.log("📤 Enviando requisição de saque para:", `${config.horsepay.apiUrl}/transaction/withdraw`)
    console.log("📦 Payload do saque:", withdrawPayload)

    // Fazer requisição de saque
    const withdrawResponse = await fetch(`${config.horsepay.apiUrl}/transaction/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "RasPay/1.0",
      },
      body: JSON.stringify(withdrawPayload),
    })

    console.log("📡 Status da resposta de saque:", withdrawResponse.status)
    console.log("📋 Headers da resposta:", Object.fromEntries(withdrawResponse.headers.entries()))

    const responseText = await withdrawResponse.text()
    console.log("📄 Resposta completa do saque:", responseText)

    if (!withdrawResponse.ok) {
      console.error("❌ Erro na criação do saque HorsePay:", responseText)
      throw new Error(`Erro na HorsePay: ${withdrawResponse.status} - ${responseText}`)
    }

    let withdrawData
    try {
      withdrawData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse da resposta do saque:", parseError)
      throw new Error(`Resposta inválida da API: ${responseText}`)
    }

    console.log("✅ Saque criado na HorsePay:", withdrawData)

    return {
      external_id: withdrawData.external_id,
      end_to_end_id: withdrawData.end_to_end_id,
      amount: withdrawData.amount,
      status: withdrawData.status || "pending",
    }
  } catch (error) {
    console.error("❌ Erro ao criar saque na HorsePay:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request)
    const { amount, pix_key, pix_type } = await request.json()

    console.log(`💸 Nova solicitação de saque - Usuário: ${userId}, Valor: R$ ${amount}`)

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

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

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
    console.log(`💰 Debitando R$ ${amount} do saldo do usuário ${userId}`)
    await updateWalletBalance(userId, amount, "subtract")

    let horsePayData = null
    let transactionStatus = "pending"
    let externalId = null
    let endToEndId = null

    // Se o usuário for blogger, processar automaticamente sem HorsePay
    if (user.user_type === "blogger") {
      console.log(`🤖 Usuário blogger detectado - processamento automático em 10s para ${user.name}`)

      // Criar transação local sem external_id (processamento interno)
      const transaction = await createTransaction({
        user_id: userId,
        type: "withdraw",
        amount,
        status: "pending",
        pix_key,
        pix_type,
        description: `Saque via PIX - ${pix_type}: ${pix_key} (Blogger - Processamento Automático)`,
      })

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

      return NextResponse.json({
        success: true,
        transaction,
        message: "Solicitação de saque criada com sucesso! (Processamento automático)",
        is_blogger: true,
      })
    }

    // Verificar se as credenciais da HorsePay estão configuradas
    const clientKey = process.env.HORSEPAY_CLIENT_KEY || process.env.NEXT_PUBLIC_HORSEPAY_CLIENT_KEY
    const clientSecret = process.env.HORSEPAY_CLIENT_SECRET

    if (!clientKey || !clientSecret) {
      console.log(`⚠️ Credenciais HorsePay não configuradas - processamento manual`)

      // Criar transação para processamento manual
      const transaction = await createTransaction({
        user_id: userId,
        type: "withdraw",
        amount,
        status: "pending",
        pix_key,
        pix_type,
        description: `Saque via PIX - ${pix_type}: ${pix_key} (Processamento Manual)`,
      })

      return NextResponse.json({
        success: true,
        transaction,
        message: "Solicitação de saque criada com sucesso! Será processada manualmente.",
        manual_processing: true,
      })
    }

    // Para usuários normais, integrar com HorsePay
    try {
      console.log(`🏦 Criando saque na HorsePay para usuário normal...`)

      // Criar callback URL
      const callbackUrl = `${config.baseUrl}/api/webhook/horsepay`

      // Criar saque na HorsePay
      horsePayData = await createHorsePayWithdraw({
        amount,
        pix_key,
        pix_type,
        callback_url: callbackUrl,
      })

      externalId = horsePayData.external_id
      endToEndId = horsePayData.end_to_end_id
      transactionStatus = horsePayData.status

      console.log(`✅ Saque criado na HorsePay - External ID: ${externalId}`)
    } catch (horsePayError) {
      console.error(`❌ Erro ao criar saque na HorsePay:`, horsePayError)

      // Reverter o débito do saldo em caso de erro
      console.log(`🔄 Revertendo débito do saldo devido ao erro na HorsePay`)
      await updateWalletBalance(userId, amount, "add")

      return NextResponse.json(
        {
          error: "Erro ao processar saque. Tente novamente em alguns minutos.",
          details: horsePayError instanceof Error ? horsePayError.message : "Erro desconhecido",
        },
        { status: 500 },
      )
    }

    // Criar transação no banco com dados da HorsePay
    const transaction = await createTransaction({
      user_id: userId,
      type: "withdraw",
      amount,
      status: transactionStatus,
      external_id: externalId,
      end_to_end_id: endToEndId,
      pix_key,
      pix_type,
      callback_url: `${config.baseUrl}/api/webhook/horsepay`,
      description: `Saque via PIX - ${pix_type}: ${pix_key}`,
    })

    console.log(`✅ Transação de saque criada - ID: ${transaction.id}, External ID: ${externalId}`)

    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        external_id: externalId,
        end_to_end_id: endToEndId,
      },
      horsepay_data: horsePayData,
      message: "Solicitação de saque enviada para processamento!",
    })
  } catch (error) {
    console.error("❌ Erro ao solicitar saque:", error)

    // Em caso de erro, tentar reverter o saldo se possível
    try {
      const userId = await getUserFromRequest(request)
      const { amount } = await request.json()
      if (userId && amount) {
        console.log(`🔄 Tentando reverter saldo devido ao erro`)
        await updateWalletBalance(userId, amount, "add")
      }
    } catch (revertError) {
      console.error("❌ Erro ao reverter saldo:", revertError)
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
