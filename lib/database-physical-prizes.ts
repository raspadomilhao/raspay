import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface PhysicalPrize {
  id: number
  name: string
  description: string | null
  image_url: string | null
  estimated_value: number
  stock_quantity: number
  min_stock_alert: number
  is_active: boolean
  rarity_weight: number
  created_at: string
  updated_at: string
}

export interface PhysicalPrizeWinner {
  id: number
  user_id: number
  physical_prize_id: number
  transaction_id: number | null
  game_name: string
  winner_name: string | null
  winner_phone: string | null
  winner_email: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_zipcode: string | null
  delivery_notes: string | null
  status: string
  admin_notes: string | null
  contacted_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_code: string | null
  created_at: string
  updated_at: string
  // Dados relacionados
  user_name?: string
  user_email?: string
  prize_name?: string
  prize_image_url?: string
  prize_estimated_value?: number
}

export interface PhysicalPrizeStockLog {
  id: number
  physical_prize_id: number
  change_type: string
  quantity_change: number
  previous_stock: number
  new_stock: number
  reason: string | null
  admin_user: string | null
  created_at: string
}

// ===== FUNÇÕES DE PRÊMIOS FÍSICOS =====

export async function getAllPhysicalPrizes(): Promise<PhysicalPrize[]> {
  const prizes = await sql`
    SELECT * FROM physical_prizes
    ORDER BY rarity_weight ASC, estimated_value DESC
  `
  return prizes
}

export async function getActivePhysicalPrizes(): Promise<PhysicalPrize[]> {
  const prizes = await sql`
    SELECT * FROM physical_prizes
    WHERE is_active = true AND stock_quantity > 0
    ORDER BY rarity_weight ASC, estimated_value DESC
  `
  return prizes
}

export async function getPhysicalPrizeById(id: number): Promise<PhysicalPrize | null> {
  const [prize] = await sql`
    SELECT * FROM physical_prizes WHERE id = ${id}
  `
  return prize || null
}

export async function createPhysicalPrize(data: {
  name: string
  description?: string
  image_url?: string
  estimated_value: number
  stock_quantity: number
  min_stock_alert?: number
  rarity_weight?: number
}): Promise<PhysicalPrize> {
  const [prize] = await sql`
    INSERT INTO physical_prizes (
      name, description, image_url, estimated_value, 
      stock_quantity, min_stock_alert, rarity_weight
    )
    VALUES (
      ${data.name}, ${data.description || null}, ${data.image_url || null}, 
      ${data.estimated_value}, ${data.stock_quantity}, 
      ${data.min_stock_alert || 5}, ${data.rarity_weight || 5.0}
    )
    RETURNING *
  `

  // Registrar no log
  await sql`
    INSERT INTO physical_prize_stock_log (
      physical_prize_id, change_type, quantity_change, 
      previous_stock, new_stock, reason, admin_user
    )
    VALUES (
      ${prize.id}, 'add', ${data.stock_quantity}, 
      0, ${data.stock_quantity}, 'Prêmio criado', 'admin'
    )
  `

  return prize
}

