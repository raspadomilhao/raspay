import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("X-Admin-Token")
    if (!authHeader) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const { affiliate_id, manager_id } = await request.json()

    if (!affiliate_id) {
      return NextResponse.json({ error: "ID do afiliado é obrigatório" }, { status: 400 })
    }

    console.log(`🔗 Vinculando afiliado ${affiliate_id} ao gerente ${manager_id}`)

    // Verificar se o afiliado existe
    const [affiliate] = await sql`
      SELECT id, name, email FROM affiliates WHERE id = ${affiliate_id}
    `

    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 })
    }

    // Se manager_id for null, desvincula o afiliado
    if (manager_id === null) {
      console.log(`🔓 Desvinculando afiliado ${affiliate_id}`)

      await sql`
        UPDATE affiliates 
        SET manager_id = NULL, updated_at = NOW()
        WHERE id = ${affiliate_id}
      `

      return NextResponse.json({
        success: true,
        message: "Afiliado desvinculado do gerente com sucesso",
      })
    }

    // Verificar se o gerente existe e está ativo
    const [manager] = await sql`
      SELECT id, name, status FROM managers WHERE id = ${manager_id}
    `

    if (!manager) {
      return NextResponse.json({ error: "Gerente não encontrado" }, { status: 404 })
    }

    if (manager.status !== "active") {
      return NextResponse.json({ error: "Gerente não está ativo" }, { status: 400 })
    }

    console.log(`✅ Vinculando afiliado ${affiliate.name} ao gerente ${manager.name}`)

    // Vincular o afiliado ao gerente
    await sql`
      UPDATE affiliates 
      SET manager_id = ${manager_id}, updated_at = NOW()
      WHERE id = ${affiliate_id}
    `

    console.log(`🎉 Vinculação realizada com sucesso`)

    return NextResponse.json({
      success: true,
      message: `Afiliado ${affiliate.name} vinculado ao gerente ${manager.name} com sucesso`,
    })
  } catch (error) {
    console.error("❌ Erro ao vincular afiliado ao gerente:", error)

    // Verificar se é erro de constraint
    if (error instanceof Error && error.message.includes("foreign key constraint")) {
      return NextResponse.json(
        {
          error:
            "Erro de integridade: Gerente não encontrado ou tabela não configurada corretamente. Execute o script de migração.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor: " + (error instanceof Error ? error.message : "Erro desconhecido"),
      },
      { status: 500 },
    )
  }
}
