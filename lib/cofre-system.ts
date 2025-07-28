import { neon } from "@neondatabase/serverless"
import { getGameConfig, shouldDrawCofrePrize, calculateCofrePrize } from "./game-config"

const sql = neon(process.env.DATABASE_URL!)

export interface GameCofre {
  id: number
  game_name: string
  balance: string | number
  total_contributed: string | number
  total_distributed: string | number
  game_count: number
  last_distribution: string | null
  created_at: string
  updated_at: string
}

export interface CofrePrize {
  id: number
  game_name: string
  user_id: number
  prize_amount: string | number
  cofre_balance_before: string | number
  cofre_balance_after: string | number
  game_count_trigger: number
  created_at: string
  user_name: string
  user_username: string
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number.parseFloat(value.toString())
  return isNaN(parsed) ? 0 : parsed
}

// Função para garantir que o cofre existe
async function ensureCofreExists(gameName: string): Promise<void> {
  try {
    await sql`
      INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
      VALUES (${gameName}, 0.00, 0.00, 0.00, 0)
      ON CONFLICT (game_name) DO NOTHING
    `
    console.log(`🏦 Cofre garantido para ${gameName}`)
  } catch (error) {
    console.error(`❌ Erro ao garantir cofre para ${gameName}:`, error)
  }
}

// Função para contribuir para o cofre com o valor líquido REAL do jogo
export async function contributeToCofreSystem(
  gameName: string,
  netAmount: number,
  userId: number,
  userType = "regular",
): Promise<{ shouldCheckPrize: boolean; gameCount: number }> {
  console.log(`🏦 === CONTRIBUINDO PARA O COFRE ${gameName} ===`)
  console.log(`💰 Valor líquido: R$ ${netAmount.toFixed(2)} (${netAmount >= 0 ? "GANHO" : "PERDA"})`)
  console.log(`👤 Usuário: ${userId} (${userType})`)

  try {
    // Garantir que o cofre existe
    await ensureCofreExists(gameName)

    // VALOR LÍQUIDO CORRETO:
    // Se netAmount é negativo (jogador perdeu) = adiciona ao cofre
    // Se netAmount é positivo (jogador ganhou) = subtrai do cofre
    const contributionAmount = -netAmount // Inverte o sinal para refletir o valor líquido da casa

    console.log(`🏦 Contribuição real para o cofre: R$ ${contributionAmount.toFixed(2)}`)

    // Incrementar contador de jogadas e atualizar saldo do cofre
    const [cofre] = await sql`
      INSERT INTO game_cofres (game_name, balance, total_contributed, game_count)
      VALUES (${gameName}, ${contributionAmount}, ${Math.max(0, contributionAmount)}, 1)
      ON CONFLICT (game_name) DO UPDATE SET
        balance = game_cofres.balance + ${contributionAmount},
        total_contributed = game_cofres.total_contributed + ${Math.max(0, contributionAmount)},
        game_count = game_cofres.game_count + 1,
        updated_at = NOW()
      RETURNING *
    `

    const gameCount = cofre.game_count
    const newBalance = toNumber(cofre.balance)
    console.log(`🎮 Jogo ${gameName}: ${gameCount} jogadas, cofre: R$ ${newBalance.toFixed(2)}`)

    // Verificar se deve sortear prêmio do cofre (baseado em porcentagem)
    const config = getGameConfig(gameName, userType)
    const shouldCheckPrize = config.cofre ? shouldDrawCofrePrize(config.cofre, userType) : false

    console.log(`🎰 Deve verificar prêmio do cofre: ${shouldCheckPrize} (usuário: ${userType})`)

    return { shouldCheckPrize, gameCount }
  } catch (error) {
    console.error("❌ Erro ao contribuir para o cofre:", error)
    return { shouldCheckPrize: false, gameCount: 0 }
  }
}