export async function updatePhysicalPrize(id: number, data: Partial<PhysicalPrize>): Promise<PhysicalPrize> {
  const [prize] = await sql`
    UPDATE physical_prizes 
    SET name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        image_url = COALESCE(${data.image_url}, image_url),
        estimated_value = COALESCE(${data.estimated_value}, estimated_value),
        min_stock_alert = COALESCE(${data.min_stock_alert}, min_stock_alert),
        rarity_weight = COALESCE(${data.rarity_weight}, rarity_weight),
        is_active = COALESCE(${data.is_active}, is_active),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return prize
}

export async function addPhysicalPrizeStock(
  prizeId: number,
  quantity: number,
  reason = "Reposição de estoque",
  adminUser = "admin",
): Promise<boolean> {
  try {
    const [result] = await sql`
      SELECT add_physical_prize_stock(${prizeId}, ${quantity}, ${reason}, ${adminUser}) as success
    `
    return result.success
  } catch (error) {
    console.error("Erro ao adicionar estoque:", error)
    return false
  }
}

export async function decrementPhysicalPrizeStock(prizeId: number, reason = "Prêmio ganho"): Promise<boolean> {
  try {
    const [result] = await sql`
      SELECT decrement_physical_prize_stock(${prizeId}, ${reason}) as success
    `
    return result.success
  } catch (error) {
    console.error("Erro ao decrementar estoque:", error)
    return false
  }
}

// ===== FUNÇÕES DE GANHADORES =====

export async function createPhysicalPrizeWinner(data: {
  user_id: number
  physical_prize_id: number
  transaction_id?: number
  game_name: string
}): Promise<PhysicalPrizeWinner> {
  const [winner] = await sql`
    INSERT INTO physical_prize_winners (
      user_id, physical_prize_id, transaction_id, game_name
    )
    VALUES (
      ${data.user_id}, ${data.physical_prize_id}, 
      ${data.transaction_id || null}, ${data.game_name}
    )
    RETURNING *
  `
  return winner
}

export async function getAllPhysicalPrizeWinners(): Promise<PhysicalPrizeWinner[]> {
  const winners = await sql`
    SELECT 
      ppw.*,
      u.name as user_name,
      u.email as user_email,
      pp.name as prize_name,
      pp.image_url as prize_image_url,
      pp.estimated_value as prize_estimated_value
    FROM physical_prize_winners ppw
    JOIN users u ON ppw.user_id = u.id
    JOIN physical_prizes pp ON ppw.physical_prize_id = pp.id
    ORDER BY ppw.created_at DESC
  `
  return winners
}

export async function getPhysicalPrizeWinnerById(id: number): Promise<PhysicalPrizeWinner | null> {
  const [winner] = await sql`
    SELECT 
      ppw.*,
      u.name as user_name,
      u.email as user_email,
      pp.name as prize_name,
      pp.image_url as prize_image_url,
      pp.estimated_value as prize_estimated_value
    FROM physical_prize_winners ppw
    JOIN users u ON ppw.user_id = u.id
    JOIN physical_prizes pp ON ppw.physical_prize_id = pp.id
    WHERE ppw.id = ${id}
  `
  return winner || null
}

export async function updatePhysicalPrizeWinner(
  id: number,
  data: Partial<PhysicalPrizeWinner>,
): Promise<PhysicalPrizeWinner> {
  const [winner] = await sql`
    UPDATE physical_prize_winners 
    SET winner_name = COALESCE(${data.winner_name}, winner_name),
        winner_phone = COALESCE(${data.winner_phone}, winner_phone),
        winner_email = COALESCE(${data.winner_email}, winner_email),
        delivery_address = COALESCE(${data.delivery_address}, delivery_address),
        delivery_city = COALESCE(${data.delivery_city}, delivery_city),
        delivery_state = COALESCE(${data.delivery_state}, delivery_state),
        delivery_zipcode = COALESCE(${data.delivery_zipcode}, delivery_zipcode),
        delivery_notes = COALESCE(${data.delivery_notes}, delivery_notes),
        status = COALESCE(${data.status}, status),
        admin_notes = COALESCE(${data.admin_notes}, admin_notes),
        contacted_at = COALESCE(${data.contacted_at}, contacted_at),
        shipped_at = COALESCE(${data.shipped_at}, shipped_at),
        delivered_at = COALESCE(${data.delivered_at}, delivered_at),
        tracking_code = COALESCE(${data.tracking_code}, tracking_code),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return winner
}

export async function getUserPhysicalPrizeWinners(userId: number): Promise<PhysicalPrizeWinner[]> {
  const winners = await sql`
    SELECT 
      ppw.*,
      pp.name as prize_name,
      pp.image_url as prize_image_url,
      pp.estimated_value as prize_estimated_value
    FROM physical_prize_winners ppw
    JOIN physical_prizes pp ON ppw.physical_prize_id = pp.id
    WHERE ppw.user_id = ${userId}
    ORDER BY ppw.created_at DESC
  `
  return winners
}

