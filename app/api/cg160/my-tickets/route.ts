import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper: create SQL client
function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  return neon(url)
}

// Counts the user's "numbers" for today in a simple way:
// total approved deposits today = amount of numbers.
// Adjust statuses/types if your schema differs.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const sql = getSql()
    // Be permissive with approved statuses to fit existing data.
    const rows = await sql<[{ tickets: number }]>`
      SELECT COUNT(*)::int AS tickets
      FROM transactions t
      WHERE t.user_id = ${userId}
        AND t.type IN ('DEPOSIT', 'deposit')
        AND t.status IN ('APPROVED','COMPLETED','PAID','confirmed','approved')
        AND (t.created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
    `

    const tickets = rows[0]?.tickets ?? 0
    return NextResponse.json({ tickets })
  } catch (err: any) {
    console.error("GET /api/cg160/my-tickets error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
