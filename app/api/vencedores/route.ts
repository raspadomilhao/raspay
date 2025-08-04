import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Lista MUITO expandida de nomes brasileiros realistas
const botNames = [
  "Carlos M. Silva",
  "Ana S. Oliveira",
  "Pedro L. Costa",
  "Julia R. Ferreira",
  "Roberto K. Almeida",
  "Maria F. Castro",
  "João P. Nascimento",
  "Fernanda C. Souza",
  "Ricardo T. Moreira",
  "Camila B. Santos",
  "Bruno H. Lima",
  "Larissa M. Rocha",
  "Diego A. Pereira",
  "Patrícia V. Gomes",
  "Marcos L. Silva",
  "Beatriz O. Costa",
  "Rafael N. Barbosa",
  "Gabriela S. Monteiro",
  "Lucas E. Santos",
  "Amanda R. Campos",
  "Thiago M. Reis",
  "Juliana P. Lima",
  "Felipe G. Rocha",
  "Carla D. Moura",
  "André W. Santos",
  "Renata L. Ferreira",
  "Gustavo F. Oliveira",
  "Priscila B. Silva",
  "Rodrigo C. Alves",
  "Vanessa T. Machado",
  "Daniel K. Santos",
  "Tatiana M. Costa",
  "Leandro S. Pereira",
  "Cristina A. Rocha",
  "Fábio R. Santos",
  "Mônica H. Lima",
  "Vinicius L. Ferreira",
  "Simone P. Gomes",
  "Eduardo N. Silva",
  "Adriana G. Costa",
  "Marcelo D. Oliveira",
  "Luciana F. Santos",
  "Alessandro B. Lima",
  "Karina S. Rocha",
  "Henrique M. Silva",
  "Débora R. Costa",
  "William T. Almeida",
  "Eliane C. Santos",
  "Matheus A. Lima",
  "Silvia L. Ferreira",
  "José C. Oliveira",
  "Fernanda A. Santos",
  "Ricardo P. Costa",
  "Camila S. Lima",
  "Bruno R. Silva",
  "Larissa O. Rocha",
  "Diego S. Pereira",
  "Patrícia L. Gomes",
  "Marcos S. Costa",
  "Beatriz S. Oliveira",
  "Rafael M. Santos",
  "Gabriela L. Silva",
  "Lucas R. Costa",
  "Amanda S. Lima",
  "Thiago P. Rocha",
  "Juliana M. Santos",
  "Felipe R. Silva",
  "Carla S. Costa",
  "André L. Lima",
  "Renata M. Rocha",
  "Gustavo S. Santos",
  "Priscila L. Silva",
  "Rodrigo M. Costa",
  "Vanessa S. Lima",
  "Daniel R. Rocha",
  "Tatiana L. Santos",
  "Leandro M. Silva",
  "Cristina S. Costa",
  "Fábio L. Lima",
  "Mônica R. Rocha",
  "Vinicius S. Santos",
  "Simone L. Silva",
  "Eduardo M. Costa",
  "Adriana S. Lima",
  "Marcelo R. Rocha",
  "Luciana S. Santos",
  "Alessandro L. Silva",
  "Karina M. Costa",
  "Henrique S. Lima",
  "Débora R. Rocha",
  "William S. Santos",
  "Eliane L. Silva",
  "Matheus M. Costa",
  "Silvia S. Lima",
  "José R. Rocha",
  "Fernanda S. Santos",
  "Ricardo L. Silva",
  "Camila M. Costa",
  "Bruno R. Costa",
  "Larissa S. Lima",
  "Diego L. Rocha",
  "Patrícia M. Santos",
  "Marcos L. Silva",
  "Beatriz R. Costa",
  "Rafael S. Lima",
  "Gabriela L. Rocha",
  "Lucas L. Silva",
  "Amanda R. Costa",
  "Thiago S. Lima",
  "Juliana L. Rocha",
  "Felipe M. Santos",
  "Carla L. Silva",
  "André R. Costa",
  "Renata S. Lima",
  "Gustavo L. Rocha",
  "Priscila M. Santos",
  "Rodrigo L. Silva",
  "Vanessa R. Costa",
  "Daniel S. Lima",
  "Tatiana L. Rocha",
  "Leandro M. Santos",
  "Cristina L. Silva",
  "Fábio R. Costa",
  "Mônica S. Lima",
  "Vinicius L. Rocha",
  "Simone M. Santos",
  "Eduardo L. Silva",
  "Adriana R. Costa",
  "Marcelo S. Lima",
  "Luciana L. Rocha",
  "Alessandro M. Santos",
  "Karina L. Silva",
  "Henrique R. Costa",
  "Débora S. Lima",
  "William L. Rocha",
  "Eliane M. Santos",
  "Matheus L. Silva",
  "Silvia R. Costa",
  "José S. Lima",
  "Fernanda L. Rocha",
  "Ricardo M. Santos",
  "Camila L. Silva",
  "Bruno R. Costa",
  "Larissa S. Lima",
  "Diego L. Rocha",
  "Patrícia M. Santos",
  "Marcos L. Silva",
  "Beatriz R. Costa",
  "Rafael S. Lima",
  "Gabriela L. Rocha",
]

