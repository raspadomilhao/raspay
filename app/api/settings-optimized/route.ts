import { NextResponse } from "next/server"
import { getSystemSettings } from "@/lib/database-optimized"

export async function GET() {
  try {
    const settings = await getSystemSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
