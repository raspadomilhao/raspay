import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("🚪 Logout do afiliado realizado")

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro no logout do afiliado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
