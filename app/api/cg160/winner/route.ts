import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  return neon(url)
}

// Returns today's winner if set
export async function GET() {
  try {
    const sql = getSql()
    const rows = await sql<
      {
        draw_date: string
        winner_user_id: number
        name: string | null
        email: string | null
        username: string | null
      }[]
    >`
      SELECT
        d.draw_date::text,
        d.winner_user_id,
        u.name,
        u.email,
        COALESCE(u.username, NULL) AS username
      FROM cg160_draws d
      LEFT JOIN users u ON u.id = d.winner_user_id
      WHERE d.draw_date = (now() AT TIME ZONE 'UTC')::date
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ winner: null })
    }

    const w = rows[0]
    return NextResponse.json({
      winner: {
        drawDate: w.draw_date,
        userId: w.winner_user_id,
        name: w.name,
        email: w.email,
        username: w.username,
      },
    })
  } catch (err: any) {
    console.error("GET /api/cg160/winner error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
