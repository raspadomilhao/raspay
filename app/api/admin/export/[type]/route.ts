import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    // Check admin token from header
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { type } = params
    console.log(`📊 Exportando dados do tipo: ${type}`)

    let csvData = ""
    const filename = `${type}_${new Date().toISOString().split("T")[0]}.csv`

    switch (type) {
      case "affiliates":
        const affiliates = await sql`
          SELECT 
            a.id,
            a.name,
            a.email,
            a.username,
            a.affiliate_code,
            a.commission_rate,
            a.loss_commission_rate,
            a.total_earnings,
            a.total_referrals,
            a.balance,
            a.status,
            a.created_at,
            m.name as manager_name,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.id END) as deposits_count
          FROM affiliates a
          LEFT JOIN managers m ON a.manager_id = m.id
          LEFT JOIN users u ON a.id = u.affiliate_id
          LEFT JOIN transactions t ON u.id = t.user_id
          GROUP BY a.id, a.name, a.email, a.username, a.affiliate_code, a.commission_rate, 
                   a.loss_commission_rate, a.total_earnings, a.total_referrals, a.balance, 
                   a.status, a.created_at, m.name
          ORDER BY a.created_at DESC
        `

        csvData =
          "ID,Nome,Email,Username,Código,Taxa Comissão (%),Taxa Perda (%),Ganhos Totais,Referidos,Saldo,Status,Criado em,Gerente,Usuários,Depósitos\n"
        csvData += affiliates
          .map(
            (row) =>
              `${row.id},"${row.name}","${row.email}","${row.username}","${row.affiliate_code}",${row.commission_rate},${row.loss_commission_rate},${row.total_earnings},${row.total_referrals},${row.balance},"${row.status}","${row.created_at}","${row.manager_name || ""}",${row.total_users},${row.deposits_count}`,
          )
          .join("\n")
        break

      case "managers":
        const managers = await sql`
          SELECT 
            m.id,
            m.name,
            m.email,
            m.username,
            m.commission_rate,
            m.total_earnings,
            m.balance,
            m.status,
            m.created_at,
            COUNT(DISTINCT a.id) as total_affiliates,
            COUNT(DISTINCT u.id) as total_referrals,
            SUM(DISTINCT a.total_earnings) as affiliates_earnings
          FROM managers m
          LEFT JOIN affiliates a ON m.id = a.manager_id
          LEFT JOIN users u ON a.id = u.affiliate_id
          GROUP BY m.id, m.name, m.email, m.username, m.commission_rate, 
                   m.total_earnings, m.balance, m.status, m.created_at
          ORDER BY m.created_at DESC
        `

        csvData =
          "ID,Nome,Email,Username,Taxa Comissão (%),Ganhos Totais,Saldo,Status,Criado em,Afiliados,Referidos,Ganhos dos Afiliados\n"
        csvData += managers
          .map(
            (row) =>
              `${row.id},"${row.name}","${row.email}","${row.username}",${row.commission_rate},${row.total_earnings},${row.balance},"${row.status}","${row.created_at}",${row.total_affiliates},${row.total_referrals},${row.affiliates_earnings || 0}`,
          )
          .join("\n")
        break

      case "transactions":
        const transactions = await sql`
          SELECT 
            t.id,
            t.type,
            t.amount,
            t.status,
            t.external_id,
            t.end_to_end_id,
            t.payer_name,
            t.pix_key,
            t.pix_type,
            t.created_at,
            t.updated_at,
            u.name as user_name,
            u.email as user_email,
            u.user_type,
            a.name as affiliate_name,
            a.affiliate_code
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          LEFT JOIN affiliates a ON u.affiliate_id = a.id
          ORDER BY t.created_at DESC
          LIMIT 10000
        `

        csvData =
          "ID,Tipo,Valor,Status,ID Externo,End to End,Pagador,Chave PIX,Tipo PIX,Criado em,Atualizado em,Usuário,Email,Tipo Usuário,Afiliado,Código Afiliado\n"
        csvData += transactions
          .map(
            (row) =>
              `${row.id},"${row.type}",${row.amount},"${row.status}","${row.external_id || ""}","${row.end_to_end_id || ""}","${row.payer_name || ""}","${row.pix_key || ""}","${row.pix_type || ""}","${row.created_at}","${row.updated_at}","${row.user_name}","${row.user_email}","${row.user_type}","${row.affiliate_name || ""}","${row.affiliate_code || ""}"`,
          )
          .join("\n")
        break

      case "commissions":
        // Try to get from affiliate_commissions table, fallback to calculated data
        let commissions
        try {
          commissions = await sql`
            SELECT 
              ac.id,
              ac.commission_amount,
              ac.commission_type,
              ac.created_at,
              a.name as affiliate_name,
              a.affiliate_code,
              u.name as user_name,
              u.email as user_email,
              t.type as transaction_type,
              t.amount as transaction_amount
            FROM affiliate_commissions ac
            JOIN affiliates a ON ac.affiliate_id = a.id
            JOIN users u ON ac.user_id = u.id
            JOIN transactions t ON ac.transaction_id = t.id
            ORDER BY ac.created_at DESC
            LIMIT 10000
          `
        } catch (error) {
          console.log("Tabela affiliate_commissions não encontrada, calculando comissões...")
          // Fallback: calculate commissions from transactions
          commissions = await sql`
            SELECT 
              t.id,
              CASE 
                WHEN t.type = 'deposit' THEN t.amount * (a.commission_rate / 100.0)
                WHEN t.type = 'game_play' THEN t.amount * (a.loss_commission_rate / 100.0)
                ELSE 0
              END as commission_amount,
              CASE 
                WHEN t.type = 'deposit' THEN 'deposit'
                WHEN t.type = 'game_play' THEN 'loss'
                ELSE 'other'
              END as commission_type,
              t.created_at,
              a.name as affiliate_name,
              a.affiliate_code,
              u.name as user_name,
              u.email as user_email,
              t.type as transaction_type,
              t.amount as transaction_amount
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN affiliates a ON u.affiliate_id = a.id
            WHERE u.affiliate_id IS NOT NULL 
              AND t.status = 'success'
              AND t.type IN ('deposit', 'game_play')
            ORDER BY t.created_at DESC
            LIMIT 10000
          `
        }

        csvData =
          "ID,Valor Comissão,Tipo Comissão,Data,Afiliado,Código Afiliado,Usuário,Email Usuário,Tipo Transação,Valor Transação\n"
        csvData += commissions
          .map(
            (row) =>
              `${row.id},${row.commission_amount},"${row.commission_type}","${row.created_at}","${row.affiliate_name}","${row.affiliate_code}","${row.user_name}","${row.user_email}","${row.transaction_type}",${row.transaction_amount}`,
          )
          .join("\n")
        break

      default:
        return NextResponse.json({ error: "Tipo de exportação inválido" }, { status: 400 })
    }

    console.log(`✅ Dados exportados: ${csvData.split("\n").length - 1} registros`)

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao exportar dados:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
