import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Lista expandida de nomes brasileiros completos para bots
const botNames = [
  "Carlos Mendes Silva",
  "Ana Santos Oliveira",
  "Pedro Lima Costa",
  "Julia Rodrigues Ferreira",
  "Roberto Kardec Almeida",
  "Maria Fernanda Castro",
  "João Paulo Nascimento",
  "Fernanda Cristina Souza",
  "Ricardo Tavares Moreira",
  "Camila Beatriz Santos",
  "Bruno Henrique Lima",
  "Larissa Martins Rocha",
  "Diego Alves Pereira",
  "Patrícia Vieira Gomes",
  "Marcos Leandro Silva",
  "Beatriz Oliveira Costa",
  "Rafael Nunes Barbosa",
  "Gabriela Silva Monteiro",
  "Lucas Eduardo Santos",
  "Amanda Ribeiro Campos",
  "Thiago Machado Reis",
  "Juliana Pereira Lima",
  "Felipe Gonçalves Rocha",
  "Carla Dantas Moura",
  "André Wilson Santos",
  "Renata Lopes Ferreira",
  "Gustavo Farias Oliveira",
  "Priscila Borges Silva",
  "Rodrigo Cardoso Alves",
  "Vanessa Torres Machado",
  "Daniel Kleber Santos",
  "Tatiana Moreira Costa",
  "Leandro Silva Pereira",
  "Cristina Almeida Rocha",
  "Fábio Ribeiro Santos",
  "Mônica Helena Lima",
  "Vinicius Lopes Ferreira",
  "Simone Pereira Gomes",
  "Eduardo Nascimento Silva",
  "Adriana Gonçalves Costa",
  "Marcelo Dias Oliveira",
  "Luciana Fonseca Santos",
  "Alessandro Barbosa Lima",
  "Karina Santos Rocha",
  "Henrique Martins Silva",
  "Débora Rodrigues Costa",
  "William Torres Almeida",
  "Eliane Carvalho Santos",
  "Matheus Andrade Lima",
  "Silvia Lopes Ferreira",
  "José Carlos Oliveira",
  "Fernanda Alves Santos",
  "Ricardo Pereira Costa",
  "Camila Santos Lima",
  "Bruno Rodrigues Silva",
  "Larissa Oliveira Rocha",
  "Diego Santos Pereira",
  "Patrícia Lima Gomes",
  "Marcos Silva Costa",
  "Beatriz Santos Oliveira",
]

const gameNames = ["Raspe da Esperança", "Fortuna Dourada", "Mega Sorte"]

// Prêmios monetários
const monetaryPrizes = {
  "Raspe da Esperança": [2, 5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000],
  "Fortuna Dourada": [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000],
  "Mega Sorte": [10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2500, 5000, 7500, 10000],
}

// Prêmios físicos com imagens específicas e chances MUITO aumentadas
const physicalPrizes = [
  {
    name: "Smartwatch",
    value: 800,
    rarity: 0.25, // 25% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
  },
  {
    name: "JBL Bluetooth",
    value: 400,
    rarity: 0.3, // 30% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
  },
  {
    name: "PlayStation 5",
    value: 3500,
    rarity: 0.15, // 15% chance - FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
  },
  {
    name: "Cadeira Gamer",
    value: 1200,
    rarity: 0.2, // 20% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
  },
  {
    name: "Redmi Note 14C",
    value: 900,
    rarity: 0.22, // 22% chance - MUITO FREQUENTE
    image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
  },
  // Prêmios mais raros (mantidos para variedade)
  {
    name: "iPhone 15 Pro Max",
    value: 8000,
    rarity: 0.05, // 5% chance
    image: null,
  },
  {
    name: 'iPad Pro 12.9"',
    value: 6000,
    rarity: 0.08, // 8% chance
    image: null,
  },
  {
    name: "MacBook Air M2",
    value: 7000,
    rarity: 0.03, // 3% chance
    image: null,
  },
]

// Cidades brasileiras para adicionar mais realismo
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
]

