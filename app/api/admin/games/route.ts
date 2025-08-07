import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const games = await sql`
      SELECT * FROM games 
      ORDER BY display_order ASC, created_at DESC
    `
    
    return NextResponse.json({ games })
  } catch (error) {
    console.error("Erro ao buscar jogos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      game_id, 
      name, 
      description, 
      min_bet, 
      max_prize, 
      image_url, 
      gradient_from, 
      gradient_to, 
      icon,
      is_active,
      display_order 
    } = body

    // Validações básicas
    if (!game_id || !name) {
      return NextResponse.json({ error: "ID do jogo e nome são obrigatórios" }, { status: 400 })
    }

    // Se não foi fornecida uma ordem, usar a próxima disponível
    let order = display_order
    if (!order) {
      const [maxOrder] = await sql`
        SELECT COALESCE(MAX(display_order), 0) + 10 as next_order FROM games
      `
      order = maxOrder.next_order
    }

    const result = await sql`
      INSERT INTO games (
        game_id, name, description, min_bet, max_prize, 
        image_url, gradient_from, gradient_to, icon, is_active, display_order
      ) VALUES (
        ${game_id}, ${name}, ${description}, ${min_bet || 1.00}, ${max_prize || 1000.00},
        ${image_url}, ${gradient_from || 'cyan-500'}, ${gradient_to || 'blue-500'}, 
        ${icon || 'Zap'}, ${is_active !== false}, ${order}
      )
      RETURNING *
    `

    return NextResponse.json({ game: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar jogo:", error)
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "ID do jogo já existe" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Nova rota para reordenar jogos
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { games } = body // Array de { id, display_order }

    if (!Array.isArray(games)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
    }

    // Atualizar a ordem de todos os jogos
    for (const game of games) {
      await sql`
        UPDATE games 
        SET display_order = ${game.display_order}
        WHERE id = ${game.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao reordenar jogos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