const gameNames = ["Raspe da Esperança", "Fortuna Dourada", "Mega Sorte"]

// Prêmios monetários com mais variação
const monetaryPrizes = {
  "Raspe da Esperança": [
    1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 60, 75, 80, 100, 120, 150, 180, 200, 250, 300, 400, 500, 600,
    750, 800, 1000,
  ],
  "Fortuna Dourada": [
    3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1200, 1500,
    1800, 2000, 2500, 3000, 4000, 5000,
  ],
  "Mega Sorte": [
    5, 10, 15, 25, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1200, 1500, 2000, 2500, 3000, 4000,
    5000, 6000, 7500, 8000, 10000,
  ],
}

// Prêmios físicos com valores mais realistas
const physicalPrizes = [
  {
    name: "Smartwatch Galaxy",
    value: 899,
    rarity: 0.18,
    image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
  },
  {
    name: "JBL Charge 5",
    value: 449,
    rarity: 0.22,
    image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
  },
  {
    name: "PlayStation 5 Slim",
    value: 3799,
    rarity: 0.08,
    image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
  },
  {
    name: "Cadeira Gamer RGB",
    value: 1299,
    rarity: 0.12,
    image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
  },
  {
    name: "Redmi Note 13 Pro",
    value: 1199,
    rarity: 0.15,
    image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
  },
  {
    name: "Moto Honda CB 650R",
    value: 42000,
    rarity: 0.02,
    image: "/images/moto.png",
  },
  {
    name: "iPhone 15 Pro Max 256GB",
    value: 9499,
    rarity: 0.05,
    image: "/images/iphone.png",
  },
  {
    name: 'iPad Pro 11" M4',
    value: 7299,
    rarity: 0.06,
    image: "/images/ipad.png",
  },
  {
    name: "Notebook Gamer Acer",
    value: 4599,
    rarity: 0.04,
    image: null,
  },
  {
    name: 'Smart TV 65" 4K',
    value: 2899,
    rarity: 0.07,
    image: null,
  },
  {
    name: "Air Fryer Philco 12L",
    value: 599,
    rarity: 0.16,
    image: null,
  },
  {
    name: "Fone Sony WH-1000XM5",
    value: 1899,
    rarity: 0.1,
    image: null,
  },
]

// Cidades brasileiras expandidas com estados
const cities = [
  "São Paulo - SP",
  "Rio de Janeiro - RJ",
  "Belo Horizonte - MG",
  "Salvador - BA",
  "Brasília - DF",
  "Fortaleza - CE",
  "Curitiba - PR",
  "Recife - PE",
  "Porto Alegre - RS",
  "Manaus - AM",
  "Belém - PA",
  "Goiânia - GO",
  "Guarulhos - SP",
  "Campinas - SP",
  "São Luís - MA",
  "São Gonçalo - RJ",
  "Maceió - AL",
  "Duque de Caxias - RJ",
  "Natal - RN",
  "Teresina - PI",
  "Campo Grande - MS",
  "João Pessoa - PB",
  "Contagem - MG",
  "São José dos Campos - SP",
  "Ribeirão Preto - SP",
  "Uberlândia - MG",
  "Sorocaba - SP",
  "Aracaju - SE",
  "Feira de Santana - BA",
  "Cuiabá - MT",
  "Joinville - SC",
  "Juiz de Fora - MG",
  "Londrina - PR",
  "Aparecida de Goiânia - GO",
  "Ananindeua - PA",
  "Porto Velho - RO",
  "Serra - ES",
  "Niterói - RJ",
  "Caxias do Sul - RS",
  "Campos dos Goytacazes - RJ",
  "Vila Velha - ES",
  "Florianópolis - SC",
  "São João de Meriti - RJ",
  "Santos - SP",
  "Mauá - SP",
  "Carapicuíba - SP",
  "Olinda - PE",
  "Betim - MG",
  "Diadema - SP",
  "Jundiaí - SP",
  "Campina Grande - PB",
  "Piracicaba - SP",
  "Bauru - SP",
  "Montes Claros - MG",
  "Pelotas - RS",
  "Anápolis - GO",
  "Cariacica - ES",
  "Taubaté - SP",
  "Caucaia - CE",
]

