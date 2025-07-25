import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const { name, email, username, password, commission_rate } = await request.json()

    // Validações
    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({ error: "Taxa de comissão deve estar entre 0 e 100%" }, { status: 400 })
    }

    console.log(`👤 Criando gerente: ${name} (${email})`)

    // Verificar se email já existe
    const [existingEmail] = await sql`
      SELECT id FROM managers WHERE LOWER(email) = LOWER(${email})
    `

    if (existingEmail) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Verificar se username já existe
    const [existingUsername] = await sql`
      SELECT id FROM managers WHERE LOWER(username) = LOWER(${username})
    `

    if (existingUsername) {
      return NextResponse.json({ error: "Username já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar gerente
    const [newManager] = await sql`
      INSERT INTO managers (name, email, username, password_hash, commission_rate, balance, status)
      VALUES (${name}, ${email.toLowerCase()}, ${username.toLowerCase()}, ${passwordHash}, ${commission_rate || 5.0}, 0.00, 'active')
      RETURNING id, name, email, username, commission_rate, status, created_at
    `

    console.log(`✅ Gerente criado com sucesso: ID ${newManager.id}`)

    return NextResponse.json({
      success: true,
      message: "Gerente criado com sucesso!",
      manager: {
        id: newManager.id,
        name: newManager.name,
        email: newManager.email,
        username: newManager.username,
        commission_rate: Number(newManager.commission_rate),
        status: newManager.status,
        created_at: newManager.created_at,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao criar gerente:", error)

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Email ou username já está em uso" }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
