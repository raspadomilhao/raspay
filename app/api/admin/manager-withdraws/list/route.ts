import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getAllManagerWithdraws } from "@/lib/database-managers"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando a função padrão
    const authResult = await verifyAuth(request)
    if (!authResult) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 })
    }

    // Verificar se é admin (pode ser através do userType ou token específico)
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken || adminToken !== "admin-authenticated") {
      return NextResponse.json({ error: "Acesso negado - Admin requerido" }, { status: 401 })
    }

    const withdraws = await getAllManagerWithdraws()

    return NextResponse.json({
      success: true,
      withdraws,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar saques de gerentes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
