// Configurações centralizadas do RasPay
export const config = {
  // URLs base
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://v0-raspay.vercel.app",

  // Webhooks
  webhookUrl: process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/horsepay`
    : "https://v0-raspay.vercel.app/api/webhook/horsepay",

  // HorsePay
  horsepay: {
    clientKey: process.env.HORSEPAY_CLIENT_KEY || "",
    clientSecret: process.env.HORSEPAY_CLIENT_SECRET || "",
    apiUrl: "https://api.horsepay.io",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "raspay05072025",
    expiresIn: "7d",
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || "",
  },

  // Jogos
  games: {
    "raspe-da-esperanca": {
      name: "Raspe da Esperança",
      price: 1,
      maxPrize: 1000,
      winChance: 0.15, // 15% de chance de ganhar
    },
    "fortuna-dourada": {
      name: "Fortuna Dourada",
      price: 3,
      maxPrize: 5000,
      winChance: 0.12, // 12% de chance de ganhar
    },
    "mega-sorte": {
      name: "Mega Sorte",
      price: 5,
      maxPrize: 10000,
      winChance: 0.1, // 10% de chance de ganhar
    },
  },

  // Limites
  limits: {
    minDeposit: 20,
    minWithdraw: 20,
    maxWithdraw: 10000,
  },

  // Taxas (absorvidas pela plataforma)
  fees: {
    deposit: 0, // Sem taxa para depósito
    withdraw: 0, // Sem taxa para saque
    horsePayFee: 0.05, // 5% de taxa da HorsePay (absorvida)
  },
}

export default config
