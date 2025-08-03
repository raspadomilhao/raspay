import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { AuthClient } from "@/lib/auth-client"

// Função para enviar notificação
async function sendAdminNotification(payload: {
  type: "withdraw" | "deposit"
  title: string
  body: string
  data?: any
}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/admin/notifications/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    if (response.ok) {
      console.log("🔔 Notificação admin enviada:", payload.title)
    } else {
      console.error("❌ Erro ao enviar notificação admin:", response.status)
    }
  } catch (error) {
    console.error("❌ Erro ao enviar notificação admin:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthClient.getCurrentUser(request)
    if (!user || user.user_type !== "manager") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { amount, pix_key, pix_type } = await request.json()

    console.log(`💸 Solicitação de saque do gerente ${user.id}:`, { amount, pix_key, pix_type })

    // Validações
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    if (!pix_key || !pix_type) {
      return NextResponse.json({ error: "Chave PIX é obrigatória" }, { status: 400 })
    }

    // Verificar saldo do gerente
    const [manager] = await sql`
      SELECT balance FROM managers WHERE id = ${user.id}
    `

    if (!manager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    const currentBalance = Number.parseFloat(manager.balance.toString()) || 0

    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: "Saldo insuficiente",
          current_balance: currentBalance,
          requested_amount: amount,
        },
        { status: 400 },
      )
    }

    // Verificar valor mínimo de saque
    const minWithdrawAmount = 20.0 // R$ 20,00 mínimo para gerentes
    if (amount < minWithdrawAmount) {
      return NextResponse.json(
        { error: `Valor mínimo para saque é R$ ${minWithdrawAmount.toFixed(2)}` },
        { status: 400 },
      )
    }

    // Criar solicitação de saque
    const [withdraw] = await sql`
      INSERT INTO manager_withdraws (manager_id, amount, pix_key, pix_type, status)
      VALUES (${user.id}, ${amount}, ${pix_key}, ${pix_type}, 'pending')
      RETURNING *
    `

    console.log(`✅ Solicitação de saque criada:`, withdraw)

    // Buscar dados do gerente para a notificação
    const [managerData] = await sql`
      SELECT name, email, username FROM managers WHERE id = ${user.id}
    `

    // 🔔 ENVIAR NOTIFICAÇÃO DE NOVO SAQUE PENDENTE
    await sendAdminNotification({
      type: "withdraw",
      title: "💸 Novo Saque de Gerente",
      body: `${managerData.name} solicitou saque de R$ ${amount.toFixed(2)}`,
      data: {
        type: "withdraw",
        withdrawType: "manager",
        withdrawId: withdraw.id,
        managerId: user.id,
        managerName: managerData.name,
        managerEmail: managerData.email,
        managerUsername: managerData.username,
        amount: amount,
        pixKey: pix_key,
        pixType: pix_type,
        timestamp: Date.now(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Solicitação de saque enviada com sucesso",
      withdraw: {
        id: withdraw.id,
        amount: withdraw.amount,
        pix_key: withdraw.pix_key,
        pix_type: withdraw.pix_type,
        status: withdraw.status,
        created_at: withdraw.created_at,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao processar solicitação de saque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
