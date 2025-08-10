import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// This endpoint supports:
// - ?user_id=123 (recommended: client fetches /api/user/profile to get id and passes it here)
// - or header "X-User-Id"
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get("user_id")
    const headerUserId = (request.headers.get("x-user-id") || "").trim()
    const userId = Number.parseInt(queryUserId || headerUserId || "", 10)

    if (!Number.isFinite(userId)) {
      return NextResponse.json({ tickets_today: 0 })
    }

    const [row] = await sql<{ tickets_today: string }>`
      WITH start_of_today_sp AS (
        SELECT (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo' AS ts
      )
      SELECT COALESCE((
        SELECT FLOOR(SUM(t.amount))::int
        FROM transactions t
        WHERE t.user_id = ${userId}
          AND t.type = 'deposit'
          AND t.status = 'success'
          AND t.created_at >= (SELECT ts FROM start_of_today_sp)
      ), 0)::text AS tickets_today
    `

    const tickets = row ? Number.parseInt(row.tickets_today, 10) || 0 : 0
    return NextResponse.json({ tickets_today: tickets })
  } catch (error) {
    console.error("Erro em /api/cg160/my-tickets:", error)
    return NextResponse.json({ tickets_today: 0 })
  }
}
