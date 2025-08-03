import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)
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

function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  return csvContent
}

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const isAdmin = await verifyAdminAuth(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { type } = params
    console.log(`📊 Exportando dados do tipo: ${type}`)

    let data: any[] = []
    const filename = `${type}_${new Date().toISOString().split("T")[0]}.csv`

    switch (type) {
      case "affiliates":
        data = await sql`
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
            COUNT(DISTINCT u.id) as active_referrals,
            COUNT(DISTINCT CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.id END) as deposits_count,
            COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount END), 0) as total_deposits_volume
          FROM affiliates a
          LEFT JOIN managers m ON a.manager_id = m.id
          LEFT JOIN users u ON a.id = u.affiliate_id
          LEFT JOIN transactions t ON u.id = t.user_id
          GROUP BY a.id, a.name, a.email, a.username, a.affiliate_code, a.commission_rate, 
                   a.loss_commission_rate, a.total_earnings, a.total_referrals, a.balance, 
                   a.status, a.created_at, m.name
          ORDER BY a.created_at DESC
        `
        break

      case "managers":
        data = await sql`
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
            COUNT(DISTINCT u.id) as total_referrals_managed,
            COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount END), 0) as total_deposit_volume
          FROM managers m
          LEFT JOIN affiliates a ON m.id = a.manager_id
          LEFT JOIN users u ON a.id = u.affiliate_id
          LEFT JOIN transactions t ON u.id = t.user_id
          GROUP BY m.id, m.name, m.email, m.username, m.commission_rate, 
                   m.total_earnings, m.balance, m.status, m.created_at
          ORDER BY m.created_at DESC
        `
        break

      case "transactions":
        data = await sql`
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
            u.username as user_username,
            u.user_type,
            a.name as affiliate_name,
            a.affiliate_code
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN affiliates a ON u.affiliate_id = a.id
          ORDER BY t.created_at DESC
          LIMIT 10000
        `
        break

      case "commissions":
        data = await sql`
          SELECT 
            t.id as transaction_id,
            t.type as transaction_type,
            t.amount as transaction_amount,
            t.created_at as transaction_date,
            u.name as user_name,
            u.email as user_email,
            a.name as affiliate_name,
            a.affiliate_code,
            a.commission_rate,
            a.loss_commission_rate,
            CASE 
              WHEN t.type = 'deposit' THEN t.amount * (a.commission_rate / 100.0)
              WHEN t.type = 'game_play' THEN t.amount * (a.loss_commission_rate / 100.0)
              ELSE 0
            END as commission_amount,
            m.name as manager_name,
            m.commission_rate as manager_commission_rate,
            CASE 
              WHEN t.type = 'deposit' AND m.id IS NOT NULL THEN (t.amount * (a.commission_rate / 100.0)) * (m.commission_rate / 100.0)
              WHEN t.type = 'game_play' AND m.id IS NOT NULL THEN (t.amount * (a.loss_commission_rate / 100.0)) * (m.commission_rate / 100.0)
              ELSE 0
            END as manager_commission_amount
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN affiliates a ON u.affiliate_id = a.id
          LEFT JOIN managers m ON a.manager_id = m.id
          WHERE t.status = 'success' 
            AND t.type IN ('deposit', 'game_play')
            AND a.id IS NOT NULL
          ORDER BY t.created_at DESC
          LIMIT 10000
        `
        break

      default:
        return NextResponse.json({ error: "Tipo de exportação inválido" }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "Nenhum dado encontrado para exportação" }, { status: 404 })
    }

    const csvContent = arrayToCSV(data)

    console.log(`✅ Exportação de ${type} concluída: ${data.length} registros`)

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error(`❌ Erro ao exportar ${params.type}:`, error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
