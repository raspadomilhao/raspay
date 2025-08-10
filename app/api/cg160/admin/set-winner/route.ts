import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Reuse same admin gate as /adminconfig: accept X-Admin-Token returned by /api/admin/auth
function isAdminTokenValid(token: string | null | undefined) {
  if (!token) return false
  const allowed = new Set<string>([
    "admin-full-access",
    "admin-managers-only",
    process.env.ADMIN_TOKEN || "", // optional project-level override
  ])
  return allowed.has(token)
}

export async function POST(request: Request) {
  try {
    const adminToken = request.headers.get("x-admin-token")
    if (!isAdminTokenValid(adminToken)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { winner_user_id, notes, selected_by } = await request.json().catch(() => ({}))
    const userId = Number.parseInt(String(winner_user_id), 10)
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: "winner_user_id inválido" }, { status: 400 })
    }

    // Validate eligible user
    const [user] = await sql<{ id: number; user_type: string | null }>`
      SELECT id, user_type FROM users WHERE id = ${userId}
    `
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }
    // Non-eligible types cannot be winners
    const type = (user.user_type ?? "user").toLowerCase()
    if (["admin", "manager", "affiliate"].includes(type)) {
      return NextResponse.json({ error: "Usuário não elegível para o sorteio" }, { status: 400 })
    }

    // Compute today's date in SP and total tickets across all eligible users
    const [meta] = await sql<{ draw_date: string; total_tickets: string }>`
      WITH start_of_today_sp AS (
        SELECT (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')) AT TIME ZONE 'America/Sao_Paulo' AS ts
      ),
      eligible AS (
        SELECT u.id
        FROM users u
        WHERE COALESCE(u.user_type, 'user') NOT IN ('admin','manager','affiliate')
      ),
      agg AS (
        SELECT t.user_id, SUM(t.amount) AS amount
        FROM transactions t
        JOIN eligible e ON e.id = t.user_id
        WHERE t.type = 'deposit'
          AND t.status = 'success'
          AND t.created_at >= (SELECT ts FROM start_of_today_sp)
        GROUP BY t.user_id
      )
      SELECT
        (now() AT TIME ZONE 'America/Sao_Paulo')::date AS draw_date,
        COALESCE((SELECT SUM(FLOOR(a.amount))::int FROM agg a), 0)::text AS total_tickets
    `
    const drawDate = meta?.draw_date
    const totalTickets = meta ? Number.parseInt(meta.total_tickets, 10) || 0 : 0

    // Upsert winner for today
    const [saved] = await sql<{
      id: number
      draw_date: string
      winner_user_id: number
      manual: boolean
      total_tickets: number | null
      notes: string | null
      selected_by: string | null
      created_at: string
    }>`
      INSERT INTO cg160_draws (draw_date, winner_user_id, manual, total_tickets, notes, selected_by)
      VALUES (${drawDate}, ${userId}, TRUE, ${totalTickets}, ${notes ?? null}, ${selected_by ?? "admin"})
      ON CONFLICT (draw_date) DO UPDATE
        SET winner_user_id = EXCLUDED.winner_user_id,
            manual = TRUE,
            total_tickets = EXCLUDED.total_tickets,
            notes = EXCLUDED.notes,
            selected_by = EXCLUDED.selected_by,
            created_at = NOW()
      RETURNING *
    `

    return NextResponse.json({
      message: "Vencedor definido com sucesso",
      draw_date: saved.draw_date,
      winner_user_id: saved.winner_user_id,
      total_tickets: saved.total_tickets,
      notes: saved.notes,
      selected_by: saved.selected_by,
      created_at: saved.created_at,
    })
  } catch (error) {
    console.error("Erro em /api/cg160/admin/set-winner:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
