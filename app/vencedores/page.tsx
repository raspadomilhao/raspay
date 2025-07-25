"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Gem,
  Home,
  LogOut,
  Calendar,
  DollarSign,
  MapPin,
  Menu,
  User,
  CreditCard,
  Zap,
  Gamepad2,
  TrendingUp,
  Wallet,
  Sparkles,
  Smartphone,
  Tablet,
  Bike,
  Gift,
  Watch,
  Headphones,
  Laptop,
} from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

interface Winner {
  id: string | number
  user_name: string | null
  game_name: string | null
  prize_amount: number
  prize_name?: string | null
  prize_type?: "monetary" | "physical"
  created_at: string
  is_bot?: boolean
  is_jackpot?: boolean
  is_physical_prize?: boolean
  is_special_physical?: boolean
  city?: string | null
}

interface UserProfile {
  user: {
    id: number
    email: string
    name: string | null
  }
  wallet: {
    balance: string | number
  }
}

// Função segura para obter iniciais
const getInitials = (name: string | undefined | null): string => {
  if (!name || typeof name !== "string") return "?"

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Função utilitária para formatar valores monetários
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return "0,00"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(numValue) ? "0,00" : numValue.toFixed(2)
}

// Função para formatar tempo relativo
const getTimeAgo = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  const diffInDays = Math.floor(diffInMinutes / (60 * 24))

  if (diffInMinutes < 1) return "Agora mesmo"
  if (diffInMinutes < 60) return `${diffInMinutes}min atrás`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`

  return `${diffInDays}d atrás`
}

export default function VencedoresPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Verificar se está logado
  useEffect(() => {
    const token = AuthClient.getToken()
    if (token) {
      setIsLoggedIn(true)
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [])

  // Buscar perfil do usuário
  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  // Buscar vencedores
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch("/api/vencedores")
        if (response.ok) {
          const data = await response.json()
          console.log("Vencedores recebidos:", data)
          setWinners(data.winners || [])
        }
      } catch (error) {
        console.error("Erro ao buscar vencedores:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWinners()

    // Atualizar vencedores a cada 30 segundos
    const interval = setInterval(fetchWinners, 30000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to safely convert to number and format
  const getCurrentBalance = (): number => {
    if (userProfile?.wallet?.balance !== undefined) {
      return typeof userProfile.wallet.balance === "string"
        ? Number.parseFloat(userProfile.wallet.balance)
        : userProfile.wallet.balance
    }
    return 0
  }

  // Função de logout
  const handleLogout = () => {
    AuthClient.logout()
    window.location.href = "/auth"
  }

  // Função para obter ícone do prêmio baseado no tipo e valor
  const getPrizeIcon = (winner: Winner) => {
    if (winner.is_physical_prize) {
      const prizeName = winner.prize_name?.toLowerCase() || ""

      if (prizeName.includes("moto")) {
        return <Bike className="h-6 w-6 text-red-400" />
      }
      if (prizeName.includes("iphone")) {
        return <Smartphone className="h-6 w-6 text-blue-400" />
      }
      if (prizeName.includes("ipad")) {
        return <Tablet className="h-6 w-6 text-purple-400" />
      }
      if (prizeName.includes("macbook")) {
        return <Laptop className="h-6 w-6 text-gray-400" />
      }
      if (prizeName.includes("watch")) {
        return <Watch className="h-6 w-6 text-orange-400" />
      }
      if (prizeName.includes("airpods")) {
        return <Headphones className="h-6 w-6 text-white" />
      }
      return <Gift className="h-6 w-6 text-pink-400" />
    }

    const prize = winner.prize_amount
    if (prize >= 10000) return <Crown className="h-6 w-6 text-yellow-400" />
    if (prize >= 5000) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (prize >= 1000) return <Medal className="h-6 w-6 text-orange-400" />
    if (prize >= 100) return <Star className="h-6 w-6 text-orange-500" />
    return <Gem className="h-6 w-6 text-green-400" />
  }

  // Função para obter cor do prêmio
  const getPrizeColor = (winner: Winner) => {
    if (winner.is_physical_prize) {
      const prizeName = winner.prize_name?.toLowerCase() || ""

      if (prizeName.includes("moto")) {
        return "from-red-400 to-red-600"
      }
      if (prizeName.includes("iphone")) {
        return "from-blue-400 to-blue-600"
      }
      if (prizeName.includes("ipad")) {
        return "from-purple-400 to-purple-600"
      }
      if (prizeName.includes("macbook")) {
        return "from-gray-400 to-gray-600"
      }
      if (prizeName.includes("watch")) {
        return "from-orange-400 to-orange-600"
      }
      if (prizeName.includes("airpods")) {
        return "from-white to-gray-300"
      }
      return "from-pink-400 to-pink-600"
    }

    const prize = winner.prize_amount
    if (prize >= 10000) return "from-yellow-400 to-yellow-600"
    if (prize >= 5000) return "from-yellow-500 to-orange-500"
    if (prize >= 1000) return "from-orange-400 to-red-500"
    if (prize >= 100) return "from-orange-500 to-red-600"
    return "from-green-400 to-emerald-500"
  }

  // Função para obter cor de fundo do card baseado no tipo de prêmio
  const getCardBackground = (winner: Winner) => {
    if (winner.is_physical_prize) {
      const prizeName = winner.prize_name?.toLowerCase() || ""

      if (prizeName.includes("moto")) {
        return "from-red-500/20 to-red-600/10"
      }
      if (prizeName.includes("macbook")) {
        return "from-gray-500/20 to-gray-600/10"
      }
      return "from-purple-500/20 to-pink-500/10"
    }

    const prize = winner.prize_amount
    if (prize >= 10000) return "from-yellow-500/10 to-yellow-600/5"
    if (prize >= 5000) return "from-yellow-500/10 to-orange-500/5"
    if (prize >= 1000) return "from-orange-500/10 to-red-500/5"
    if (prize >= 100) return "from-orange-500/10 to-red-600/5"
    return "from-green-500/10 to-emerald-500/5"
  }

  if (loading && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando vencedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Menu Lateral */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-slate-900 border-slate-700 w-64">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-white font-bold">RasPay</span>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <nav className="flex-1 p-4">
                        <div className="space-y-2">
                          <Link href="/home" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                              <Home className="h-4 w-4 mr-3" />
                              Home
                            </Button>
                          </Link>

                          <Link href="/jogos" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                              <Gamepad2 className="h-4 w-4 mr-3" />
                              Jogos
                            </Button>
                          </Link>

                          <Link href="/deposito" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                              <CreditCard className="h-4 w-4 mr-3" />
                              Depositar
                            </Button>
                          </Link>

                          <Link href="/saque" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                              <TrendingUp className="h-4 w-4 mr-3" />
                              Sacar
                            </Button>
                          </Link>

                          <Button variant="secondary" className="w-full justify-start text-white">
                            <Trophy className="h-4 w-4 mr-3" />
                            Vencedores
                          </Button>
                        </div>
                      </nav>

                      {/* User Profile Section */}
                      {isLoggedIn && userProfile && (
                        <div className="p-4 border-t border-slate-700">
                          <div className="space-y-3">
                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">
                                  {userProfile?.user?.name || "Usuário"}
                                </p>
                              </div>
                            </div>

                            {/* Balance */}
                            <div className="bg-slate-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Saldo</span>
                                <div className="flex items-center space-x-1">
                                  <Wallet className="h-4 w-4 text-green-400" />
                                  <span className="text-green-400 font-bold">
                                    R$ {formatCurrency(getCurrentBalance())}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Logout Button */}
                            <Button
                              onClick={async () => {
                                try {
                                  const response = await AuthClient.makeAuthenticatedRequest("/api/auth/logout", {
                                    method: "POST",
                                  })
                                  if (response.ok) {
                                    AuthClient.removeToken()
                                    window.location.href = "/auth"
                                  }
                                } catch (error) {
                                  console.error("Erro no logout:", error)
                                  AuthClient.removeToken()
                                  window.location.href = "/auth"
                                }
                                setSidebarOpen(false)
                              }}
                              variant="outline"
                              className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Sair
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <h1 className="text-2xl font-bold text-white">Vencedores</h1>
                </div>
              </div>
              {isLoggedIn && userProfile && (
                <Link href="/deposito" className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                  <CreditCard className="h-4 w-4 text-green-400" />
                  <span className="text-white font-semibold text-sm md:text-base">
                    R$ {formatCurrency(getCurrentBalance())}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full mb-8 animate-pulse shadow-2xl">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-6">
              HALL DA FAMA
            </h1>
            <p className="text-2xl text-gray-300 mb-2">Conheça nossos grandes vencedores!</p>
            <p className="text-lg text-gray-400">Prêmios em dinheiro e produtos físicos pagos em tempo real</p>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 shadow-2xl hover:shadow-yellow-400/20 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                    R$ {formatCurrency(winners.reduce((sum, w) => sum + w.prize_amount, 0))}
                  </div>
                  <p className="text-gray-300 text-sm font-medium">Total em Prêmios</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 shadow-2xl hover:shadow-orange-400/20 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                    {winners.length}
                  </div>
                  <p className="text-gray-300 text-sm font-medium">Vencedores</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30 shadow-2xl hover:shadow-red-400/20 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-2">
                    {winners.filter((w) => w.is_physical_prize).length}
                  </div>
                  <p className="text-gray-300 text-sm font-medium">Prêmios Físicos</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lista de Vencedores */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Carregando vencedores...</p>
            </div>
          ) : winners.length === 0 ? (
            <Card className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-300 mb-2">Nenhum vencedor ainda</h3>
                <p className="text-gray-400 mb-6">Seja o primeiro a ganhar um grande prêmio!</p>
                <Link href="/jogos">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    <Gamepad2 className="h-5 w-5 mr-2" />
                    Jogar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner, index) => (
                <Card
                  key={winner.id}
                  className={`group bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border shadow-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden ${
                    winner.is_jackpot || winner.is_special_physical
                      ? "border-yellow-400/50 ring-2 ring-yellow-400/30 animate-pulse"
                      : winner.is_physical_prize
                        ? "border-purple-400/50 ring-2 ring-purple-400/30"
                        : "border-white/20 hover:border-yellow-400/30"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getCardBackground(winner)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>

                  <CardHeader className="relative text-center pb-4">
                    {/* Posição */}
                    {index < 3 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge
                          className={`${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg"
                              : index === 1
                                ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black shadow-lg"
                                : "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg"
                          } font-bold text-xs px-3 py-1`}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mx-auto mb-4">
                      <Avatar className="h-16 w-16 border-4 border-white/20 group-hover:border-yellow-400/50 transition-colors duration-300 shadow-lg">
                        <AvatarFallback
                          className={`bg-gradient-to-r ${getPrizeColor(winner)} text-white text-lg font-bold`}
                        >
                          {getInitials(winner.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1">
                        {getPrizeIcon(winner)}
                      </div>
                    </div>

                    <CardTitle className="text-lg text-white group-hover:text-yellow-400 transition-colors duration-300 font-bold">
                      {winner.user_name || "Jogador"}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative text-center space-y-4">
                    {/* Prêmio */}
                    {winner.is_physical_prize ? (
                      <div className="space-y-2">
                        <div
                          className={`text-xl font-black bg-gradient-to-r ${getPrizeColor(winner)} bg-clip-text text-transparent leading-tight`}
                        >
                          {winner.prize_name}
                        </div>
                        <div className="text-lg text-gray-300">(R$ {formatCurrency(winner.prize_amount)})</div>
                      </div>
                    ) : (
                      <div
                        className={`text-3xl font-black bg-gradient-to-r ${getPrizeColor(winner)} bg-clip-text text-transparent`}
                      >
                        R$ {formatCurrency(winner.prize_amount)}
                      </div>
                    )}

                    {/* Jogo */}
                    <div className="flex items-center justify-center space-x-2">
                      <Gamepad2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm font-medium">{winner.game_name || "Jogo"}</span>
                    </div>

                    {/* Data */}
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400 text-xs">{getTimeAgo(winner.created_at)}</span>
                    </div>

                    {/* Cidade (se disponível) */}
                    {winner.city && (
                      <div className="flex items-center justify-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400 text-xs">{winner.city}</span>
                      </div>
                    )}

                    {/* Badge de destaque para grandes prêmios */}
                    {winner.is_special_physical && (
                      <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bold text-xs animate-pulse shadow-lg">
                        🎁 PRÊMIO FÍSICO ESPECIAL!
                      </Badge>
                    )}
                    {winner.is_jackpot && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xs animate-pulse shadow-lg">
                        🏆 JACKPOT!
                      </Badge>
                    )}
                    {winner.is_physical_prize && !winner.is_special_physical && (
                      <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bold text-xs shadow-lg">
                        🎁 PRÊMIO FÍSICO!
                      </Badge>
                    )}
                    {winner.prize_amount >= 1000 && !winner.is_jackpot && !winner.is_physical_prize && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xs shadow-lg">
                        🏆 GRANDE PRÊMIO!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 border-none shadow-2xl overflow-hidden mt-12">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:60px_60px] animate-pulse"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-white animate-bounce" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">VOCÊ PODE SER O PRÓXIMO!</h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Jogue agora e concorra a prêmios incríveis de até R$ 35.000 em dinheiro ou produtos físicos como
                  iPhone, iPad, MacBook, Apple Watch, AirPods e até motos! Ganhe em tempo real e retire seus prêmios
                  instantaneamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/jogos">
                    <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <Gamepad2 className="h-6 w-6 mr-2" />
                      JOGAR AGORA
                    </Button>
                  </Link>
                  <Link href="/deposito">
                    <Button
                      variant="outline"
                      className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold text-lg px-8 py-4 bg-transparent shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <DollarSign className="h-6 w-6 mr-2" />
                      FAZER DEPÓSITO
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
