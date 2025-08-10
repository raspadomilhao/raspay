import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Determine today's date in America/Sao_Paulo
    const [row] = await sql<{
      draw_date: string
      winner_id: number | null
      winner_name: string | null
      winner_email: string | null
      winner_username: string | null
      manual: boolean | null
      total_tickets: number | null
      notes: string | null
      selected_by: string | null
      created_at: string | null
    }>`
      WITH today_sp AS (
        SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d
      )
      SELECT
        d.draw_date,
        u.id AS winner_id,
        u.name AS winner_name,
        u.email AS winner_email,
        u.username AS winner_username,
        d.manual,
        d.total_tickets,
        d.notes,
        d.selected_by,
        d.created_at
      FROM cg160_draws d
      JOIN today_sp t ON d.draw_date = t.d
      LEFT JOIN users u ON u.id = d.winner_user_id
      LIMIT 1
    `

    if (!row) {
      // No winner set for today yet
      return NextResponse.json({
        draw_date: new Date().toLocaleDateString("pt-BR"),
        winner: null,
        manual: null,
        total_tickets: null,
        notes: null,
        selected_by: null,
        created_at: null,
      })
    }

    return NextResponse.json({
      draw_date: row.draw_date,
      winner: row.winner_id
        ? {
            id: row.winner_id,
            name: row.winner_name,
            email: row.winner_email,
            username: row.winner_username,
          }
        : null,
      manual: row.manual,
      total_tickets: row.total_tickets,
      notes: row.notes,
      selected_by: row.selected_by,
      created_at: row.created_at,
    })
  } catch (error) {
    console.error("Erro em /api/cg160/winner:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
