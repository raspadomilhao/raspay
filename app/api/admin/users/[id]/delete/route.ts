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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const userId = Number.parseInt(params.id)

    // Verificar se o usuário existe
    const [user] = await sql`
      SELECT id, name, email FROM users WHERE id = ${userId}
    `

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Excluir em cascata (ordem importante para evitar violação de foreign key)

    // 1. Excluir comissões de afiliados relacionadas
    await sql`
      DELETE FROM affiliate_commissions WHERE user_id = ${userId}
    `

    // 2. Excluir transações
    await sql`
      DELETE FROM transactions WHERE user_id = ${userId}
    `

    // 3. Excluir carteira
    await sql`
      DELETE FROM wallets WHERE user_id = ${userId}
    `

    // 4. Excluir códigos de referência
    await sql`
      DELETE FROM referral_codes WHERE user_id = ${userId}
    `

    // 5. Finalmente excluir o usuário
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    console.log(`✅ Usuário ${user.name} (${user.email}) excluído com sucesso`)

    return NextResponse.json({
      message: `Usuário ${user.name} excluído com sucesso`,
    })
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
