import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const managerId = Number.parseInt(params.id)
    if (isNaN(managerId)) {
      return NextResponse.json({ error: "ID do gerente inválido" }, { status: 400 })
    }

    console.log(`🗑️ Excluindo gerente ID ${managerId}`)

    // Verificar se o gerente existe
    const [existingManager] = await sql`
      SELECT id, name FROM managers WHERE id = ${managerId}
    `

    if (!existingManager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    // Verificar quantos afiliados estão vinculados
    const [affiliateCount] = await sql`
      SELECT COUNT(*) as count FROM affiliates WHERE manager_id = ${managerId}
    `

    console.log(`📊 Gerente tem ${affiliateCount.count} afiliados vinculados`)

    // Iniciar transação para garantir consistência
    await sql`BEGIN`

    try {
      // Primeiro, desvincular todos os afiliados
      if (Number(affiliateCount.count) > 0) {
        await sql`
          UPDATE affiliates 
          SET manager_id = NULL, updated_at = NOW()
          WHERE manager_id = ${managerId}
        `
        console.log(`🔓 ${affiliateCount.count} afiliados desvinculados`)
      }

      // Depois, excluir o gerente
      const [deletedManager] = await sql`
        DELETE FROM managers WHERE id = ${managerId}
        RETURNING id, name
      `

      await sql`COMMIT`

      console.log(`✅ Gerente ${deletedManager.name} excluído com sucesso`)

      return NextResponse.json({
        success: true,
        message: `Gerente ${deletedManager.name} excluído com sucesso. ${affiliateCount.count} afiliados foram desvinculados.`,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("❌ Erro ao excluir gerente:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