// ===== FUNÇÕES DE SORTEIO =====

export async function selectRandomPhysicalPrize(): Promise<PhysicalPrize | null> {
  try {
    // Buscar prêmios disponíveis
    const availablePrizes = await sql`
      SELECT * FROM physical_prizes
      WHERE is_active = true AND stock_quantity > 0
      ORDER BY rarity_weight ASC
    `

    if (availablePrizes.length === 0) {
      return null
    }

    // Calcular pesos para sorteio (peso menor = mais raro = menos chance)
    const totalWeight = availablePrizes.reduce((sum, prize) => sum + Number(prize.rarity_weight), 0)
    const random = Math.random() * totalWeight

    let currentWeight = 0
    for (const prize of availablePrizes) {
      currentWeight += Number(prize.rarity_weight)
      if (random <= currentWeight) {
        return prize
      }
    }

    // Fallback: retornar o último prêmio
    return availablePrizes[availablePrizes.length - 1]
  } catch (error) {
    console.error("Erro ao selecionar prêmio físico:", error)
    return null
  }
}

// ===== FUNÇÕES DE LOG =====

export async function getPhysicalPrizeStockLog(prizeId?: number): Promise<PhysicalPrizeStockLog[]> {
  if (prizeId) {
    const logs = await sql`
      SELECT 
        psl.*,
        pp.name as prize_name
      FROM physical_prize_stock_log psl
      JOIN physical_prizes pp ON psl.physical_prize_id = pp.id
      WHERE psl.physical_prize_id = ${prizeId}
      ORDER BY psl.created_at DESC
      LIMIT 100
    `
    return logs
  } else {
    const logs = await sql`
      SELECT 
        psl.*,
        pp.name as prize_name
      FROM physical_prize_stock_log psl
      JOIN physical_prizes pp ON psl.physical_prize_id = pp.id
      ORDER BY psl.created_at DESC
      LIMIT 100
    `
    return logs
  }
}

// ===== FUNÇÕES DE ESTATÍSTICAS =====

export async function getPhysicalPrizesStats() {
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_prizes,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_prizes,
      COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as prizes_in_stock,
      COUNT(CASE WHEN stock_quantity <= min_stock_alert THEN 1 END) as low_stock_alerts,
      SUM(stock_quantity) as total_stock_quantity,
      SUM(estimated_value * stock_quantity) as total_stock_value
    FROM physical_prizes
  `

  const [winnersStats] = await sql`
    SELECT 
      COUNT(*) as total_winners,
      COUNT(CASE WHEN status = 'pending_contact' THEN 1 END) as pending_contact,
      COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted,
      COUNT(CASE WHEN status = 'address_collected' THEN 1 END) as address_collected,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
    FROM physical_prize_winners
  `

  return {
    prizes: stats,
    winners: winnersStats,
  }
}

export async function deletePhysicalPrize(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar se há ganhadores vinculados
    const [winnersCount] = await sql`
      SELECT COUNT(*) as count FROM physical_prize_winners 
      WHERE physical_prize_id = ${id}
    `

    if (Number(winnersCount.count) > 0) {
      return {
        success: false,
        message: "Não é possível excluir este prêmio pois há ganhadores vinculados a ele",
      }
    }

    // Excluir logs de estoque primeiro (devido à foreign key)
    await sql`
      DELETE FROM physical_prize_stock_log 
      WHERE physical_prize_id = ${id}
    `

    // Excluir o prêmio
    await sql`
      DELETE FROM physical_prizes 
      WHERE id = ${id}
    `

    return {
      success: true,
      message: "Prêmio excluído com sucesso",
    }
  } catch (error) {
    console.error("Erro ao excluir prêmio físico:", error)
    return {
      success: false,
      message: "Erro interno ao excluir prêmio",
    }
  }
}

export { sql }
