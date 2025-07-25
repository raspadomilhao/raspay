"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Star,
  Gift,
  Trophy,
  TrendingUp,
  CreditCard,
  Play,
  Gamepad2,
  Wallet,
  Menu,
  Home,
  User,
  LogOut,
} from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import RaspeDaEsperancaPage from "@/app/jogo/raspe-da-esperanca/page"
import FortunaDouradaPage from "@/app/jogo/fortuna-dourada/page"
import MegaSortePage from "@/app/jogo/mega-sorte/page"
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

export default function JogosPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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

  const games = [
    {
      id: "raspe-da-esperanca",
      name: "Raspe da Esperança",
      description: "O clássico jogo de raspadinha com prêmios de até R$ 1.000!",
      minBet: 1,
      maxPrize: 1000,
      icon: Zap,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/20 to-blue-500/20",
      image: "/images/game-raspe-esperanca.png",
    },
    {
      id: "fortuna-dourada",
      name: "Fortuna Dourada",
      description: "Busque o ouro e encontre tesouros escondidos com prêmios de até R$ 5.000!",
      minBet: 3,
      maxPrize: 5000,
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-500/20 to-orange-500/20",
      image: "/images/game-fortuna-dourada.png",
    },
    {
      id: "mega-sorte",
      name: "Mega Sorte",
      description: "O jogo com os maiores prêmios! Ganhe até R$ 10.000 em uma única jogada!",
      minBet: 5,
      maxPrize: 10000,
      icon: Gift,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      image: "/images/game-mega-sorte.png",
    },
  ]

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
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Nossos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Jogos</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Escolha entre nossos jogos de raspadinha e tenha a chance de ganhar prêmios incríveis!
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        A partir de R$ {game.minBet}
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                        Até R$ {game.maxPrize.toLocaleString()}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedGame(game.id)
                        setIsGameModalOpen(true)
                      }}
                      className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Jogar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardContent className="p-8 text-center">
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
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
