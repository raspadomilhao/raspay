import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    const [game] = await sql`
      SELECT * FROM games WHERE id = ${id}
    `
    
    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    }
    
    return NextResponse.json({ game })
  } catch (error) {
    console.error("Erro ao buscar jogo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { 
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

    const [game] = await sql`
      UPDATE games 
      SET name = ${name},
          description = ${description},
          min_bet = ${min_bet},
          max_prize = ${max_prize},
          image_url = ${image_url},
          gradient_from = ${gradient_from},
          gradient_to = ${gradient_to},
          icon = ${icon},
          is_active = ${is_active},
          display_order = ${display_order || 0},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ game })
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    const [game] = await sql`
      DELETE FROM games WHERE id = ${id}
      RETURNING *
    `
    
    if (!game) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar jogo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
