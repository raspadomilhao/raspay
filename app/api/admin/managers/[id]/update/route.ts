import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const managerId = Number.parseInt(params.id)
    if (isNaN(managerId)) {
      return NextResponse.json({ error: "ID do gerente inválido" }, { status: 400 })
    }

    const { name, email, username, commission_rate, status } = await request.json()

    // Validações
    if (!name || !email || !username) {
      return NextResponse.json({ error: "Nome, email e username são obrigatórios" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({ error: "Taxa de comissão deve estar entre 0 e 100%" }, { status: 400 })
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json({ error: "Status deve ser 'active' ou 'inactive'" }, { status: 400 })
    }

    console.log(`✏️ Atualizando gerente ID ${managerId}`)

    // Verificar se o gerente existe
    const [existingManager] = await sql`
      SELECT id FROM managers WHERE id = ${managerId}
    `

    if (!existingManager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    // Verificar se email já existe (exceto para o próprio gerente)
    const [existingEmail] = await sql`
      SELECT id FROM managers WHERE LOWER(email) = LOWER(${email}) AND id != ${managerId}
    `

    if (existingEmail) {
      return NextResponse.json({ error: "Email já está em uso por outro gerente" }, { status: 400 })
    }

    // Verificar se username já existe (exceto para o próprio gerente)
    const [existingUsername] = await sql`
      SELECT id FROM managers WHERE LOWER(username) = LOWER(${username}) AND id != ${managerId}
    `

    if (existingUsername) {
      return NextResponse.json({ error: "Username já está em uso por outro gerente" }, { status: 400 })
    }

    // Atualizar gerente
    const [updatedManager] = await sql`
      UPDATE managers 
      SET name = ${name},
          email = ${email.toLowerCase()},
          username = ${username.toLowerCase()},
          commission_rate = ${commission_rate},
          status = ${status},
          updated_at = NOW()
      WHERE id = ${managerId}
      RETURNING id, name, email, username, commission_rate, status, updated_at
    `

    console.log(`✅ Gerente atualizado com sucesso: ${updatedManager.name}`)

    return NextResponse.json({
      success: true,
      message: "Gerente atualizado com sucesso!",
      manager: {
        id: updatedManager.id,
        name: updatedManager.name,
        email: updatedManager.email,
        username: updatedManager.username,
        commission_rate: Number(updatedManager.commission_rate),
        status: updatedManager.status,
        updated_at: updatedManager.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar gerente:", error)

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
