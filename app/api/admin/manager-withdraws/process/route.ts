import { type NextRequest, NextResponse } from "next/server"
import { processManagerWithdraw } from "@/lib/database-managers"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando processamento de saque de gerente...")

    // Verificar autenticação admin
    const adminToken = request.headers.get("X-Admin-Token")
    console.log("🔐 Token recebido:", adminToken ? "Presente" : "Ausente")

    if (!adminToken || (!adminToken.startsWith("admin-") && !adminToken.startsWith("manager-"))) {
      console.log("❌ Token de admin inválido:", adminToken)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Dados recebidos:", body)

    const { withdraw_id, action, admin_notes } = body

    if (!withdraw_id || !action) {
      console.log("❌ Dados obrigatórios ausentes:", { withdraw_id, action })
      return NextResponse.json({ error: "withdraw_id e action são obrigatórios" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      console.log("❌ Ação inválida:", action)
      return NextResponse.json({ error: "Ação deve ser 'approve' ou 'reject'" }, { status: 400 })
    }

    console.log(`🔄 Processando saque ${withdraw_id} com ação: ${action}`)

    const success = await processManagerWithdraw(withdraw_id, action, admin_notes)

    if (!success) {
      console.log("❌ Falha ao processar saque")
      return NextResponse.json({ error: "Erro ao processar saque" }, { status: 500 })
    }

    const message = action === "approve" ? "Saque aprovado com sucesso!" : "Saque rejeitado com sucesso!"

    console.log(`✅ Saque do gerente ${action === "approve" ? "aprovado" : "rejeitado"}:`, withdraw_id)

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("❌ Erro ao processar saque do gerente:", error)

    // Garantir que sempre retornamos JSON válido
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
