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
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"
import { QRCodeModal } from "@/components/qr-code-modal"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
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

export default function DepositoPage() {
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

  // Buscar configurações do sistema
  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/settings")
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
  }

  // Buscar progresso de depósitos do usuário
  const fetchDepositProgress = async () => {
    try {
      console.log("🔄 Buscando progresso de depósitos...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/deposits")
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Dados recebidos:", data)

        setDepositProgress({
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })

        // Mostrar notificação se bônus foi concedido
        if (data.bonus_awarded) {
          toast({
            title: "🎉 Parabéns!",
            description: "Você ganhou um bônus de depósito!",
          })
        }

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
  }

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    fetchSystemSettings()
    const token = AuthClient.getToken()
    if (token) {
      setIsLoggedIn(true)
      fetchUserProfile()
      fetchDepositProgress()
    }
  }, [])

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

  // Buscar perfil do usuário
  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")

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
                await fetchDepositProgress()
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
    fetchDepositProgress()
    setAmount("")
    setPaymentOrder(null)

    // Forçar atualização após um pequeno delay
    setTimeout(() => {
      console.log("🔄 Forçando segunda atualização...")
      fetchDepositProgress()
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
      fetchDepositProgress()
      // Remover autenticação automática - será feita apenas quando necessário
    }
  }, [isLoggedIn])

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
                        <Link href="/termos" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline">
                          termos de uso
                        </Link>{" "}
                        e{" "}
                        <Link
                          href="/privacidade"
                          target="_blank"
                          className="text-cyan-400 hover:text-cyan-300 underline"
                        >
                          política de privacidade
                        </Link>
                      </Label>
                    </div>
                  </>
                )}

                <Button
                  onClick={showLogin ? handleLogin : handleRegister}
                  disabled={
                    loading ||
                    !login ||
                    !password ||
                    (!showLogin && (!username || !phone || !confirmPassword || !acceptTerms))
                  }
                  className="w-full h-10 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-medium"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </div>
                  ) : showLogin ? (
                    "Entrar"
                  ) : (
                    "Criar conta"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowLogin(!showLogin)}
                  className="w-full text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  {showLogin ? "Não tem conta? Registre-se" : "Já tem conta? Faça login"}
                </Button>

                {showLogin && (
                  <div className="text-center text-sm text-gray-400 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <p>
                      <strong className="text-gray-200">Faça login:</strong> para depositar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Barra de navegação inferior móvel */}
        <MobileBottomNav />

        {/* Footer */}
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
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

                        <Button variant="secondary" className="w-full justify-start">
                          <CreditCard className="h-4 w-4 mr-3" />
                          Depositar
                        </Button>

                        <Link href="/saque" onClick={() => setSidebarOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                            <ArrowRight className="h-4 w-4 mr-3" />
                            Sacar
                          </Button>
                        </Link>

                        <Link href="/vencedores" onClick={() => setSidebarOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                            <Trophy className="h-4 w-4 mr-3" />
                            Vencedores
                          </Button>
                        </Link>

                        <Link href="/perfil" onClick={() => setSidebarOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-800">
                            <User className="h-4 w-4 mr-3" />
                            Perfil
                          </Button>
                        </Link>
                      </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700">
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Deposito</h1>
                <p className="text-sm text-gray-400">Deposite de forma rápida e segura</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
              <Wallet className="h-4 w-4 text-green-400" />
              <span className="text-white font-semibold text-sm md:text-base">
                R$ {formatCurrency(getCurrentBalance())}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:pb-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Depósitos PIX</h1>
            <p className="text-slate-400">Deposite de forma rápida e segura</p>
          </div>

          {/* Progresso de Bônus - Versão Minimalista */}
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-yellow-500" />
                  <span className="text-white font-medium text-sm">Bônus Hoje</span>
                </div>
                <span className="text-white font-bold text-sm">R$ {depositProgress.total_deposited.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Bônus R$ 50 */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-medium">R$ 50</span>
                    {depositProgress.bonus_50_claimed ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Clock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  <div className="mb-2">
                    <Progress value={getProgressPercentage(50)} className="h-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {depositProgress.bonus_50_claimed ? "+R$ 5 ganho!" : "+R$ 5 bônus"}
                  </p>
                </div>

                {/* Bônus R$ 100 */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-medium">R$ 100</span>
                    {depositProgress.bonus_100_claimed ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Clock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                  <div className="mb-2">
                    <Progress value={getProgressPercentage(100)} className="h-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {depositProgress.bonus_100_claimed ? "+R$ 10 ganho!" : "+R$ 10 bônus"}
                  </p>
                </div>
              </div>

              {nextBonus && (
                <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                  <p className="text-xs text-yellow-400 text-center">
                    Faltam R$ {nextBonus.remaining.toFixed(2)} para +R$ {nextBonus.bonus}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-cyan-500" />
                <span>Fazer Depósito</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Valor mínimo: R$ {minDepositAmount.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suggested Amounts */}
              <div className="space-y-2">
                <Label className="text-white text-[0.7rem] font-medium">Valores sugeridos</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAmount("20")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 20</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                      Popular
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAmount("40")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 40</span>
                    <Badge variant="secondary" className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-[10px]">
                      +Querido
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAmount("60")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 60</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"
                    >
                      Recomendado
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAmount("120")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 120</span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]"
                    >
                      +Chances
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAmount("150")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 150</span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]"
                    >
                      +Chances
                    </Badge>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setAmount("300")}
                    className="relative bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 p-2 h-auto flex flex-col items-center space-y-0.5"
                  >
                    <span className="text-sm font-bold">R$ 300</span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]"
                    >
                      +Chances
                    </Badge>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">
                    Valor (R$)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Mínimo R$ ${minDepositAmount.toFixed(2)}`}
                    className="bg-slate-800 border-slate-600 text-white"
                    min={minDepositAmount}
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payerName" className="text-white">
                    Nome do pagador
                  </Label>
                  <Input
                    id="payerName"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={generatePix}
                disabled={loading || !amount || Number.parseFloat(amount) < minDepositAmount || !payerName.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gerando PIX...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Gerar PIX</span>
                  </div>
                )}
              </Button>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 text-cyan-400 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Instantâneo</span>
                  </div>
                  <p className="text-sm text-slate-400">Depósitos são creditados automaticamente</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 text-green-400 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Seguro</span>
                  </div>
                  <p className="text-sm text-slate-400">Transações protegidas e criptografadas</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">24/7</span>
                  </div>
                  <p className="text-sm text-slate-400">Disponível todos os dias, a qualquer hora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* QR Code Modal */}
      {paymentOrder && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          paymentOrder={paymentOrder}
          onPaymentDetected={handlePaymentDetected}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Footer */}
      <Footer />
    </div>
  )
}
