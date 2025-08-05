import { type NextRequest, NextResponse } from "next/server"
import { getAllManagerWithdraws } from "@/lib/database-managers"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Verificando acesso à lista de saques de gerentes...")

    // Verificar token de admin
    const adminToken = request.headers.get("X-Admin-Token")
    console.log("🔑 Token recebido:", adminToken ? "Presente" : "Ausente")

    if (!adminToken) {
      console.log("❌ Token de admin não fornecido")
      return NextResponse.json({ error: "Token de admin requerido" }, { status: 401 })
    }

    // Verificar se o token é válido
    const validTokens = ["admin-authenticated", "admin-full-access", "admin-managers-only"]
    if (!validTokens.includes(adminToken)) {
      console.log("❌ Token de admin inválido:", adminToken)
      return NextResponse.json({ error: "Token de admin inválido" }, { status: 401 })
    }

    console.log("✅ Token de admin válido, buscando saques de gerentes...")

    const withdraws = await getAllManagerWithdraws()

    console.log("📊 Saques de gerentes encontrados:", withdraws.length)

    return NextResponse.json({
      success: true,
      withdraws,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar saques de gerentes:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
