import { type NextRequest, NextResponse } from "next/server"
import { createAffiliate, getAffiliateByEmail, getAffiliateByCode } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, username, commission_rate, password } = body

    // Validações
    if (!name || !email || !username || !password) {
      return NextResponse.json({ success: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verificar se email já existe
    const existingEmail = await getAffiliateByEmail(email)
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Este email já está em uso" }, { status: 400 })
    }

    // Gerar código único de afiliado
    let affiliateCode = username
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 8)
    let codeExists = await getAffiliateByCode(affiliateCode)
    let counter = 1

    while (codeExists) {
      affiliateCode = `${username
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 6)}${counter.toString().padStart(2, "0")}`
      codeExists = await getAffiliateByCode(affiliateCode)
      counter++
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12)

    // Criar afiliado
    const affiliate = await createAffiliate({
      name,
      email,
      username,
      affiliate_code: affiliateCode,
      password_hash: passwordHash,
      commission_rate: commission_rate || 10.0,
    })

    return NextResponse.json({
      success: true,
      message: "Afiliado criado com sucesso",
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        username: affiliate.username,
        affiliate_code: affiliate.affiliate_code,
        commission_rate: affiliate.commission_rate,
        status: affiliate.status,
      },
    })
  } catch (error) {
    console.error("Erro ao criar afiliado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
