import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getAffiliateByEmail } from "@/lib/database"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("🔐 Tentativa de login do afiliado:", email)

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar afiliado
    const affiliate = await getAffiliateByEmail(email)
    if (!affiliate) {
      console.log("❌ Afiliado não encontrado:", email)
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 })
    }

    if (affiliate.status !== "active") {
      console.log("❌ Afiliado inativo:", email)
      return NextResponse.json({ success: false, error: "Conta inativa" }, { status: 401 })
    }

    // Verificar senha
    if (!affiliate.password_hash) {
      console.log("❌ Afiliado sem senha definida:", email)
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, affiliate.password_hash)
    if (!isValidPassword) {
      console.log("❌ Senha inválida para afiliado:", email)
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 })
    }

    // Gerar token JWT
    const token = await new SignJWT({
      affiliateId: affiliate.id,
      email: affiliate.email,
      name: affiliate.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    console.log("✅ Login bem-sucedido para afiliado:", affiliate.name)

    // Gerar link de afiliado
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const affiliateLink = `${baseUrl}/auth?ref=${affiliate.affiliate_code}`

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        username: affiliate.username,
        affiliate_code: affiliate.affiliate_code,
        commission_rate: affiliate.commission_rate,
        total_earnings: affiliate.total_earnings,
        total_referrals: affiliate.total_referrals,
        affiliate_link: affiliateLink,
      },
    })
  } catch (error) {
    console.error("❌ Erro no login do afiliado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
