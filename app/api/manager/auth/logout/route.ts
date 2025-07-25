import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("🚪 Manager Logout: Processando logout")

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro no logout do gerente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
