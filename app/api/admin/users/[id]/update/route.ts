import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { sql } from "@/lib/database"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

async function verifyAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return false

    const { payload } = await jwtVerify(token, secret)
    return payload.isAdmin === true
  } catch {
    return false
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)
    const body = await request.json()
    const { name, email, username, phone, user_type } = body

    // Verificar se o email já existe (exceto para o próprio usuário)
    const [existingUser] = await sql`
      SELECT id FROM users 
      WHERE LOWER(email) = LOWER(${email}) AND id != ${userId}
    `

    if (existingUser) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Verificar se o username já existe (se fornecido)
    if (username) {
      const [existingUsername] = await sql`
        SELECT id FROM users 
        WHERE LOWER(username) = LOWER(${username}) AND id != ${userId}
      `

      if (existingUsername) {
        return NextResponse.json({ error: "Username já está em uso" }, { status: 400 })
      }
    }

    // Atualizar usuário
    const [updatedUser] = await sql`
      UPDATE users 
      SET name = ${name},
          email = LOWER(${email}),
          username = ${username ? username.toLowerCase() : null},
          phone = ${phone || null},
          user_type = ${user_type},
          updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `

    if (!updatedUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
