import { type NextRequest, NextResponse } from "next/server"
import { processManagerWithdraw } from "@/lib/database-managers"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken || adminToken !== "admin-authenticated") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    const { withdraw_id, action, admin_notes } = await request.json()

    if (!withdraw_id || !action) {
      return NextResponse.json({ error: "withdraw_id e action são obrigatórios" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Ação deve ser 'approve' ou 'reject'" }, { status: 400 })
    }

    const success = await processManagerWithdraw(withdraw_id, action, admin_notes)

    if (!success) {
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
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
