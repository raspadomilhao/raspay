import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getUserProfileComplete } from "@/lib/database-optimized"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload.userId as number
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request)
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const profile = await getUserProfileComplete(userId)

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Erro ao buscar perfil completo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
