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
  Play,
  ArrowRight,
  Wallet,
  Menu,
  LogOut,
  Sparkles,
  X,
  Home,
  Gamepad2,
  CreditCard,
  TrendingUp,
  User,
} from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import RaspeDaEsperancaPage from "@/app/jogo/raspe-da-esperanca/page"
import FortunaDouradaPage from "@/app/jogo/fortuna-dourada/page"
import MegaSortePage from "@/app/jogo/mega-sorte/page"

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

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false)
  const [isGameModalOpen, setIsGameModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  useEffect(() => {
    const token = AuthClient.getToken()
    const loggedIn = token && AuthClient.isLoggedIn()
    setIsLoggedIn(loggedIn)

    if (loggedIn) {
      fetchUserProfile()
    }

    fetchRecentWinners()
    setIsLoading(false)
  }, [router])

  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) setUserProfile(await response.json())
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  const fetchRecentWinners = async () => {
    try {
      const response = await fetch("/api/vencedores")
      if (response.ok) {
        const data = await response.json()
        setWinners(data.winners?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error("Erro ao buscar vencedores:", error)
    }
  }

  const formatCurrency = (value: number | string | null | undefined): string => {
    const numValue = Number(value)
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  const getCurrentBalance = (): number => userProfile?.wallet?.balance ?? userProfile?.user?.balance ?? 0

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

  const bannerImages = [
    "/images/carousel-banner-1.png",
    "/images/carousel-banner-2.png",
    "/images/carousel-banner-3.png",
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 pb-20 md:pb-0">
        <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sheet open={showSideMenu} onOpenChange={setShowSideMenu}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-card border-border w-64">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-bold">RasPay</span>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <nav className="flex-1 p-4">
                        <div className="space-y-2">
                          <Link href="/" onClick={() => setShowSideMenu(false)}>
                            <Button
                              variant={pathname === "/" ? "secondary" : "ghost"}
                              className="w-full justify-start text-foreground hover:bg-accent"
                            >
                              <Home className="h-4 w-4 mr-3" />
                              Home
                            </Button>
                          </Link>

                          <Link href="/jogos" onClick={() => setShowSideMenu(false)}>
                            <Button
                              variant={pathname === "/jogos" || pathname.startsWith("/jogo/") ? "secondary" : "ghost"}
                              className="w-full justify-start text-foreground hover:bg-accent"
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
                                  className="w-full justify-start text-foreground hover:bg-accent"
                                >
                                  <CreditCard className="h-4 w-4 mr-3" />
                                  Depositar
                                </Button>
                              </Link>

                              <Link href="/saque" onClick={() => setShowSideMenu(false)}>
                                <Button
                                  variant={pathname === "/saque" ? "secondary" : "ghost"}
                                  className="w-full justify-start text-foreground hover:bg-accent"
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
                              className="w-full justify-start text-foreground hover:bg-accent"
                            >
                              <Trophy className="h-4 w-4 mr-3" />
                              Vencedores
                            </Button>
                          </Link>
                        </div>
                      </nav>

                      {/* User Profile Section or Login */}
                      <div className="p-4 border-t border-border">
                        {isLoggedIn ? (
                          <div className="space-y-3">
                            {/* User Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-foreground font-semibold text-sm">
                                  {userProfile?.user?.name || "Usuário"}
                                </p>
                              </div>
                            </div>

                            {/* Balance */}
                            <div className="bg-accent rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Saldo</span>
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
                                    setUserProfile(null)
                                  }
                                } catch (error) {
                                  console.error("Erro no logout:", error)
                                  AuthClient.removeToken()
                                  setIsLoggedIn(false)
                                  setUserProfile(null)
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
                              <Button className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/80 hover:to-blue-500/80 text-white">
                                Entrar / Cadastrar
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-foreground">RasPay</span>
                </Link>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/jogos"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Jogos
                </Link>
                <Link
                  href="/vencedores"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Vencedores
                </Link>
                <Link
                  href="/deposito"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Depósito
                </Link>
              </nav>
              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/deposito"
                      className="flex items-center space-x-2 bg-accent rounded-full px-4 py-2 hover:bg-secondary transition-colors"
                    >
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-foreground font-semibold text-sm">
                        R$ {formatCurrency(getCurrentBalance())}
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={async () => {
                        try {
                          const response = await AuthClient.makeAuthenticatedRequest("/api/auth/logout", {
                            method: "POST",
                          })
                          if (response.ok) {
                            AuthClient.removeToken()
                            setIsLoggedIn(false)
                            setUserProfile(null)
                          }
                        } catch (error) {
                          console.error("Erro no logout:", error)
                          AuthClient.removeToken()
                          setIsLoggedIn(false)
                          setUserProfile(null)
                        }
                      }}
                    >
                      <LogOut className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <Link href="/auth">
                    <Button className="gradient-primary text-white font-semibold">
                      Entrar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="relative w-full border-b border-border overflow-hidden">
          <div className="max-w-screen-2xl mx-auto">
            <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 4000 })]}>
              <CarouselContent>
                {bannerImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-[16/7] w-full">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </Carousel>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Jogos em Destaque</h2>
              <Link href="/jogos">
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {games.map((game) => (
                <Card
                  key={game.id}
                  className="bg-card border-border hover:border-primary/50 transition-all group overflow-hidden shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300"
                >
                  <CardHeader className="p-0">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CardTitle className="text-foreground mb-2">{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                    <div className="flex items-center justify-between mt-4">
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-400 border-green-500/20"
                      >{`Aposta Mín. R$ ${game.minBet}`}</Badge>
                      <Button
                        onClick={() => {
                          setSelectedGame(game.id)
                          setIsGameModalOpen(true)
                        }}
                        className="gradient-primary text-white font-semibold group-hover:animate-glow"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Jogar Agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Vencedores Recentes</h2>
              <Link href="/vencedores">
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="space-y-2">
                  {winners.map((winner) => (
                    <div
                      key={winner.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-foreground font-semibold">{winner.user_name}</p>
                          <p className="text-muted-foreground text-sm">{winner.game_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-lg">R$ {formatCurrency(winner.prize_amount)}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(winner.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
              <CardContent className="p-10 text-center">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-3">Pronto para a Sorte Grande?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {isLoggedIn
                    ? "Seu próximo prêmio está a uma raspadinha de distância. Faça um depósito e continue a diversão!"
                    : "Cadastre-se em segundos e comece a ganhar. A sorte favorece os audazes!"}
                </p>
                <Link href={isLoggedIn ? "/deposito" : "/auth"}>
                  <Button size="lg" className="gradient-primary text-white font-bold px-10 py-6 text-base animate-glow">
                    {isLoggedIn ? "Depositar Agora" : "Criar Conta Grátis"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      <button
        onClick={() => setIsFaqDialogOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-0 bg-transparent border-none cursor-pointer focus:outline-none hover:scale-110 transition-transform"
      >
        <img src="/images/raspay-mascot-small.png" alt="RasPay Mascot" className="w-24 h-auto md:w-32" />
      </button>

      <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="max-w-md mx-auto bg-card border-border text-foreground p-6">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Perguntas Frequentes (FAQ)</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsFaqDialogOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground">Como faço um depósito?</h4>
              <p className="text-sm">
                Você pode fazer um depósito clicando no botão "Depositar" na página inicial e seguindo as instruções.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Como posso sacar meus ganhos?</h4>
              <p className="text-sm">Para sacar, vá para a seção "Sacar" e siga os passos para solicitar seu saque.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Os jogos são justos?</h4>
              <p className="text-sm">
                Sim, todos os nossos jogos são projetados para serem justos e transparentes, garantindo uma experiência
                de jogo equitativa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Como entro em contato com o suporte?</h4>
              <p className="text-sm">
                Você pode entrar em contato com o suporte através do nosso chat ao vivo ou enviando um e-mail para
                suporte@raspay.com.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