function generateBotWinners(count: number) {
  const bots = []
  const usedNames = new Set()

  for (let i = 0; i < count; i++) {
    // Garantir que não repetimos nomes na mesma geração
    let name
    do {
      name = botNames[Math.floor(Math.random() * botNames.length)]
    } while (usedNames.has(name) && usedNames.size < botNames.length)

    usedNames.add(name)

    const game = gameNames[Math.floor(Math.random() * gameNames.length)]

    // 🔥 NOVA LÓGICA: 70% chance de prêmio físico (MUITO MAIS FREQUENTE)
    let prize
    let prizeType = "monetary"
    let prizeName = null
    let prizeImage = null

    // Chance MUITO ALTA de prêmio físico
    const physicalPrizeRoll = Math.random()
    let wonPhysicalPrize = false

    if (physicalPrizeRoll < 0.7) {
      // 70% chance de prêmio físico
      // Ordenar prêmios por raridade (do mais comum para o menos comum)
      const sortedPhysicalPrizes = [...physicalPrizes].sort((a, b) => b.rarity - a.rarity)

      for (const physicalPrize of sortedPhysicalPrizes) {
        if (Math.random() < physicalPrize.rarity) {
          prize = physicalPrize.value
          prizeName = physicalPrize.name
          prizeImage = physicalPrize.image
          prizeType = "physical"
          wonPhysicalPrize = true
          break
        }
      }
    }

    // Se não ganhou prêmio físico, usar prêmio monetário normal (30% dos casos)
    if (!wonPhysicalPrize) {
      const gamePrizes = monetaryPrizes[game as keyof typeof monetaryPrizes]

      // Prêmios menores são mais comuns (80% chance), prêmios maiores são mais raros (20% chance)
      if (Math.random() < 0.8) {
        // 80% chance de prêmio pequeno/médio (primeiros 60% da lista)
        const smallPrizes = gamePrizes.slice(0, Math.ceil(gamePrizes.length * 0.6))
        prize = smallPrizes[Math.floor(Math.random() * smallPrizes.length)]
      } else {
        // 20% chance de prêmio grande (últimos 40% da lista)
        const bigPrizes = gamePrizes.slice(Math.ceil(gamePrizes.length * 0.6))
        prize = bigPrizes[Math.floor(Math.random() * bigPrizes.length)]
      }
    }

    // Gerar timestamp aleatório entre 30 segundos e 3 horas atrás
    const minutesAgo = Math.floor(Math.random() * 180) + 0.5 // 0.5 a 180.5 minutos
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    // Adicionar cidade aleatória ocasionalmente
    const city = Math.random() < 0.3 ? cities[Math.floor(Math.random() * cities.length)] : null

    bots.push({
      id: `bot_${Date.now()}_${i}`,
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

  return bots
}

// Função para gerar vencedores especiais (jackpots ocasionais)
function generateSpecialWinners() {
  const specialWinners = []

  // 40% chance de ter um prêmio físico especial recente (AUMENTADO)
  if (Math.random() < 0.4) {
    const specialPhysicalPrizes = [
      {
        name: "PlayStation 5",
        value: 3500,
        image: "https://files.raspouganhou.net/premio-jackpot/ps5_c17dbda1.webp",
      },
      {
        name: "Smartwatch Premium",
        value: 1200,
        image: "https://files.raspouganhou.net/premio-jackpot/smartwatch_e489b606.webp",
      },
      {
        name: "JBL Premium",
        value: 600,
        image: "https://files.raspouganhou.net/premio-jackpot/JBL_944de913.webp",
      },
      {
        name: "Cadeira Gamer Pro",
        value: 1800,
        image: "https://files.raspouganhou.net/3c4fa837-cbdf-436f-af74-9c13fa794089.png",
      },
      {
        name: "Redmi Note 14C Pro",
        value: 1200,
        image: "https://files.raspouganhou.net/premio-jackpot/redmi_14c_7ea01a6b.webp",
      },
    ]

    const name = botNames[Math.floor(Math.random() * botNames.length)]
    const game = gameNames[Math.floor(Math.random() * gameNames.length)]
    const physicalPrize = specialPhysicalPrizes[Math.floor(Math.random() * specialPhysicalPrizes.length)]

    // Prêmio físico entre 5 minutos e 2 horas atrás (mais recente)
    const minutesAgo = Math.floor(Math.random() * 115) + 5
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    specialWinners.push({
      id: `physical_special_${Date.now()}`,
      user_name: name,
      game_name: game,
      prize_amount: physicalPrize.value,
      prize_name: physicalPrize.name,
      prize_image: physicalPrize.image,
      prize_type: "physical",
      created_at: timestamp.toISOString(),
      is_bot: true,
      is_physical_prize: true,
      is_special_physical: true,
    })
  }

  // 20% chance de ter um jackpot monetário recente
  if (Math.random() < 0.2) {
    const jackpotPrizes = [5000, 7500, 10000, 15000, 20000]
    const jackpotGames = ["Mega Sorte", "Fortuna Dourada"]

    const name = botNames[Math.floor(Math.random() * botNames.length)]
    const game = jackpotGames[Math.floor(Math.random() * jackpotGames.length)]
    const prize = jackpotPrizes[Math.floor(Math.random() * jackpotPrizes.length)]

    // Jackpot entre 10 minutos e 2 horas atrás
    const minutesAgo = Math.floor(Math.random() * 110) + 10
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000)

    specialWinners.push({
      id: `jackpot_${Date.now()}`,
      user_name: name,
      game_name: game,
      prize_amount: prize,
      prize_name: null,
      prize_image: null,
      prize_type: "monetary",
      created_at: timestamp.toISOString(),
      is_bot: true,
      is_jackpot: true,
      is_physical_prize: false,
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
      LIMIT 5
    `

    // Gerar mais bots para aumentar a frequência de prêmios físicos (25-35 bots)
    const botCount = Math.floor(Math.random() * 11) + 25 // 25 a 35 bots
    const botWinners = generateBotWinners(botCount)

    // Gerar vencedores especiais ocasionalmente
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

    // Embaralhar e ordenar por data mais recente, limitando a 30 (aumentado)
    const sortedWinners = allWinners
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)

    return NextResponse.json({
      success: true,
      winners: sortedWinners,
      total: sortedWinners.length,
      real_winners: realWinners.length,
      bot_winners: botWinners.length + specialWinners.length,
      physical_prizes: sortedWinners.filter((w) => w.is_physical_prize).length,
      monetary_prizes: sortedWinners.filter((w) => !w.is_physical_prize).length,
    })
  } catch (error) {
    console.error("Erro ao buscar vencedores:", error)

    // Em caso de erro, retornar apenas bots com alta frequência de prêmios físicos
    const emergencyBots = generateBotWinners(25)
    const emergencySpecial = generateSpecialWinners()

    return NextResponse.json({
      success: true,
      winners: [...emergencySpecial, ...emergencyBots].slice(0, 25),
      total: 25,
      real_winners: 0,
      bot_winners: 25,
      physical_prizes: [...emergencySpecial, ...emergencyBots].filter((w) => w.is_physical_prize).length,
      monetary_prizes: [...emergencySpecial, ...emergencyBots].filter((w) => !w.is_physical_prize).length,
      error: "Dados simulados devido a erro na base de dados",
    })
  }
}
