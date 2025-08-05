import { type NextRequest, NextResponse } from "next/server"
import { processManagerWithdraw } from "@/lib/database-managers"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando processamento de saque de gerente...")

    // Verificar autenticação admin - usando a mesma lógica das outras rotas
    const adminToken = request.headers.get("X-Admin-Token")
    console.log("🔍 Token recebido:", adminToken ? "presente" : "ausente")

    if (!adminToken) {
      console.log("❌ Token não fornecido")
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📋 Dados recebidos:", body)

    const { withdraw_id, action, admin_notes } = body

    if (!withdraw_id || !action) {
      console.log("❌ Dados obrigatórios ausentes")
      return NextResponse.json({ error: "withdraw_id e action são obrigatórios" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      console.log("❌ Ação inválida:", action)
      return NextResponse.json({ error: "Ação deve ser 'approve' ou 'reject'" }, { status: 400 })
    }

    console.log(`🔄 Processando saque do gerente - ID: ${withdraw_id}, Ação: ${action}`)

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
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