// Função para sortear e distribuir prêmio do cofre
export async function distributeCofrePrize(
  gameName: string,
  userId: number,
  userType = "regular",
): Promise<{ won: boolean; prize: number; cofreBalanceBefore: number; cofreBalanceAfter: number } | null> {
  console.log(`🎰 === VERIFICANDO PRÊMIO DO COFRE ${gameName} ===`)
  console.log(`👤 Usuário: ${userId} (${userType})`)

  try {
    const config = getGameConfig(gameName, userType)
    if (!config.cofre?.enabled) {
      console.log(`❌ Cofre desabilitado para ${gameName}`)
      return null
    }

    if (config.cofre.onlyRegularUsers && userType !== "regular") {
      console.log(`❌ Cofre apenas para usuários regulares (atual: ${userType})`)
      return null
    }

    // Buscar saldo atual do cofre
    const [cofre] = await sql`
      SELECT * FROM game_cofres WHERE game_name = ${gameName}
    `

    if (!cofre) {
      console.log(`❌ Cofre não encontrado para ${gameName}`)
      return null
    }

    const cofreBalance = toNumber(cofre.balance)
    console.log(`💰 Saldo do cofre: R$ ${cofreBalance.toFixed(2)}`)

    // Verificar se tem saldo mínimo
    if (cofreBalance < (config.cofre.minCofreAmount || 100)) {
      console.log(`❌ Saldo do cofre insuficiente para sortear (mín: R$ ${config.cofre.minCofreAmount})`)
      return { won: false, prize: 0, cofreBalanceBefore: cofreBalance, cofreBalanceAfter: cofreBalance }
    }

    // Calcular prêmio do cofre
    const prizeAmount = calculateCofrePrize(cofreBalance, config.cofre)

    if (prizeAmount <= 0) {
      console.log(`❌ Nenhum prêmio calculado do cofre`)
      return { won: false, prize: 0, cofreBalanceBefore: cofreBalance, cofreBalanceAfter: cofreBalance }
    }

    console.log(`🎰 Prêmio do cofre sorteado: R$ ${prizeAmount.toFixed(2)}`)

    // Debitar do cofre e registrar o prêmio
    const newCofreBalance = cofreBalance - prizeAmount

    await sql`
      UPDATE game_cofres 
      SET balance = ${newCofreBalance},
          total_distributed = total_distributed + ${prizeAmount},
          last_distribution = NOW(),
          updated_at = NOW()
      WHERE game_name = ${gameName}
    `

    // Registrar o prêmio distribuído
    await sql`
      INSERT INTO cofre_prizes (
        game_name, user_id, prize_amount, 
        cofre_balance_before, cofre_balance_after, game_count_trigger
      )
      VALUES (
        ${gameName}, ${userId}, ${prizeAmount},
        ${cofreBalance}, ${newCofreBalance}, ${cofre.game_count}
      )
    `

    console.log(`✅ Prêmio do cofre distribuído! Novo saldo: R$ ${newCofreBalance.toFixed(2)}`)

    return {
      won: true,
      prize: prizeAmount,
      cofreBalanceBefore: cofreBalance,
      cofreBalanceAfter: newCofreBalance,
    }
  } catch (error) {
    console.error("❌ Erro ao distribuir prêmio do cofre:", error)
    return null
  }
}

// Função para obter estatísticas do cofre
export async function getCofreStats(gameName: string): Promise<GameCofre | null> {
  try {
    await ensureCofreExists(gameName)
    const [cofre] = await sql`
      SELECT * FROM game_cofres WHERE game_name = ${gameName}
    `
    return cofre || null
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas do cofre:", error)
    return null
  }
}

// Função para obter histórico de prêmios do cofre
export async function getCofrePrizeHistory(gameName: string, limit = 50): Promise<CofrePrize[]> {
  try {
    const prizes = await sql`
      SELECT 
        cp.*,
        u.name as user_name,
        u.username as user_username
      FROM cofre_prizes cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.game_name = ${gameName}
      ORDER BY cp.created_at DESC
      LIMIT ${limit}
    `
    return prizes
  } catch (error) {
    console.error("❌ Erro ao buscar histórico do cofre:", error)
    return []
  }
}

// Função para obter todos os cofres (admin)
export async function getAllCofres(): Promise<GameCofre[]> {
  try {
    // Garantir que todos os cofres existem
    await ensureCofreExists("raspe-da-esperanca")
    await ensureCofreExists("fortuna-dourada")
    await ensureCofreExists("mega-sorte")

    const cofres = await sql`
      SELECT * FROM game_cofres ORDER BY game_name
    `
    return cofres
  } catch (error) {
    console.error("❌ Erro ao buscar todos os cofres:", error)
    return []
  }
}

// Função para calcular estatísticas do cofre
export async function getCofreStatistics(gameName: string): Promise<{
  balance: number
  availableForPrizes: number
  totalContributed: number
  totalDistributed: number
  gameCount: number
  prizeChance: number
  nextPrizeValues: number[]
} | null> {
  try {
    const cofreStats = await getCofreStats(gameName)
    if (!cofreStats) return null

    const config = getGameConfig(gameName, "regular")
    if (!config.cofre) return null

    const balance = toNumber(cofreStats.balance)
    const availableForPrizes = (balance * config.cofre.availablePercentage) / 100
    const availablePrizeValues = config.cofre.prizeValues.filter((value) => value <= availableForPrizes)

    return {
      balance,
      availableForPrizes,
      totalContributed: toNumber(cofreStats.total_contributed),
      totalDistributed: toNumber(cofreStats.total_distributed),
      gameCount: cofreStats.game_count,
      prizeChance: config.cofre.prizeChance,
      nextPrizeValues: availablePrizeValues,
    }
  } catch (error) {
    console.error("❌ Erro ao calcular estatísticas do cofre:", error)
    return null
  }
}
