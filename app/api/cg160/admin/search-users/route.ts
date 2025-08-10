import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function isAdminTokenValid(token: string | null | undefined) {
  if (!token) return false
  const allowed = new Set<string>(["admin-full-access", "admin-managers-only", process.env.ADMIN_TOKEN || ""])
  return allowed.has(token)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()
    const adminToken = request.headers.get("x-admin-token")
    if (!isAdminTokenValid(adminToken)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
    if (!q) {
      return NextResponse.json({ users: [] })
    }

    const users = await sql<{
      id: number
      name: string | null
      email: string
      username: string | null
      user_type: string | null
    }>`
      SELECT id, name, email, username, user_type
      FROM users
      WHERE COALESCE(user_type, 'user') NOT IN ('admin','manager','affiliate')
        AND (
          name ILIKE ${"%" + q + "%"} OR
          email ILIKE ${"%" + q + "%"} OR
          username ILIKE ${"%" + q + "%"}
        )
      ORDER BY created_at DESC
      LIMIT 25
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro em /api/cg160/admin/search-users:", error)
    return NextResponse.json({ error: "Erro interno do servidor", users: [] }, { status: 500 })
  }
}
