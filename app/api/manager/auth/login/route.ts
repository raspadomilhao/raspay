import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

async function getManagerByEmail(email: string) {
  try {
    const result = await sql`
      SELECT * FROM managers 
      WHERE email = ${email} 
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("❌ Erro ao buscar gerente:", error)
    throw new Error("Erro ao buscar gerente no banco de dados")
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Manager Login: Iniciando processo de login")

    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Erro ao fazer parse do JSON:", error)
      return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 })
    }

    const { email, password } = body

    console.log("📧 Email recebido:", email)

    if (!email || !password) {
      console.log("❌ Email ou senha não fornecidos")
      return NextResponse.json({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar gerente no banco de dados
    let manager
    try {
      manager = await getManagerByEmail(email.toLowerCase())
    } catch (error) {
      console.error("❌ Erro ao buscar gerente:", error)
      return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
    }

    if (!manager) {
      console.log("❌ Gerente não encontrado")
      return NextResponse.json({ success: false, message: "Credenciais inválidas" }, { status: 401 })
    }

    console.log("✅ Gerente encontrado:", manager.name)

    // Verificar senha
    let isPasswordValid
    try {
      isPasswordValid = await bcrypt.compare(password, manager.password_hash)
    } catch (error) {
      console.error("❌ Erro ao verificar senha:", error)
      return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
    }

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
    let token
    try {
      token = await new SignJWT({
        managerId: manager.id,
        email: manager.email,
        name: manager.name,
        type: "manager",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET)
    } catch (error) {
      console.error("❌ Erro ao criar token JWT:", error)
      return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
    }

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
    try {
      response.cookies.set("manager-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 horas
        path: "/",
      })
      console.log("✅ Cookie manager-token definido")
    } catch (error) {
      console.error("❌ Erro ao definir cookie:", error)
      // Não retorna erro aqui pois o login ainda funcionará sem o cookie
    }

    return response
  } catch (error) {
    console.error("❌ Erro geral no login do gerente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
