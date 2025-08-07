"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Star, Gift, Trophy, TrendingUp, CreditCard, Play, Gamepad2, Wallet, Menu, Home, User, LogOut, Sparkles, Crown, Diamond } from 'lucide-react'
import { AuthClient } from "@/lib/auth-client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import RaspeDaEsperancaPage from "@/app/jogo/raspe-da-esperanca/page"
import FortunaDouradaPage from "@/app/jogo/fortuna-dourada/page"
import MegaSortePage from "@/app/jogo/mega-sorte/page"
import SuperPremiosPage from "@/app/jogo/super-premios/page"
import SonhoDeConsumoPage from "@/app/jogo/sonho-de-consumo/page"
import OutfitPage from "@/app/jogo/outfit/page"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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

interface Game {
  id: string
  name: string
  description: string
  minBet: number
  maxPrize: number
  image: string
  gradient: string
  bgGradient: string
  icon: string
}

// Mapeamento de ícones
const iconMap: { [key: string]: any } = {
  Zap,
  Star,
  Gift,
  Trophy,
  Sparkles,
  Crown,
  Diamond,
  Gamepad2
}

export default function JogosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [isGameModalOpen, setIsGameModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  useEffect(() => {
    const token = AuthClient.getToken()
    if (!token || !AuthClient.isLoggedIn()) {
      router.push("/auth")
      return
    }

    fetchUserProfile()
    fetchGames()
  }, [router])

  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile for jogos page...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")

      if (response.ok) {
        const data = await response.json()
        console.log("Jogos page profile data:", data)
        setUserProfile(data)
      } else {
        console.error("Failed to fetch profile:", response.status)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games/list")
      if (response.ok) {
        const data = await response.json()
        // Transformar os dados do banco para o formato esperado
        const formattedGames = data.games.map((game: any) => ({
          id: game.game_id,
          name: game.name,
          description: game.description,
          minBet: parseFloat(game.min_bet) || 0,
          maxPrize: parseFloat(game.max_prize) || 0,
          image: game.image_url,
          gradient: `from-${game.gradient_from} to-${game.gradient_to}`,
          bgGradient: `from-${game.gradient_from}/20 to-${game.gradient_to}/20`,
          icon: game.icon
        }))
        setGames(formattedGames)
      }
    } catch (error) {
      console.error("Erro ao buscar jogos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to safely convert to number and format
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Get the current balance from either user.balance or wallet.balance
  const getCurrentBalance = (): number => {
    if (userProfile?.wallet?.balance !== undefined) {
      return userProfile.wallet.balance
    }
    if (userProfile?.user?.balance !== undefined) {
      return userProfile.user.balance
    }
    return 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando jogos...</p>
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

                      {/* User Profile Section */}
                      <div className="p-4 border-t border-slate-700">
                        <div className="space-y-3">
                          {/* User Info */}
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm">{userProfile?.user?.name || "Usuário"}</p>
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
                                  router.push("/auth")
                                }
                              } catch (error) {
                                console.error("Erro no logout:", error)
                                AuthClient.removeToken()
                                router.push("/auth")
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
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Jogos</h1>
                  <p className="text-sm text-gray-400">Escolha seu jogo favorito</p>
                </div>
              </div>
              <Link href="/deposito">
                <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <span className="text-white font-semibold text-sm md:text-base">
                    R$ {formatCurrency(getCurrentBalance())}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-2 py-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Nossos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Jogos</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Escolha entre nossos jogos de raspadinha e tenha a chance de ganhar prêmios incríveis!
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((game) => {
              const IconComponent = iconMap[game.icon] || Zap
              return (
                <Card
                  key={game.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all group overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="relative bg-slate-800 overflow-hidden rounded-t-lg">
                      {/* Background Image */}
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Text Overlay - Only R$ value in top right corner */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-green-500/80 text-white text-sm backdrop-blur-sm">
                          R$ {game.minBet.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    {/* Game Description */}
                    <div className="p-3 pt-2">
                      <h3 className="text-white font-bold text-center mb-2">{game.name}</h3>
                      <p className="text-sm text-gray-300 text-center">{game.description}</p>
                    </div>
                    {/* Button Section */}
                    <div className="p-3 pt-0">
                      <Button
                        onClick={() => {
                          setSelectedGame(game.id)
                          setIsGameModalOpen(true)
                        }}
                        className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white text-sm py-2`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Jogar Agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Info Section */}
          <div className="mt-12 px-2">
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Como Jogar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <h4 className="text-white font-semibold">Escolha seu jogo</h4>
                    <p className="text-gray-300 text-sm">Selecione um dos nossos jogos de raspadinha disponíveis</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <h4 className="text-white font-semibold">Faça sua aposta</h4>
                    <p className="text-gray-300 text-sm">Escolha o valor da sua aposta e confirme</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <h4 className="text-white font-semibold">Raspe e ganhe</h4>
                    <p className="text-gray-300 text-sm">Raspe a cartela e descubra se você ganhou!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Game Modals */}
      <Dialog open={isGameModalOpen} onOpenChange={setIsGameModalOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black border-gray-800">
          <div className="w-full h-full overflow-auto">
            {selectedGame === "raspe-da-esperanca" && <RaspeDaEsperancaPage />}
            {selectedGame === "fortuna-dourada" && <FortunaDouradaPage />}
            {selectedGame === "mega-sorte" && <MegaSortePage />}
            {selectedGame === "super-premios" && <SuperPremiosPage />}
            {selectedGame === "sonho-de-consumo" && <SonhoDeConsumoPage />}
            {selectedGame === "outfit" && <OutfitPage />}
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