// Cache para evitar repetições muito próximas
let lastGeneratedBots: any[] = []
let lastGenerationTime = 0

function generateBotWinners(count: number) {
  const now = Date.now()

  // Se foi gerado há menos de 30 segundos, retornar cache com pequenas modificações
  if (now - lastGenerationTime < 30000 && lastGeneratedBots.length > 0) {
    return lastGeneratedBots.map((bot) => ({
      ...bot,
      id: `bot_${now}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(now - Math.random() * 180 * 60 * 1000).toISOString(),
    }))
  }

  const bots = []
  const usedNames = new Set()
  const usedCombinations = new Set()

  // GARANTIR MIX BALANCEADO: 50% físicos, 50% monetários
  const targetPhysicalPrizes = Math.floor(count * 0.5) // Exatamente 50%
  const targetMonetaryPrizes = count - targetPhysicalPrizes
  let physicalPrizesGenerated = 0
  let monetaryPrizesGenerated = 0

  // Diferentes "sessões" de jogadores para parecer mais natural
  const sessions = [
    { timeRange: [5, 30], prizeMultiplier: 1.2 }, // Sessão recente - prêmios um pouco maiores
    { timeRange: [30, 90], prizeMultiplier: 1.0 }, // Sessão normal
    { timeRange: [90, 180], prizeMultiplier: 0.8 }, // Sessão mais antiga - prêmios menores
  ]

  for (let i = 0; i < count; i++) {
    let attempts = 0
    let name, game, combination

    // Evitar repetições de nome + jogo
    do {
      name = botNames[Math.floor(Math.random() * botNames.length)]
      game = gameNames[Math.floor(Math.random() * gameNames.length)]
      combination = `${name}_${game}`
      attempts++
    } while (usedCombinations.has(combination) && attempts < 50)

    usedNames.add(name)
    usedCombinations.add(combination)

    // Escolher sessão aleatória
    const session = sessions[Math.floor(Math.random() * sessions.length)]

    // LÓGICA BALANCEADA: Alternar entre físicos e monetários
    let shouldBePhysical = false
    const remaining = count - i
    const physicalRemaining = targetPhysicalPrizes - physicalPrizesGenerated
    const monetaryRemaining = targetMonetaryPrizes - monetaryPrizesGenerated

    if (physicalRemaining > 0 && monetaryRemaining > 0) {
      // Se ainda precisamos de ambos, alternar baseado no que está mais atrasado
      if (physicalPrizesGenerated < monetaryPrizesGenerated) {
        shouldBePhysical = true
      } else if (monetaryPrizesGenerated < physicalPrizesGenerated) {
        shouldBePhysical = false
      } else {
        // Se estão iguais, alternar aleatoriamente
        shouldBePhysical = Math.random() < 0.5
      }
    } else if (physicalRemaining > 0) {
      // Só precisamos de físicos
      shouldBePhysical = true
    } else {
      // Só precisamos de monetários
      shouldBePhysical = false
    }

    let prize
    let prizeType = "monetary"
    let prizeName = null
    let prizeImage = null

    if (shouldBePhysical) {
      // Gerar prêmio físico
      const shuffledPhysicalPrizes = [...physicalPrizes].sort(() => Math.random() - 0.5)

      for (const physicalPrize of shuffledPhysicalPrizes) {
        // Garantir que sempre consegue um prêmio físico quando necessário
        const adjustedRarity = Math.min(physicalPrize.rarity * 3, 0.95) // Triplicar raridade
        if (Math.random() < adjustedRarity) {
          prize = Math.round(physicalPrize.value * session.prizeMultiplier)
          prizeName = physicalPrize.name
          prizeImage = physicalPrize.image
          prizeType = "physical"
          physicalPrizesGenerated++
          break
        }
      }

      // Se não conseguiu prêmio físico, forçar um aleatório
      if (prizeType !== "physical") {
        const forcedPrize = physicalPrizes[Math.floor(Math.random() * physicalPrizes.length)]
        prize = Math.round(forcedPrize.value * session.prizeMultiplier)
        prizeName = forcedPrize.name
        prizeImage = forcedPrize.image
        prizeType = "physical"
        physicalPrizesGenerated++
      }
    } else {
      // Gerar prêmio monetário
      const gamePrizes = monetaryPrizes[game as keyof typeof monetaryPrizes]

      // Distribuição mais natural de prêmios monetários
      const rand = Math.random()
      let prizeIndex

      if (rand < 0.6) {
        // 60% - prêmios pequenos (primeiros 40% da lista)
        prizeIndex = Math.floor(Math.random() * (gamePrizes.length * 0.4))
      } else if (rand < 0.85) {
        // 25% - prêmios médios (40% a 70% da lista)
        prizeIndex = Math.floor(gamePrizes.length * 0.4 + Math.random() * (gamePrizes.length * 0.3))
      } else {
        // 15% - prêmios grandes (últimos 30% da lista)
        prizeIndex = Math.floor(gamePrizes.length * 0.7 + Math.random() * (gamePrizes.length * 0.3))
      }

      prize = Math.round(gamePrizes[prizeIndex] * session.prizeMultiplier)
      monetaryPrizesGenerated++
    }

    // Gerar timestamp baseado na sessão
    const minMinutes = session.timeRange[0]
    const maxMinutes = session.timeRange[1]
    const minutesAgo = minMinutes + Math.random() * (maxMinutes - minMinutes)
    const timestamp = new Date(now - minutesAgo * 60 * 1000)

    // Cidade ocasional (30% chance)
    const city = Math.random() < 0.3 ? cities[Math.floor(Math.random() * cities.length)] : null

    bots.push({
      id: `bot_${now}_${i}_${Math.random().toString(36).substr(2, 5)}`,
      user_name: name,
      game_name: game,
      prize_amount: prize,
      prize_name: prizeName,
      prize_image: prizeImage,
      prize_type: prizeType,
      created_at: timestamp.toISOString(),
      is_bot: true,
      city: city,
      is_physical_prize: prizeType === "physical",
    })
  }

  // Embaralhar para não ficar óbvio o padrão
  const shuffledBots = bots.sort(() => Math.random() - 0.5)

  // Depois ordenar por data para parecer mais natural
  shuffledBots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Atualizar cache
  lastGeneratedBots = shuffledBots
  lastGenerationTime = now

  return shuffledBots
}

function generateSpecialWinners() {
  const specialWinners = []
  const now = Date.now()

  // SEMPRE gerar pelo menos 1 prêmio físico especial
  const megaPrizes = [
    {
      name: "Moto Honda CB 650R",
      value: 42000,
      image: "/images/moto.png",
    },
    {
      name: "iPhone 15 Pro Max 1TB",
      value: 11999,
      image: "/images/iphone.png",
    },
    {
      name: 'iPad Pro 12.9" M4 1TB',
      value: 9999,
      image: "/images/ipad.png",
    },
    {
      name: "PlayStation 5 Pro",
      value: 4999,
      image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
    },
    {
      name: "Smartwatch Galaxy Ultra",
      value: 2499,
      image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
    },
    {
      name: "JBL PartyBox 310",
      value: 1899,
      image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
    },
  ]

  const name1 = botNames[Math.floor(Math.random() * botNames.length)]
  const game1 = gameNames[Math.floor(Math.random() * gameNames.length)]
  const megaPrize = megaPrizes[Math.floor(Math.random() * megaPrizes.length)]

  const minutesAgo1 = 10 + Math.random() * 230
  const timestamp1 = new Date(now - minutesAgo1 * 60 * 1000)

  specialWinners.push({
    id: `mega_special_${now}_${Math.random().toString(36).substr(2, 9)}`,
    user_name: name1,
    game_name: game1,
    prize_amount: megaPrize.value,
    prize_name: megaPrize.name,
    prize_image: megaPrize.image,
    prize_type: "physical",
    created_at: timestamp1.toISOString(),
    is_bot: true,
    is_physical_prize: true,
    is_mega_special: true,
  })

  // SEMPRE gerar pelo menos 1 jackpot monetário
  const jackpotPrizes = [8000, 12000, 15000, 20000, 25000, 30000]
  const jackpotGames = ["Mega Sorte", "Fortuna Dourada"]

  const name2 = botNames[Math.floor(Math.random() * botNames.length)]
  const game2 = jackpotGames[Math.floor(Math.random() * jackpotGames.length)]
  const prize2 = jackpotPrizes[Math.floor(Math.random() * jackpotPrizes.length)]

  const minutesAgo2 = 15 + Math.random() * 200
  const timestamp2 = new Date(now - minutesAgo2 * 60 * 1000)

  specialWinners.push({
    id: `jackpot_${now}_${Math.random().toString(36).substr(2, 9)}`,
    user_name: name2,
    game_name: game2,
    prize_amount: prize2,
    prize_name: null,
    prize_image: null,
    prize_type: "monetary",
    created_at: timestamp2.toISOString(),
    is_bot: true,
    is_jackpot: true,
    is_physical_prize: false,
  })

  // 50% chance de ter um prêmio físico médio adicional
  if (Math.random() < 0.5) {
    const mediumPhysicalPrizes = [
      {
        name: "Cadeira Gamer RGB Pro",
        value: 1599,
        image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
      },
      {
        name: "Redmi Note 13 Pro Max",
        value: 1499,
        image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
      },
      {
        name: "Air Fryer Philco 15L",
        value: 899,
        image: null,
      },
      {
        name: 'Smart TV 50" 4K Samsung',
        value: 2299,
        image: null,
      },
    ]

    const name3 = botNames[Math.floor(Math.random() * botNames.length)]
    const game3 = gameNames[Math.floor(Math.random() * gameNames.length)]
    const mediumPrize = mediumPhysicalPrizes[Math.floor(Math.random() * mediumPhysicalPrizes.length)]

    const minutesAgo3 = 20 + Math.random() * 150
    const timestamp3 = new Date(now - minutesAgo3 * 60 * 1000)

    specialWinners.push({
      id: `medium_special_${now}_${Math.random().toString(36).substr(2, 9)}`,
      user_name: name3,
      game_name: game3,
      prize_amount: mediumPrize.value,
      prize_name: mediumPrize.name,
      prize_image: mediumPrize.image,
      prize_type: "physical",
      created_at: timestamp3.toISOString(),
      is_bot: true,
      is_physical_prize: true,
      is_medium_special: true,
    })
  }

  return specialWinners
}

export async function GET(request: NextRequest) {
  try {
    // Buscar vencedores reais das últimas 24 horas
    const realWinners = await sql`
      SELECT 
        t.id,
        u.name as user_name,
        'Raspadinha' as game_name,
        t.amount as prize_amount,
        NULL as prize_name,
        NULL as prize_image,
        'monetary' as prize_type,
        t.created_at,
        false as is_physical_prize
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'game_prize' 
        AND t.amount > 0
        AND t.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY t.created_at DESC
      LIMIT 3
    `

    // Gerar quantidade variável de bots (20-35)
    const botCount = 20 + Math.floor(Math.random() * 16)
    const botWinners = generateBotWinners(botCount)

    // Gerar vencedores especiais
    const specialWinners = generateSpecialWinners()

    // Combinar todos os vencedores
    const allWinners = [
      ...realWinners.map((winner) => ({
        ...winner,
        is_bot: false,
        prize_type: winner.prize_type || "monetary",
        is_physical_prize: winner.is_physical_prize || false,
        prize_image: winner.prize_image || null,
      })),
      ...specialWinners,
      ...botWinners,
    ]

    // Embaralhar levemente e ordenar por data, limitando a 25
    const sortedWinners = allWinners
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime()
        const timeB = new Date(b.created_at).getTime()
        // Adicionar pequena aleatoriedade para não ficar muito óbvio
        return timeB - timeA + (Math.random() - 0.5) * 60000 // ±30 segundos de aleatoriedade
      })
      .slice(0, 25)

    return NextResponse.json({
      success: true,
      winners: sortedWinners,
      total: sortedWinners.length,
      real_winners: realWinners.length,
      bot_winners: botWinners.length + specialWinners.length,
      physical_prizes: sortedWinners.filter((w) => w.is_physical_prize).length,
      monetary_prizes: sortedWinners.filter((w) => !w.is_physical_prize).length,
      generation_time: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao buscar vencedores:", error)

    // Em caso de erro, retornar bots de emergência
    const emergencyBots = generateBotWinners(20)
    const emergencySpecial = generateSpecialWinners()

    return NextResponse.json({
      success: true,
      winners: [...emergencySpecial, ...emergencyBots].slice(0, 20),
      total: 20,
      real_winners: 0,
      bot_winners: 20,
      physical_prizes: [...emergencySpecial, ...emergencyBots].filter((w) => w.is_physical_prize).length,
      monetary_prizes: [...emergencySpecial, ...emergencyBots].filter((w) => !w.is_physical_prize).length,
      error: "Dados simulados devido a erro na base de dados",
    })
  }
}
