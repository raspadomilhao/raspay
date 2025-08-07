import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const games = await sql`
      SELECT 
        id,
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
      FROM games 
      WHERE is_active = true
      ORDER BY display_order ASC, created_at DESC
    `
    
    return NextResponse.json({ games })
  } catch (error) {
    console.error("Erro ao buscar jogos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
