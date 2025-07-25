"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Trophy,
  TrendingUp,
  CreditCard,
  Play,
  ArrowRight,
  Gamepad2,
  Wallet,
  Menu,
  Home,
  User,
  LogOut,
  Star,
  Sparkles,
  Crown,
} from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { FloatingBalanceOptimized } from "@/components/floating-balance-optimized"
import { useDebounce } from "@/lib/debounce"
import Autoplay from "embla-carousel-autoplay"

interface UserProfile {
  user: {
    id: number
    name: string
    username: string
    email: string
    balance: number
  }
  wallet: {
    balance: number
  }
}

interface Winner {
  id: number
  user_name: string
  game_name: string
  prize_amount: number
  created_at: string
}

interface AdminStats {
  users: {
    total: number
  }
}

interface HomePageData {
  userProfile: UserProfile | null
  winners: Winner[]
  adminStats: AdminStats | null
}

export default function HomePageOptimized() {
  const router = useRouter()
  const pathname = usePathname()
  const [homeData, setHomeData] = useState<HomePageData>({
    userProfile: null,
    winners: [],
    adminStats: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Função debounced para buscar todos os dados da home
  const debouncedFetchHomeData = useDebounce(async () => {
    try {
      const token = AuthClient.getToken()
      const loggedIn = token && AuthClient.isLoggedIn()
      setIsLoggedIn(loggedIn)

      // Buscar dados em paralelo
      const promises = [
        fetch("/api/vencedores-optimized").then((res) => (res.ok ? res.json() : { winners: [] })),
        fetch("/api/admin/config/stats").then((res) => (res.ok ? res.json() : null)),
      ]

      // Se logado, buscar perfil também
      if (loggedIn) {
        promises.push(
          AuthClient.makeAuthenticatedRequest("/api/user/profile-complete").then((res) => (res.ok ? res.json() : null)),
        )
      }

      const results = await Promise.all(promises)

      setHomeData({
        winners: results[0]?.winners?.slice(0, 5) || [],
        adminStats: results[1],
        userProfile: loggedIn ? results[2] : null,
      })
    } catch (error) {
      console.error("Erro ao buscar dados da home:", error)
    } finally {
      setIsLoading(false)
    }
  }, 300)

  useEffect(() => {
    debouncedFetchHomeData()
  }, [debouncedFetchHomeData])

  // Helper function to safely convert to number and format
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Get the current balance from either user.balance or wallet.balance
  const getCurrentBalance = (): number => {
    if (homeData.userProfile?.wallet?.balance !== undefined) {
      return homeData.userProfile.wallet.balance
    }
    if (homeData.userProfile?.user?.balance !== undefined) {
      return homeData.userProfile.user.balance
    }
    return 0
  }

  const games = [
    {
      id: "raspe-da-esperanca",
      name: "Raspe da Esperança",
      description: "Prêmios de até R$ 1.000",
      minBet: 1,
      image: "/images/game-raspe-esperanca.png",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      id: "fortuna-dourada",
      name: "Fortuna Dourada",
      description: "Prêmios de até R$ 5.000",
      minBet: 3,
      image: "/images/game-fortuna-dourada.png",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      id: "mega-sorte",
      name: "Mega Sorte",
      description: "Prêmios de até R$ 10.000",
      minBet: 5,
      image: "/images/game-mega-sorte.png",
      gradient: "from-purple-500 to-pink-500",
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando...</p>
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
              <div className="flex items-center space-x-3">
                {/* Menu Button */}
                <Sheet open={showSideMenu} onOpenChange={setShowSideMenu}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800">
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
                          <Link href="/" onClick={() => setShowSideMenu(false)}>
                            <Button
                              variant={pathname === "/" ? "secondary" : "ghost"}
                              className="w-full justify-start text-white hover:bg-slate-800"
                            >
                              <Home className="h-4 w-4 mr-3" />
                              Home
                            </Button>
                          </Link>

                          <Link href="/jogos" onClick={() => setShowSideMenu(false)}>
                            <Button
                              variant={pathname === "/jogos" || pathname.startsWith("/jogo/") ? "secondary" : "ghost"}
                              className="w-full justify-start text-white hover:bg-slate-800"
                            >
                              <Gamepad2 className="h-4 w-4 mr-3" />
                              Jogos
                            </Button>
                          </Link>

                          {isLoggedIn && (
                            <>
                              <Link href="/deposito" onClick={() => setShowSideMenu(false)}>
                                <Button
                                  variant={pathname === "/deposito" ? "secondary" : "ghost"}
                                  className="w-full justify-start text-white hover:bg-slate-800"
                                >
                                  <CreditCard className="h-4 w-4 mr-3" />
                                  Depositar
                                </Button>
                              </Link>

                              <Link href="/saque" onClick={() => setShowSideMenu(false)}>
                                <Button
                                  variant={pathname === "/saque" ? "secondary" : "ghost"}
                                  className="w-full justify-start text-white hover:bg-slate-800"
                                >
                                  <TrendingUp className="h-4 w-4 mr-3" />
                                  Sacar
                                </Button>
                              </Link>
                            </>
                          )}

                          <Link href="/vencedores" onClick={() => setShowSideMenu(false)}>
                            <Button
                              variant={pathname === "/vencedores" ? "secondary" : "ghost"}
                              className="w-full justify-start text-white hover:bg-slate-800"
                            >
                              <Trophy className="h-4 w-4 mr-3" />
                              Vencedores
                            </Button>
                          </Link>
                        </div>
                      </nav>

                      {/* User Profile Section or Login */}
                      <div className="p-4 border-t border-slate-700">
                        {isLoggedIn ? (
                          <div className="space-y-3">
                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">
                                  {homeData.userProfile?.user?.name || "Usuário"}
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
                                    setIsLoggedIn(false)
                                    setHomeData((prev) => ({ ...prev, userProfile: null }))
                                  }
                                } catch (error) {
                                  console.error("Erro no logout:", error)
                                  AuthClient.removeToken()
                                  setIsLoggedIn(false)
                                  setHomeData((prev) => ({ ...prev, userProfile: null }))
                                }
                                setShowSideMenu(false)
                              }}
                              variant="outline"
                              className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Sair
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Link href="/auth" onClick={() => setShowSideMenu(false)}>
                              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                                Entrar / Cadastrar
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">RasPay</h1>
                  <p className="text-sm text-gray-400">
                    {isLoggedIn ? `Olá, ${homeData.userProfile?.user?.name || "Usuário"}!` : "Raspadinha Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isLoggedIn ? (
                  <Link href="/deposito">
                    <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                      <Wallet className="h-4 w-4 text-green-400" />
                      <span className="text-white font-semibold text-sm md:text-base">
                        R$ {formatCurrency(getCurrentBalance())}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Banner Section */}
        <div className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Star className="absolute top-10 left-10 h-4 w-4 text-cyan-400/30 animate-pulse" />
            <Sparkles className="absolute top-20 right-20 h-5 w-5 text-blue-400/40 animate-pulse delay-1000" />
            <Crown className="absolute bottom-20 left-20 h-6 w-6 text-yellow-400/30 animate-pulse delay-2000" />
            <Trophy className="absolute bottom-32 right-16 h-4 w-4 text-purple-400/30 animate-pulse delay-500" />
            <Zap className="absolute top-32 left-1/4 h-5 w-5 text-cyan-400/25 animate-pulse delay-700" />
            <Star className="absolute bottom-40 right-1/3 h-3 w-3 text-yellow-400/35 animate-pulse delay-1500" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="relative rounded-lg mx-4 my-6 overflow-hidden">
              {/* Welcome Text */}
              <div className="text-center py-8 px-4 relative">
                {/* Badge */}
                <div className="flex justify-center mb-6">
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 px-4 py-2 text-sm font-semibold">
                    <Crown className="h-4 w-4 mr-2" />
                    Plataforma #1 do Brasil
                  </Badge>
                </div>

                {/* Main Title */}
                <div className="relative mb-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 animate-pulse">
                    Bem-vindo à RasPay
                  </h2>

                  {/* Decorative elements around title */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-cyan-400/50"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-blue-400/50"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-purple-400/50"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-cyan-400/50"></div>
                </div>

                {/* Subtitle */}
                <div className="relative">
                  <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
                    A melhor plataforma de jogos de{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-bold">
                      raspadinha online
                    </span>{" "}
                    do Brasil.
                  </p>

                  {/* Sparkle effects */}
                  <Sparkles className="absolute -top-1 left-1/4 h-4 w-4 text-yellow-400/60 animate-ping" />
                  <Star className="absolute top-2 right-1/4 h-3 w-3 text-cyan-400/60 animate-ping delay-500" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                      R$ 50K+
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">Prêmios Pagos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      {homeData.adminStats?.users?.total || 0}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">Jogadores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      24/7
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">Suporte</div>
                  </div>
                </div>
              </div>

              {/* Banner Carousel */}
              <div className="relative w-full aspect-video mt-4">
                <Carousel
                  className="w-full h-full"
                  opts={{ loop: true }}
                  plugins={[
                    Autoplay({
                      delay: 3000,
                    }),
                  ]}
                >
                  <CarouselContent>
                    <CarouselItem>
                      <img
                        src="/images/raspay-banner-mascot.png"
                        alt="Ache 3 iguais e ganhe na hora - RasPay"
                        className="w-full h-full object-cover object-center rounded-lg shadow-2xl"
                        style={{ imageRendering: "high-quality" }}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <img
                        src="/images/raspay-banner-1.png"
                        alt="Aqui R$1 pode virar R$1.000 em uma raspadinha!"
                        className="w-full h-full object-cover object-center rounded-lg shadow-2xl"
                        style={{ imageRendering: "high-quality" }}
                      />
                    </CarouselItem>
                    <CarouselItem>
                      <img
                        src="/images/raspay-banner-2.png"
                        alt="Chega de tirar grana da galera, eu vim para distribuir prêmios e dinheiro."
                        className="w-full h-full object-cover object-center rounded-lg shadow-2xl"
                        style={{ imageRendering: "high-quality" }}
                      />
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Featured Games */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Jogos em Destaque</h3>
              <Link href="/jogos">
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all group overflow-hidden"
                >
                  <CardHeader className="p-0">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-6 pb-4">
                      <CardTitle className="text-white mb-2">{game.name}</CardTitle>
                      <CardDescription className="text-gray-400">{game.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {`A partir de R$ ${game.minBet}`}
                      </Badge>
                    </div>
                    {isLoggedIn ? (
                      <Link href={`/jogo/${game.id}`}>
                        <Button className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white`}>
                          <Play className="h-4 w-4 mr-2" />
                          Jogar
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth">
                        <Button className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white`}>
                          <Play className="h-4 w-4 mr-2" />
                          Entrar para Jogar
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Winners */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Vencedores Recentes</h3>
              <Link href="/vencedores">
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-6">
                {homeData.winners.length > 0 ? (
                  <div className="space-y-4">
                    {homeData.winners.map((winner) => (
                      <div
                        key={winner.id}
                        className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">{winner.user_name}</p>
                            <p className="text-gray-400 text-sm">{winner.game_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">R$ {formatCurrency(winner.prize_amount)}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(winner.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum vencedor recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Pronto para começar?</h3>
              <p className="text-gray-300 mb-6">
                {isLoggedIn
                  ? "Faça seu primeiro depósito e ganhe bônus de boas-vindas!"
                  : "Cadastre-se agora e comece a jogar!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoggedIn ? (
                  <>
                    <Link href="/deposito">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        Fazer Depósito
                      </Button>
                    </Link>
                    <Link href="/jogos">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                      >
                        <Gamepad2 className="h-5 w-5 mr-2" />
                        Explorar Jogos
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8"
                      >
                        <User className="h-5 w-5 mr-2" />
                        Cadastrar Agora
                      </Button>
                    </Link>
                    <Link href="/jogos">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
                      >
                        <Gamepad2 className="h-5 w-5 mr-2" />
                        Ver Jogos
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <FloatingBalanceOptimized userProfile={homeData.userProfile} />
      <MobileBottomNav />
      <Footer />
    </div>
  )
}
