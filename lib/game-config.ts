export interface CofreConfig {
  enabled: boolean
  prizeChance: number // Porcentagem de chance de ganhar prêmio do cofre
  prizeValues: number[] // Valores possíveis de prêmios
  availablePercentage: number // Porcentagem do saldo disponível para prêmios
  minCofreAmount: number // Valor mínimo no cofre para sortear
  onlyRegularUsers: boolean // Se apenas usuários regulares podem ganhar
}

export interface GameConfig {
  name: string
  minBet: number
  maxBet: number
  prizes: { value: number; probability: number }[]
  houseEdge: number
  cofre?: CofreConfig
}

const gameConfigs: Record<string, GameConfig> = {
  "raspe-da-esperanca": {
    name: "Raspe da Esperança",
    minBet: 1,
    maxBet: 100,
    prizes: [
      { value: 0, probability: 70 }, // 70% chance de não ganhar nada
      { value: 2, probability: 15 }, // 15% chance de ganhar 2x
      { value: 5, probability: 10 }, // 10% chance de ganhar 5x
      { value: 10, probability: 4 }, // 4% chance de ganhar 10x
      { value: 50, probability: 1 }, // 1% chance de ganhar 50x
    ],
    houseEdge: 0.15, // 15% de margem da casa
    cofre: {
      enabled: true,
      prizeChance: 1, // 1% de chance por jogada
      prizeValues: [10, 25, 50, 100, 250, 500], // Valores possíveis
      availablePercentage: 30, // 30% do saldo disponível
      minCofreAmount: 100, // Mínimo R$ 100 no cofre
      onlyRegularUsers: true, // Apenas usuários regulares
    },
  },
  "fortuna-dourada": {
    name: "Fortuna Dourada",
    minBet: 2,
    maxBet: 200,
    prizes: [
      { value: 0, probability: 65 },
      { value: 3, probability: 20 },
      { value: 8, probability: 10 },
      { value: 20, probability: 4 },
      { value: 100, probability: 1 },
    ],
    houseEdge: 0.18,
    cofre: {
      enabled: true,
      prizeChance: 1.5,
      prizeValues: [20, 50, 100, 200, 500, 1000],
      availablePercentage: 25,
      minCofreAmount: 200,
      onlyRegularUsers: true,
    },
  },
  "mega-sorte": {
    name: "Mega Sorte",
    minBet: 5,
    maxBet: 500,
    prizes: [
      { value: 0, probability: 60 },
      { value: 2, probability: 25 },
      { value: 10, probability: 10 },
      { value: 25, probability: 4 },
      { value: 200, probability: 1 },
    ],
    houseEdge: 0.2,
    cofre: {
      enabled: true,
      prizeChance: 2,
      prizeValues: [50, 100, 250, 500, 1000, 2500],
      availablePercentage: 35,
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
  return config
}

export function shouldDrawCofrePrize(cofreConfig: CofreConfig, userType = "regular"): boolean {
  if (!cofreConfig.enabled) return false
  if (cofreConfig.onlyRegularUsers && userType !== "regular") return false

  const random = Math.random() * 100
  const shouldDraw = random < cofreConfig.prizeChance

  console.log(`🎲 Sorteio do cofre: ${random.toFixed(2)}% < ${cofreConfig.prizeChance}% = ${shouldDraw}`)

  return shouldDraw
}

export function calculateCofrePrize(cofreBalance: number, cofreConfig: CofreConfig): number {
  const availableAmount = (cofreBalance * cofreConfig.availablePercentage) / 100
  const availablePrizes = cofreConfig.prizeValues.filter((value) => value <= availableAmount)

  if (availablePrizes.length === 0) return 0

  // Sortear um prêmio aleatório dos disponíveis
  const randomIndex = Math.floor(Math.random() * availablePrizes.length)
  const selectedPrize = availablePrizes[randomIndex]

  console.log(`🎁 Prêmios disponíveis: [${availablePrizes.join(", ")}], sorteado: ${selectedPrize}`)

  return selectedPrize
}

export function getAllGameNames(): string[] {
  return Object.keys(gameConfigs)
}
