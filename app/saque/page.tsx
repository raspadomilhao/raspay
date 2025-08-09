"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpRight,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  User,
  LogOut,
  Menu,
  DollarSign,
  Calendar,
  Trophy,
  CreditCard,
  Building,
  Zap,
  Gamepad2,
  TrendingUp,
} from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { toast } from "@/hooks/use-toast"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"

interface WithdrawRequest {
  id: number
  amount: number
  pix_key: string
  pix_type: string
  status: string
  created_at: string
  updated_at?: string
  description?: string
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

interface SystemSettings {
  min_withdraw_amount?: string
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

// Função para formatar data
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500"
    case "approved":
      return "bg-green-500"
    case "rejected":
      return "bg-red-500"
    case "cancelled":
      return "bg-gray-500"
    default:
      return "bg-blue-500"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />
    case "approved":
      return <CheckCircle className="h-4 w-4" />
    case "rejected":
      return <XCircle className="h-4 w-4" />
    case "cancelled":
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendente"
    case "approved":
      return "Aprovado"
    case "rejected":
      return "Rejeitado"
    case "cancelled":
      return "Cancelado"
    default:
      return "Desconhecido"
  }
}

export default function SaquePage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [amount, setAmount] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [pixType, setPixType] = useState("cpf")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Configurações do sistema (valor mínimo de saque)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({})
  const [minWithdrawAmount, setMinWithdrawAmount] = useState<number>(10) // fallback

  useEffect(() => {
    const token = AuthClient.getToken()
    if (!token || !AuthClient.isLoggedIn()) {
      router.push("/auth")
      return
    }

    fetchUserProfile()
    fetchWithdrawHistory()
    fetchSystemSettings() // Buscar configurações para refletir o mínimo de saque
  }, [router])

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const settings: SystemSettings = data.settings || {}
      setSystemSettings(settings)
      if (settings.min_withdraw_amount) {
        const parsed = Number.parseFloat(settings.min_withdraw_amount)
        if (!Number.isNaN(parsed) && parsed > 0) {
          setMinWithdrawAmount(parsed)
        }
      }
    } catch (err) {
      console.warn("Não foi possível carregar as configurações do sistema, usando padrão.", err)
    }
  }

  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile for saque page...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")

      if (response.ok) {
        const data = await response.json()
        console.log("Saque page profile data:", data)
        setUserProfile(data)
      } else {
        console.error("Failed to fetch profile:", response.status)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawHistory = async () => {
    try {
      console.log("🔍 Buscando histórico de saques...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/saque/historico")

      if (response.ok) {
        const data = await response.json()
        console.log("📋 Resposta da API:", data)

        const withdraws = data.withdraws || []
        setWithdrawHistory(withdraws)
        console.log(`💾 Histórico atualizado: ${withdraws.length} saques encontrados`)
      } else {
        console.error("❌ Erro na resposta:", response.status)
        const errorData = await response.json()
        console.error("❌ Detalhes do erro:", errorData)
      }
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error)
    }
  }

  // Helper function to safely convert to number and format
  const getCurrentBalance = (): number => {
    if (userProfile?.wallet?.balance !== undefined) {
      return typeof userProfile.wallet.balance === "string"
        ? Number.parseFloat(userProfile.wallet.balance)
        : userProfile.wallet.balance
    }
    return 0
  }

  const parsedAmount = Number.parseFloat(amount || "0")
  const amountIsValid =
    !Number.isNaN(parsedAmount) && parsedAmount >= minWithdrawAmount && parsedAmount <= getCurrentBalance()

  const handleLogout = () => {
    AuthClient.logout()
    router.push("/auth")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number.parseFloat(amount)

    if (Number.isNaN(amountNum)) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor numérico válido.",
        variant: "destructive",
      })
      return
    }

    if (amountNum < minWithdrawAmount) {
      toast({
        title: "Atenção",
        description: `O valor mínimo de saque é R$ ${minWithdrawAmount.toFixed(2)}.`,
        variant: "destructive",
      })
      return
    }

    if (amountNum > getCurrentBalance()) {
      toast({
        title: "Saldo insuficiente",
        description: "O valor solicitado excede seu saldo disponível.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      console.log("📤 Enviando solicitação de saque...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/saque/solicitar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          pix_key: pixKey,
          pix_type: pixType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Saque solicitado com sucesso:", result)
        toast({
          title: "Sucesso",
          description: "Solicitação de saque enviada com sucesso!",
        })
        setAmount("")
        setPixKey("")
        await fetchUserProfile()
        await fetchWithdrawHistory()
      } else {
        const error = await response.json()
        console.error("❌ Erro na solicitação:", error)
        toast({
          title: "Erro",
          description: error.error || "Erro ao solicitar saque",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      toast({
        title: "Erro",
        description: "Erro ao solicitar saque",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: number) => {
    console.log(`🔄 Tentando cancelar saque ID: ${id}`)

    if (!confirm("Tem certeza que deseja cancelar esta solicitação?")) {
      console.log("❌ Cancelamento abortado pelo usuário")
      return
    }

    setCancelling(id)
    try {
      console.log(`🚫 Enviando cancelamento para saque ID: ${id}`)
      const response = await AuthClient.makeAuthenticatedRequest("/api/saque/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transaction_id: id }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Saque cancelado:", result)
        toast({
          title: "Sucesso",
          description: "Solicitação cancelada com sucesso!",
        })
        await fetchUserProfile()
        await fetchWithdrawHistory()
      } else {
        const error = await response.json()
        console.error("❌ Erro ao cancelar:", error)
        toast({
          title: "Erro",
          description: error.error || "Erro ao cancelar solicitação",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar solicitação",
        variant: "destructive",
      })
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ArrowUpRight className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando informações de saque...</p>
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

                          <Button variant="secondary" className="w-full justify-start text-white">
                            <TrendingUp className="h-4 w-4 mr-3" />
                            Sacar
                          </Button>

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

                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="h-6 w-6 text-green-400" />
                  <h1 className="text-2xl font-bold text-white">Sacar</h1>
                </div>
              </div>
              <Link href="/deposito" className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
                <CreditCard className="h-4 w-4 text-green-400" />
                <span className="text-white font-semibold text-sm md:text-base">
                  R$ {formatCurrency(getCurrentBalance())}
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full mb-6">
                <ArrowUpRight className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                SAQUES
              </h1>
              <p className="text-xl text-gray-300 mb-2">Retire seus ganhos de forma rápida e segura</p>
              <p className="text-sm text-gray-400">Processamento em até 24 horas úteis</p>
            </div>

            {/* Card de Saldo */}
            <Card className="bg-gray-900 border-green-400/30 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Saldo Disponível</h3>
                      <p className="text-green-400 text-sm">Pronto para saque</p>
                    </div>
                  </div>
                </div>
                <div className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  R$ {formatCurrency(getCurrentBalance())}
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Saque */}
            <Card className="bg-gray-900 border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-green-400" />
                  <span>Nova Solicitação de Saque</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white font-medium flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span>Valor do Saque</span>
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min={minWithdrawAmount}
                        max={getCurrentBalance()}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Ex: 50.00"
                        required
                        className="h-12 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400">Mínimo: R$ {minWithdrawAmount.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixType" className="text-white font-medium flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-400" />
                        <span>Tipo de Chave PIX</span>
                      </Label>
                      <select
                        id="pixType"
                        value={pixType}
                        onChange={(e) => setPixType(e.target.value)}
                        className="h-12 w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixKey" className="text-white font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-400" />
                      <span>Chave PIX</span>
                    </Label>
                    <Input
                      id="pixKey"
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Digite sua chave PIX"
                      required
                      className="h-12 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !amountIsValid}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg disabled:opacity-60"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ArrowUpRight className="h-5 w-5" />
                        <span>Solicitar Saque</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Histórico de Saques */}
            <Card className="bg-gray-900 border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-blue-400" />
                  <span>Histórico de Saques ({withdrawHistory.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-300 mb-2">Nenhum saque realizado</h3>
                    <p className="text-gray-400">Suas solicitações de saque aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawHistory.map((withdraw) => (
                      <Card key={withdraw.id} className="bg-gray-800 border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <ArrowUpRight className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white">R$ {formatCurrency(withdraw.amount)}</h4>
                                <p className="text-gray-400 text-sm">
                                  {withdraw.pix_type.toUpperCase()}: {withdraw.pix_key}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(withdraw.status)} text-white font-bold px-3 py-1`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(withdraw.status)}
                                <span>{getStatusText(withdraw.status)}</span>
                              </div>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>Solicitado: {formatDate(withdraw.created_at)}</span>
                            </div>
                            {withdraw.updated_at && withdraw.updated_at !== withdraw.created_at && (
                              <div className="flex items-center space-x-2 text-gray-400">
                                <CheckCircle className="h-4 w-4" />
                                <span>Atualizado: {formatDate(withdraw.updated_at)}</span>
                              </div>
                            )}
                          </div>

                          {withdraw.description && (
                            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                              <p className="text-gray-300 text-sm">
                                <strong>Descrição:</strong> {withdraw.description}
                              </p>
                            </div>
                          )}

                          {withdraw.status === "pending" && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                onClick={() => handleCancel(withdraw.id)}
                                disabled={cancelling === withdraw.id}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50"
                              >
                                {cancelling === withdraw.id ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Cancelando...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <XCircle className="h-4 w-4" />
                                    <span>Cancelar</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
