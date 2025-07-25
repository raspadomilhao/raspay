import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Capturar códigos de afiliado de diferentes parâmetros
  const affiliateCode = searchParams.get("ref") || searchParams.get("affiliate") || searchParams.get("aff")

  if (affiliateCode) {
    console.log("🔗 Código de afiliado capturado:", affiliateCode)

    const response = NextResponse.next()

    // Definir cookie com o código do afiliado por 30 dias
    response.cookies.set("affiliate_ref", affiliateCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      httpOnly: false, // Permitir acesso via JavaScript se necessário
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    console.log("✅ Cookie affiliate_ref definido:", affiliateCode)
    return response
  }

  // Para rotas de afiliado, não fazer nenhuma interferência
  if (pathname.startsWith("/affiliate/") || pathname.startsWith("/api/affiliate/")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
