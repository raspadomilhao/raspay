import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { jwtVerify } from "jose"

const sql = neon(process.env.DATABASE_URL!)

async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    return payload as { userId: number; email: string; userType: string }
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    const offset = (page - 1) * limit

    // Build WHERE clause
    const whereConditions = []
    const queryParams = []
    let paramIndex = 1

    if (type && type !== "all") {
      whereConditions.push(`t.type = $${paramIndex}`)
      queryParams.push(type)
      paramIndex++
    }

    if (status && status !== "all") {
      whereConditions.push(`t.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`t.user_id = $${paramIndex}`)
      queryParams.push(Number.parseInt(userId))
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get transactions with user info
    const transactionsQuery = `
      SELECT 
        t.*,
        u.name as user_name,
        u.email as user_email,
        u.username as user_username,
        u.user_type
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const transactions = await sql(transactionsQuery, [...queryParams, limit, offset])

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
    `

    const countResult = await sql(countQuery, queryParams)
    const totalTransactions = Number.parseInt(countResult[0].total)
    const totalPages = Math.ceil(totalTransactions / limit)

    // Get transaction statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status IN ('failed', 'cancelled') THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN type = 'deposit' THEN 1 END) as total_deposits,
        COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as total_withdraws,
        COUNT(CASE WHEN type = 'game_play' THEN 1 END) as total_games,
        COUNT(CASE WHEN type = 'game_prize' THEN 1 END) as total_prizes,
        COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'success' THEN amount END), 0) as total_deposit_volume,
        COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'success' THEN amount END), 0) as total_withdraw_volume,
        COALESCE(SUM(CASE WHEN type = 'game_play' AND status = 'success' THEN amount END), 0) as total_game_volume,
        COALESCE(SUM(CASE WHEN type = 'game_prize' AND status = 'success' THEN amount END), 0) as total_prize_volume
      FROM transactions
    `

    const stats = await sql(statsQuery)

    return NextResponse.json({
      transactions,
      stats: stats[0],
      pagination: {
        currentPage: page,
        totalPages,
        totalTransactions,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { transaction_id, status, admin_notes } = await request.json()

    if (!transaction_id || !status) {
      return NextResponse.json({ error: "ID da transação e status são obrigatórios" }, { status: 400 })
    }

    // Valid statuses
    const validStatuses = ["pending", "success", "failed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    // Update transaction
    const updateQuery = `
      UPDATE transactions 
      SET 
        status = $1,
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `

    const result = await sql(updateQuery, [status, admin_notes, transaction_id])

    if (result.length === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    // Log the admin action
    await sql(
      `
      INSERT INTO transactions (user_id, type, amount, status, description, created_at)
      VALUES ($1, 'admin_action', 0, 'success', $2, NOW())
    `,
      [
        user.userId,
        `Admin ${user.email} alterou status da transação #${transaction_id} para ${status}${admin_notes ? ` - Obs: ${admin_notes}` : ""}`,
      ],
    )

    return NextResponse.json({
      message: "Transação atualizada com sucesso",
      transaction: result[0],
    })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
