import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getUserById } from "@/lib/database"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest) {
  try {
    console.log("🔐 Alterando senha do usuário...")

    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Validações básicas
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    console.log(`✅ Verificando senha atual do usuário ${auth.userId}`)

    // Buscar usuário com senha
    const user = await getUserById(auth.userId)
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!passwordMatch) {
      console.log("❌ Senha atual incorreta")
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    console.log(`✅ Senha atual verificada, gerando hash da nova senha...`)

    // Gerar hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Atualizar senha no banco
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id = ${auth.userId}
    `

    console.log(`✅ Senha alterada com sucesso para usuário ${auth.userId}`)

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao alterar senha:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
