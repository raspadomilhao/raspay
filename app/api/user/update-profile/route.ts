import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { updateUser, getUserByUsername } from "@/lib/database"

export async function PUT(request: NextRequest) {
  try {
    console.log("👤 Atualizando perfil do usuário...")

    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { name, username, phone } = await request.json()

    // Validações básicas
    if (!name || !username) {
      return NextResponse.json({ error: "Nome e nome de usuário são obrigatórios" }, { status: 400 })
    }

    if (name.length < 2) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Nome de usuário deve ter pelo menos 3 caracteres" }, { status: 400 })
    }

    // Verificar se o username já está em uso por outro usuário
    const existingUser = await getUserByUsername(username)
    if (existingUser && existingUser.id !== auth.userId) {
      return NextResponse.json({ error: "Este nome de usuário já está em uso" }, { status: 400 })
    }

    console.log(`✅ Atualizando dados do usuário ${auth.userId}`)

    // Atualizar usuário
    const updatedUser = await updateUser(auth.userId, {
      name: name.trim(),
      username: username.toLowerCase().trim(),
      phone: phone?.trim() || null,
    })

    console.log(`✅ Perfil atualizado com sucesso para usuário ${auth.userId}`)

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar perfil:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
