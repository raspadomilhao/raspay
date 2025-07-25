"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Wallet,
  DollarSign,
  Zap,
  Shield,
  Info,
  LogOut,
  Home,
  Gamepad2,
  Trophy,
  Crown,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Clock,
  Menu,
  User,
  Gift,
  Star,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"
import { QRCodeModalOptimized } from "@/components/qr-code-modal-optimized"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { useDebounce } from "@/lib/debounce"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface UserProfile {
  user: {
    id: number
    email: string
    name: string
    user_type?: string
  }
  wallet: {
    balance: string | number
  }
}

interface PaymentOrder {
  copy_past: string
  external_id: number
  payer_name: string
  payment: string
  status: number
}

interface SystemSettings {
  min_deposit_amount?: string
}

interface DepositProgress {
  total_deposited: number
  bonus_50_claimed: boolean
  bonus_100_claimed: boolean
}

// Função utilitária para formatar valores monetários
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return "0.00"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
}

export default function DepositoPageOptimized() {
  // Estados de autenticação
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showLogin, setShowLogin] = useState(true)

  // Estados de login/registro
  const [login, setLogin] = useState("") // Para email ou username
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")

  // Estados da API HorsePay
  const [accessToken, setAccessToken] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  // Estados do formulário de depósito
  const [amount, setAmount] = useState("")
  const [payerName, setPayerName] = useState("")

  // Estados do modal
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const [authError, setAuthError] = useState<string>("")
  const [isBlogger, setIsBlogger] = useState(false)

  // Estados das configurações do sistema
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({})
  const [minDepositAmount, setMinDepositAmount] = useState(20)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estados do progresso de depósitos
  const [depositProgress, setDepositProgress] = useState<DepositProgress>({
    total_deposited: 0,
    bonus_50_claimed: false,
    bonus_100_claimed: false,
  })

  // Função debounced para buscar configurações do sistema
  const debouncedFetchSettings = useDebounce(async () => {
    try {
      const response = await fetch("/api/settings-optimized")
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data.settings)
        if (data.settings.min_deposit_amount) {
          setMinDepositAmount(Number.parseFloat(data.settings.min_deposit_amount))
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }, 300)

  // Função debounced para buscar progresso de depósitos
  const debouncedFetchProgress = useDebounce(async () => {
    try {
      console.log("🔄 Buscando progresso de depósitos...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/deposits-optimized")
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Dados recebidos:", data)

        setDepositProgress({
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })

        console.log("✅ Progresso atualizado:", {
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })
      } else {
        console.error("❌ Erro na resposta:", response.status)
      }
    } catch (error) {
      console.error("❌ Erro ao buscar progresso de depósitos:", error)
    }
  }, 500)

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    debouncedFetchSettings()
    const token = AuthClient.getToken()
    if (token) {
      setIsLoggedIn(true)
      fetchUserProfile()
      debouncedFetchProgress()
    }
  }, [debouncedFetchSettings, debouncedFetchProgress])

  // Função de login
  const handleLogin = async () => {
    setLoading(true)
    setAuthError("")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.token) {
          AuthClient.setToken(data.token)
        }
        setIsLoggedIn(true)

        window.location.href = "/home"

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para a página inicial...",
        })
      } else {
        throw new Error(data.error || "Falha no login")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setAuthError(errorMessage)
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Função de registro
  const handleRegister = async () => {
    setLoading(true)
    setAuthError("")

    if (password !== confirmPassword) {
      setAuthError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setAuthError("Você deve aceitar os termos de uso")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          phone,
          email: login,
          password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Agora você pode fazer login.",
        })
        setShowLogin(true)
        setLogin("")
        setName("")
        setUsername("")
        setPhone("")
        setPassword("")
        setConfirmPassword("")
        setAcceptTerms(false)
      } else {
        throw new Error(data.error || "Falha no registro")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setAuthError(errorMessage)
      toast({
        title: "Erro no registro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Buscar perfil do usuário com debounce
  const debouncedFetchProfile = useDebounce(async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile-complete")

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)

        if (profile.user.name && !payerName) {
          setPayerName(profile.user.name)
        }

        if (profile.user.user_type === "blogger") {
          setIsBlogger(true)
        }
      } else if (response.status === 401) {
        handleLogout()
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      setAuthError("Erro ao carregar perfil do usuário")
    }
  }, 300)

  const fetchUserProfile = () => {
    debouncedFetchProfile()
  }

  // Autenticar com a API HorsePay
  const authenticateHorsePay = async (): Promise<string> => {
    try {
      console.log("🔐 Iniciando autenticação HorsePay...")

      const response = await fetch("/api/horsepay/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success && data.access_token) {
        console.log("✅ Autenticação HorsePay bem-sucedida")
        setAccessToken(data.access_token)
        setIsAuthenticated(true)
        return data.access_token
      } else {
        throw new Error("Falha na autenticação HorsePay: " + (data.error || "Token não recebido"))
      }
    } catch (error) {
      console.error("❌ Erro na autenticação HorsePay:", error)
      throw error
    }
  }

  // Gerar PIX
  const generatePix = async () => {
    const amountNum = Number.parseFloat(amount)

    if (amountNum < minDepositAmount) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para depósito é R$ ${minDepositAmount.toFixed(2)}.`,
        variant: "destructive",
      })
      return
    }

    if (!payerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("🚀 Iniciando geração de PIX...")

      // Sempre autenticar antes de gerar PIX para garantir token válido
      const currentToken = await authenticateHorsePay()

      console.log("💰 Gerando PIX com token válido...")

      const body = {
        payer_name: payerName,
        amount: amountNum,
        callback_url: "https://v0-raspay.vercel.app/api/webhook/horsepay",
      }

      console.log("📤 Enviando requisição para HorsePay:", body)

      const horsePayResponse = await fetch("https://api.horsepay.io/transaction/neworder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      console.log("📥 Resposta HorsePay status:", horsePayResponse.status)

      if (horsePayResponse.ok) {
        const data: PaymentOrder = await horsePayResponse.json()
        console.log("✅ PIX gerado com sucesso:", data.external_id)

        setPaymentOrder(data)

        // Salvar transação no banco
        await AuthClient.makeAuthenticatedRequest("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: "deposit",
            amount: amountNum,
            external_id: data.external_id,
            payer_name: payerName,
            callback_url: "https://v0-raspay.vercel.app/api/webhook/horsepay",
            qr_code: data.payment,
            copy_paste_code: data.copy_past,
          }),
        })

        setShowQRModal(true)

        // Se for blogger, simular pagamento após 7 segundos
        if (isBlogger) {
          console.log("🎭 Blogger detectado - simulação será executada em 7 segundos")
          setTimeout(async () => {
            try {
              const simulateResponse = await AuthClient.makeAuthenticatedRequest("/api/simulate-deposit", {
                method: "POST",
                body: JSON.stringify({
                  external_id: data.external_id,
                }),
              })

              if (simulateResponse.ok) {
                const simulateData = await simulateResponse.json()
                console.log("🎭 Depósito simulado:", simulateData)

                // Atualizar perfil e progresso
                await fetchUserProfile()
                await debouncedFetchProgress()
                setShowQRModal(false)
                setAmount("")
                setPaymentOrder(null)

                toast({
                  title: "Depósito realizado com sucesso!",
                  description: `R$ ${simulateData.amount.toFixed(2)} creditado na sua conta.`,
                })
              }
            } catch (error) {
              console.error("Erro na simulação:", error)
            }
          }, 7000) // 7 segundos
        }

        toast({
          title: "PIX gerado com sucesso!",
          description: `ID do pedido: ${data.external_id}`,
        })
      } else {
        const errorText = await horsePayResponse.text()
        console.error("❌ Erro HorsePay:", errorText)
        throw new Error(`Falha ao gerar PIX: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Erro ao gerar PIX:", error)
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentDetected = () => {
    console.log("💳 Pagamento detectado - atualizando dados...")
    fetchUserProfile()
    debouncedFetchProgress()
    setAmount("")
    setPaymentOrder(null)

    // Forçar atualização após um pequeno delay
    setTimeout(() => {
      console.log("🔄 Forçando segunda atualização...")
      debouncedFetchProgress()
    }, 2000)
  }

  // Função de logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Erro no logout:", error)
    }

    AuthClient.removeToken()
    setIsLoggedIn(false)
    setUserProfile(null)
    setIsAuthenticated(false)
    setAccessToken("")
    setAuthError("")
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile()
      debouncedFetchProgress()
    }
  }, [isLoggedIn, debouncedFetchProgress])

  // Calcular progresso
  const getProgressPercentage = (target: number) => {
    return Math.min((depositProgress.total_deposited / target) * 100, 100)
  }

  const getNextBonus = () => {
    if (!depositProgress.bonus_50_claimed && depositProgress.total_deposited < 50) {
      return { target: 50, bonus: 5, remaining: 50 - depositProgress.total_deposited }
    }
    if (!depositProgress.bonus_100_claimed && depositProgress.total_deposited < 100) {
      return { target: 100, bonus: 10, remaining: 100 - depositProgress.total_deposited }
    }
    return null
  }

  const nextBonus = getNextBonus()

  const getCurrentBalance = () => {
    return userProfile?.wallet.balance || 0
  }

  // Tela de login/registro
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <header className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/home" className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                  RasPay
                </span>
              </Link>

              <nav className="hidden md:flex items-center space-x-8">
                <Link
                  href="/home"
                  className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Início</span>
                </Link>
                <Link
                  href="/jogos"
                  className="flex items-center space-x-2 text-gray-300 hover:text-gray-100 transition-colors"
                >
                  <Gamepad2 className="h-4 w-4" />
                  <span>Jogos</span>
                </Link>
                <Link
                  href="/deposito"
                  className="flex items-center space-x-2 text-white hover:text-gray-100 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Depósitos</span>
                </Link>
              </nav>

              <Link href="/home">
                <Button
                  variant="ghost"
                  className="text-white hover:text-gray-100 hover:bg-gray-800 border border-gray-700"
                >
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex items-center justify-center p-4 pb-24 md:pb-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center mb-6 md:mb-6">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent mb-3 md:mb-4">
                Depósitos PIX
              </h1>
              <p className="text-gray-300">Deposite de forma rápida e segura</p>
            </div>

            <Card className="bg-gray-900/90 backdrop-blur-xl border border-gray-700">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                  {showLogin ? "Fazer Login" : "Criar Conta"}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {showLogin ? "Acesse sua conta para depositar" : "Crie sua conta gratuita"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showLogin ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-gray-200">
                        Email ou Usuário
                      </Label>
                      <Input
                        id="login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="seu@email.com ou usuario"
                        className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-200">
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Sua senha"
                          className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 pr-10 focus:border-gray-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-200">
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-200">
                        Usuário *
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Escolha um nome de usuário"
                        className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-200">
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-200">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-200">
                        Senha *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 pr-10 focus:border-gray-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-200">
                        Confirmar senha *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme sua senha"
                          className="h-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 pr-10 focus:border-gray-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? "🙈" : "👁️"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 mt-1 rounded border-gray-600 bg-gray-800 text-gray-500 focus:ring-gray-400"
                      />
                      <Label htmlFor="acceptTerms" className="text-sm text-gray-300 leading-relaxed">
                        Aceito os{" "}
                        <Link href="/termos" className="text-gray-100 hover:underline">
                          termos de uso
                        </Link>{" "}
                        e{" "}
                        <Link href="/privacidade" className="text-gray-100 hover:underline">
                          política de privacidade
                        </Link>
                      </Label>
                    </div>
                  </>
                )}

                {authError && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                    {authError}
                  </div>
                )}

                <Button
                  onClick={showLogin ? handleLogin : handleRegister}
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{showLogin ? "Entrando..." : "Criando conta..."}</span>
                    </div>
                  ) : showLogin ? (
                    "Entrar"
                  ) : (
                    "Criar conta"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowLogin(!showLogin)
                      setAuthError("")
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    {showLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <MobileBottomNav />
        <Footer />
      </div>
    )
  }

  // Tela principal de depósito (usuário logado)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1 pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Menu Button */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
                            <Button variant="secondary" className="w-full justify-start text-white hover:bg-slate-800">
                              <CreditCard className="h-4 w-4 mr-3" />
                              Depositar
                            </Button>
                          </Link>

                          <Link href="/saque" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                              <DollarSign className="h-4 w-4 mr-3" />
                              Sacar
                            </Button>
                          </Link>

                          <Link href="/vencedores" onClick={() => setSidebarOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
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
                            onClick={() => {
                              handleLogout()
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
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Depósitos</h1>
                  <p className="text-sm text-gray-400">PIX instantâneo</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                  <Wallet className="h-4 w-4 text-green-400" />
                  <span className="text-white font-semibold text-sm md:text-base">
                    R$ {formatCurrency(getCurrentBalance())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Depósito */}
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    <span>Fazer Depósito</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">Deposite via PIX de forma rápida e segura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">
                      Valor do Depósito
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min={minDepositAmount}
                        step="0.01"
                        className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <p className="text-sm text-gray-400">Valor mínimo: R$ {minDepositAmount.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payerName" className="text-white">
                      Nome do Pagador
                    </Label>
                    <Input
                      id="payerName"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-semibold text-sm">Segurança PIX</h4>
                        <p className="text-gray-400 text-sm">
                          Transação 100% segura e instantânea. Seus dados são protegidos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={generatePix}
                    disabled={loading || !amount || Number.parseFloat(amount) < minDepositAmount}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Gerando PIX...</span>
                      </div>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Gerar PIX
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Valores Sugeridos */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Valores Sugeridos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[20, 50, 100, 200].map((value) => (
                      <Button
                        key={value}
                        variant="outline"
                        onClick={() => setAmount(value.toString())}
                        className="border-slate-600 text-white hover:bg-slate-800 hover:border-slate-500"
                      >
                        R$ {value}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progresso de Bônus */}
            <div className="space-y-6">
              {/* Progresso de Bônus */}
              <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-purple-400" />
                    <span>Bônus de Depósito</span>
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Ganhe bônus ao atingir metas de depósito
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progresso atual */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Total depositado hoje</span>
                      <span className="text-purple-300 font-bold">
                        R$ {formatCurrency(depositProgress.total_deposited)}
                      </span>
                    </div>

                    {nextBonus && (
                      <>
                        <Progress value={getProgressPercentage(nextBonus.target)} className="h-3 bg-slate-800" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            Faltam R$ {formatCurrency(nextBonus.remaining)} para o próximo bônus
                          </span>
                          <span className="text-purple-300 font-semibold">+R$ {nextBonus.bonus}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Metas de bônus */}
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>Metas de Bônus</span>
                    </h4>

                    {/* Bônus R$ 50 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        depositProgress.bonus_50_claimed
                          ? "bg-green-900/30 border-green-700/50"
                          : "bg-slate-800/50 border-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {depositProgress.bonus_50_claimed ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">Deposite R$ 50</p>
                          <p className="text-gray-400 text-sm">Ganhe R$ 5 de bônus</p>
                        </div>
                      </div>
                      <Badge
                        variant={depositProgress.bonus_50_claimed ? "default" : "secondary"}
                        className={
                          depositProgress.bonus_50_claimed ? "bg-green-600 text-white" : "bg-slate-700 text-gray-300"
                        }
                      >
                        {depositProgress.bonus_50_claimed ? "Concluído" : "Pendente"}
                      </Badge>
                    </div>

                    {/* Bônus R$ 100 */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        depositProgress.bonus_100_claimed
                          ? "bg-green-900/30 border-green-700/50"
                          : "bg-slate-800/50 border-slate-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {depositProgress.bonus_100_claimed ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">Deposite R$ 100</p>
                          <p className="text-gray-400 text-sm">Ganhe R$ 10 de bônus</p>
                        </div>
                      </div>
                      <Badge
                        variant={depositProgress.bonus_100_claimed ? "default" : "secondary"}
                        className={
                          depositProgress.bonus_100_claimed ? "bg-green-600 text-white" : "bg-slate-700 text-gray-300"
                        }
                      >
                        {depositProgress.bonus_100_claimed ? "Concluído" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-semibold text-sm">Como funciona?</h4>
                        <ul className="text-gray-400 text-sm mt-2 space-y-1">
                          <li>• Os bônus são creditados automaticamente</li>
                          <li>• Válido apenas para o primeiro depósito de cada valor</li>
                          <li>• Bônus são creditados instantaneamente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Importantes */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-400" />
                    <span>Informações Importantes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                      <p className="text-gray-300">
                        <strong className="text-white">Processamento:</strong> Depósitos via PIX são processados
                        instantaneamente
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                      <p className="text-gray-300">
                        <strong className="text-white">Valor mínimo:</strong> R$ {minDepositAmount.toFixed(2)} por
                        transação
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                      <p className="text-gray-300">
                        <strong className="text-white">Disponibilidade:</strong> 24 horas por dia, 7 dias por semana
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
                      <p className="text-gray-300">
                        <strong className="text-white">Segurança:</strong> Todas as transações são criptografadas e
                        seguras
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Precisa de ajuda?</span>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                        Suporte 24/7
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* QR Code Modal */}
      <QRCodeModalOptimized
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        paymentOrder={paymentOrder}
        onPaymentDetected={handlePaymentDetected}
      />

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
