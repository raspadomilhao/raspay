import { type NextRequest, NextResponse } from "next/server"
import { assignAffiliateToManager, unassignAffiliateFromManager } from "@/lib/database-managers"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken || adminToken !== "admin-authenticated") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    const body = await request.json()
    const { affiliate_id, manager_id, action } = body

    if (!affiliate_id || !action) {
      return NextResponse.json({ error: "affiliate_id e action são obrigatórios" }, { status: 400 })
    }

    let success = false
    let message = ""

    if (action === "assign") {
      if (!manager_id) {
        return NextResponse.json({ error: "manager_id é obrigatório para vincular" }, { status: 400 })
      }
      success = await assignAffiliateToManager(affiliate_id, manager_id)
      message = success ? "Afiliado vinculado ao gerente com sucesso!" : "Erro ao vincular afiliado"
    } else if (action === "unassign") {
      success = await unassignAffiliateFromManager(affiliate_id)
      message = success ? "Afiliado desvinculado do gerente com sucesso!" : "Erro ao desvincular afiliado"
    } else {
      return NextResponse.json({ error: "Ação inválida. Use 'assign' ou 'unassign'" }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: message }, { status: 500 })
    }

    console.log(`✅ ${message}`)

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error("❌ Erro ao gerenciar vinculação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
