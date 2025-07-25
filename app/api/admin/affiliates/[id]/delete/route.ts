import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ Iniciando exclusão de afiliado...")

    // Verificar se há DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL não encontrada")
      return NextResponse.json({ error: "Configuração de banco de dados não encontrada" }, { status: 500 })
    }

    // Inicializar conexão com o banco
    const sql = neon(process.env.DATABASE_URL)

    const affiliateId = Number.parseInt(params.id)
    if (isNaN(affiliateId)) {
      return NextResponse.json({ error: "ID do afiliado inválido" }, { status: 400 })
    }

    console.log(`🔍 Verificando se afiliado ${affiliateId} existe...`)

    // Verificar se o afiliado existe
    const affiliateResult = await sql`
      SELECT id, name, email FROM affiliates WHERE id = ${affiliateId}
    `

    if (affiliateResult.length === 0) {
      return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 })
    }

    const affiliate = affiliateResult[0]
    console.log(`🗑️ Iniciando exclusão do afiliado: ${affiliate.name} (ID: ${affiliateId})`)

    // Iniciar transação
    await sql`BEGIN`

    try {
      // 1. Desvincular usuários referidos (manter os usuários, apenas remover a vinculação)
      const usersResult = await sql`
        UPDATE users 
        SET affiliate_id = NULL, updated_at = NOW()
        WHERE affiliate_id = ${affiliateId}
      `

      console.log(`👥 ${usersResult.length} usuários desvinculados`)

      // 2. Excluir comissões do afiliado
      const commissionsResult = await sql`
        DELETE FROM affiliate_commissions 
        WHERE affiliate_id = ${affiliateId}
      `

      console.log(`💰 ${commissionsResult.length} comissões excluídas`)

      // 3. Excluir saques do afiliado
      const withdrawsResult = await sql`
        DELETE FROM affiliate_withdraws 
        WHERE affiliate_id = ${affiliateId}
      `

      console.log(`💸 ${withdrawsResult.length} saques excluídos`)

      // 4. Excluir o afiliado
      await sql`
        DELETE FROM affiliates 
        WHERE id = ${affiliateId}
      `

      // Confirmar transação
      await sql`COMMIT`

      console.log(`✅ Afiliado ${affiliate.name} excluído com sucesso`)

      return NextResponse.json({
        success: true,
        message: "Afiliado excluído com sucesso",
        details: {
          affiliate_name: affiliate.name,
          users_unlinked: usersResult.length,
          commissions_deleted: commissionsResult.length,
          withdraws_deleted: withdrawsResult.length,
        },
      })
    } catch (transactionError) {
      // Reverter transação em caso de erro
      await sql`ROLLBACK`
      throw transactionError
    }
  } catch (error) {
    console.error("❌ Erro ao excluir afiliado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
