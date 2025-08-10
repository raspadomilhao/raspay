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

export async function GET(req: Request) {
  try {
    const cookieStore = cookies()
    const cookieToken = cookieStore.get("admin-token")?.value
    const envToken = process.env.ADMIN_TOKEN
    const clientHeaderToken = req.headers.get("x-admin-token")

    const isAuthorized = (!!envToken && cookieToken === envToken) || (!!envToken && clientHeaderToken === envToken)

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()

    if (!q) {
      return NextResponse.json({ users: [] })
    }

    const sql = getSql()
    const rows = await sql<{ id: number; name: string | null; email: string | null; username: string | null }[]>`
      SELECT id, name, email, COALESCE(username, NULL) AS username
      FROM users
      WHERE
        (name ILIKE ${"%" + q + "%"}
          OR email ILIKE ${"%" + q + "%"}
          OR COALESCE(username,'') ILIKE ${"%" + q + "%"})
      ORDER BY id DESC
      LIMIT 20
    `

    return NextResponse.json({ users: rows })
  } catch (err: any) {
    console.error("GET /api/cg160/admin/search-users error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
