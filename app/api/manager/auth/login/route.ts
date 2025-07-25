import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { getManagerByEmail } from "@/lib/database-managers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Manager Login: Iniciando processo de login")

    const body = await request.json()
    const { email, password } = body

    console.log("📧 Email recebido:", email)

    if (!email || !password) {
      console.log("❌ Email ou senha não fornecidos")
      return NextResponse.json({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar gerente no banco de dados
    const manager = await getManagerByEmail(email.toLowerCase())

    if (!manager) {
      console.log("❌ Gerente não encontrado")
      return NextResponse.json({ success: false, message: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("✅ Gerente encontrado:", manager.name)

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, manager.password_hash!)

    if (!isPasswordValid) {
      console.log("❌ Senha inválida")
      return NextResponse.json({ success: false, message: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("✅ Senha válida")

    // Verificar se o gerente está ativo
    if (manager.status !== "active") {
      console.log("❌ Gerente inativo")
      return NextResponse.json(
        { success: false, message: "Conta inativa. Entre em contato com o administrador." },
        { status: 401 },
      )
    }

    // Criar token JWT
    const token = await new SignJWT({
      managerId: manager.id,
      email: manager.email,
      name: manager.name,
      type: "manager",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    console.log("✅ Token JWT criado")

    // Remover senha do objeto de resposta
    const { password_hash, ...managerData } = manager

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      manager: managerData,
    })

    // Definir cookie com o token
    response.cookies.set("manager-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas
      path: "/",
    })

    console.log("✅ Cookie manager-token definido")

    return response
  } catch (error) {
    console.error("❌ Erro no login do gerente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
