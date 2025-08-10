import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  return neon(url)
}

function requireAdmin() {
  const cookieStore = cookies()
  const cookieToken = cookieStore.get("admin-token")?.value
  const headerToken = typeof Headers !== "undefined" ? null : null // placeholder to keep type quiet
  const envToken = process.env.ADMIN_TOKEN
  // Accept either the cookie matching ADMIN_TOKEN or a header X-Admin-Token (optional if you prefer)
  // We will also check the header explicitly from the request in POST handler.
  return { cookieToken, envToken }
}

export async function POST(req: Request) {
  try {
    const { cookieToken, envToken } = requireAdmin()
    const clientHeaderToken = req.headers.get("x-admin-token")

    const isAuthorized = (!!envToken && cookieToken === envToken) || (!!envToken && clientHeaderToken === envToken)

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const userId = body.userId as number | string | undefined
    const drawDate = body.drawDate as string | undefined // 'YYYY-MM-DD' optional
    const setBy = body.setBy as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const sql = getSql()
    // Upsert today's draw (or provided date)
    const rows = await sql<{ draw_date: string; winner_user_id: number }[]>`
      INSERT INTO cg160_draws (draw_date, winner_user_id, set_by)
      VALUES (
        COALESCE(${drawDate}::date, (now() AT TIME ZONE 'UTC')::date),
        ${userId}::int,
        COALESCE(${setBy}, 'admin')
      )
      ON CONFLICT (draw_date)
      DO UPDATE SET
        winner_user_id = EXCLUDED.winner_user_id,
        set_by = EXCLUDED.set_by,
        updated_at = now()
      RETURNING draw_date::text, winner_user_id
    `

    return NextResponse.json({
      success: true,
      draw: rows[0],
    })
  } catch (err: any) {
    console.error("POST /api/cg160/admin/set-winner error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
