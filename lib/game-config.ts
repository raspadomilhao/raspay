export interface GameConfig {
  name: string
  price: number
  prizes: number[]
  probabilities: number[]
  cofre?: {
    enabled: boolean
    contributionRate: number // Porcentagem do valor líquido que vai para o cofre
    prizeChance: number // Chance de ganhar prêmio do cofre (1-100)
    prizeValues: number[] // Valores possíveis de prêmio do cofre
    availablePercentage: number // Porcentagem do saldo disponível para prêmios
    minCofreAmount: number // Valor mínimo no cofre para sortear prêmios
    onlyRegularUsers: boolean // Se apenas usuários regulares podem ganhar do cofre
  }
}

const gameConfigs: Record<string, GameConfig> = {
  "raspe-da-esperanca": {
    name: "Raspe da Esperança",
    price: 1.0,
    prizes: [2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000],
    probabilities: [0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02, 0.015, 0.01, 0.008, 0.005, 0.003, 0.001],
    cofre: {
      enabled: true,
      contributionRate: 100, // 100% do valor líquido vai para o cofre
      prizeChance: 1, // 1% de chance por jogada
      prizeValues: [50, 100, 200, 500, 1000, 2000], // Prêmios possíveis do cofre
      availablePercentage: 30, // 30% do saldo do cofre disponível para prêmios
      minCofreAmount: 100, // Mínimo R$ 100 no cofre para sortear
      onlyRegularUsers: true, // Apenas usuários regulares
    },
  },
  "fortuna-dourada": {
    name: "Fortuna Dourada",
    price: 3.0,
    prizes: [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000],
    probabilities: [
      0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015, 0.01, 0.008, 0.005, 0.003, 0.001,
    ],
    cofre: {
      enabled: true,
      contributionRate: 100,
      prizeChance: 1.5, // 1.5% de chance
      prizeValues: [100, 200, 500, 1000, 2000, 5000],
      availablePercentage: 30,
      minCofreAmount: 200,
      onlyRegularUsers: true,
    },
  },
  "mega-sorte": {
    name: "Mega Sorte",
    price: 5.0,
    prizes: [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 7500, 10000],
    probabilities: [0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015, 0.01, 0.005, 0.002],
    cofre: {
      enabled: true,
      contributionRate: 100,
      prizeChance: 2, // 2% de chance
      prizeValues: [200, 500, 1000, 2000, 5000, 10000],
      availablePercentage: 30,
      minCofreAmount: 500,
      onlyRegularUsers: true,
    },
  },
}

export function getGameConfig(gameName: string, userType = "regular"): GameConfig {
  const config = gameConfigs[gameName]
  if (!config) {
    throw new Error(`Configuração não encontrada para o jogo: ${gameName}`)
  }

  console.log(`🎮 Configuração do jogo ${gameName} para usuário ${userType}:`, config)
  return config
}

export function shouldDrawCofrePrize(cofreConfig: GameConfig["cofre"], userType: string): boolean {
  if (!cofreConfig?.enabled) {
    console.log("🏦 Cofre desabilitado")
    return false
  }

  if (cofreConfig.onlyRegularUsers && userType !== "regular") {
    console.log(`🏦 Cofre apenas para usuários regulares, usuário atual: ${userType}`)
    return false
  }

  const roll = Math.random() * 100
  const shouldDraw = roll < cofreConfig.prizeChance

  console.log(`🎰 Sorteio do cofre: ${roll.toFixed(2)}% < ${cofreConfig.prizeChance}% = ${shouldDraw}`)
  return shouldDraw
}

export function calculateCofrePrize(cofreBalance: number, cofreConfig: GameConfig["cofre"]): number {
  if (!cofreConfig) return 0

  const availableAmount = (cofreBalance * cofreConfig.availablePercentage) / 100
  console.log(
    `💰 Valor disponível no cofre: R$ ${availableAmount.toFixed(2)} (${cofreConfig.availablePercentage}% de R$ ${cofreBalance.toFixed(2)})`,
  )

  // Filtrar prêmios que cabem no valor disponível
  const availablePrizes = cofreConfig.prizeValues.filter((prize) => prize <= availableAmount)

  if (availablePrizes.length === 0) {
    console.log("❌ Nenhum prêmio disponível para o saldo atual")
    return 0
  }

  // Sortear um prêmio aleatório dos disponíveis
  const selectedPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)]
  console.log(`🎁 Prêmio sorteado: R$ ${selectedPrize.toFixed(2)} (de ${availablePrizes.length} opções)`)

  return selectedPrize
}
