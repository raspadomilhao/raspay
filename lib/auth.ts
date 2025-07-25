import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function verifyAuth(
  request: NextRequest,
): Promise<{ userId: number; email: string; userType: string } | null> {
  try {
    // Primeiro tentar obter token do cookie
    let token = request.cookies.get("auth-token")?.value

    // Se não encontrar no cookie, tentar no header Authorization
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      console.log("❌ Token não encontrado")
      return null
    }

    console.log("🔍 Verificando token...")

    const { payload } = await jwtVerify(token, secret)

    console.log("✅ Token válido:", payload)

    return {
      userId: payload.userId as number,
      email: payload.email as string,
      userType: (payload.userType as string) || "regular",
    }
  } catch (error) {
    console.error("❌ Erro na verificação de auth:", error)
    return null
  }
}

export function createAuthResponse(error: string, status = 401) {
  return Response.json({ error }, { status })
}
