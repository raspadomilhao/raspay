"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  DollarSign,
  Copy,
  LogOut,
  RefreshCw,
  CreditCard,
  Target,
  Award,
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  BarChart3,
} from "lucide-react"

interface AffiliateData {
  id: number
  name: string
  email: string
  username: string
  affiliate_code: string
  commission_rate: number
  loss_commission_rate: number
  total_earnings: number
  balance: number
  total_referrals: number
  affiliate_link: string
}

interface Stats {
  total_referrals: number
  active_referrals: number
  total_real_deposits: number
  total_deposit_volume: number
  total_games_played: number
  total_game_volume: number
  total_prizes_won: number
  total_commissions: number
  pending_commissions: number
  paid_commissions: number
  total_commission_amount: number
  deposit_commissions: number
  loss_commissions: number
}

interface Commission {
  id: number
  commission_amount: number
  commission_type: string
  status: string
  created_at: string
  user_name: string
  user_email: string
  transaction_amount: number
  transaction_type: string
  description?: string
}

interface WithdrawRequest {
  id: number
  amount: number
  pix_key: string
  pix_type: string
  status: string
  created_at: string
  processed_at?: string
  admin_notes?: string
}

interface BalanceDetails {
  total_earnings: number
  withdrawn_amount: number
  pending_amount: number
  available_balance: number
}

interface Deposit {
  id: number
  amount: number
  status: string
  external_id: number
  end_to_end_id?: string
  payer_name?: string
  pix_key?: string
  pix_type?: string
  created_at: string
  updated_at: string
  user_id: number
  user_name: string
  user_email: string
  user_username?: string
  commission_amount: number
  commission_created_at?: string
}

interface DepositStats {
  total_deposits: number
  unique_depositors: number
  total_volume: number
  average_amount: number
  min_amount: number
  max_amount: number
  total_commissions_earned: number
}

interface MonthlyStats {
  month: string
  deposits_count: number
  total_amount: number
  unique_users: number
}

interface Pagination {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
  has_next: boolean
  has_prev: boolean
}

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [depositStats, setDepositStats] = useState<DepositStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [depositPagination, setDepositPagination] = useState<Pagination | null>(null)
  const [currentDepositPage, setCurrentDepositPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [depositsLoading, setDepositsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    pix_key: "",
    pix_type: "cpf",
  })
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [cancellingWithdraw, setCancellingWithdraw] = useState<number | null>(null)
  const router = useRouter()

  const loadDashboardData = async () => {
    try {
      console.log("🔍 Carregando dados do dashboard...")

      const token = localStorage.getItem("affiliate-token")
      if (!token) {
        console.log("❌ Token não encontrado")
        router.push("/affiliate/login")
        return
      }

      console.log("🔑 Token encontrado, fazendo requisição...")

      const response = await fetch("/api/affiliate/dashboard/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Status da resposta:", response.status)

      if (response.status === 401) {
        console.log("🚫 Token inválido, limpando localStorage...")
        localStorage.removeItem("affiliate-token")
        localStorage.removeItem("affiliate-data")
        router.push("/affiliate/login")
        return
      }

      const data = await response.json()
      console.log("📊 Dados recebidos:", data)

      if (data.success) {
        setAffiliate(data.affiliate)
        setStats(data.stats)
        setCommissions(data.recent_commissions || [])
        setBalanceDetails(data.balance_details || null)
        console.log("✅ Dashboard carregado com sucesso!")
        console.log("💰 Saldo disponível:", data.affiliate.balance)
      } else {
        console.log("❌ Erro nos dados:", data.error)
        setError(data.error || "Erro ao carregar dados")
      }
    } catch (error) {
      console.error("❌ Erro na requisição:", error)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const loadDeposits = async (page = 1) => {
    try {
      setDepositsLoading(true)
      const token = localStorage.getItem("affiliate-token")
      if (!token) return

      const response = await fetch(`/api/affiliate/deposits?page=${page}&limit=20`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDeposits(data.deposits || [])
          setDepositStats(data.stats || null)
          setMonthlyStats(data.monthly_stats || [])
          setDepositPagination(data.pagination || null)
          setCurrentDepositPage(page)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar depósitos:", error)
    } finally {
      setDepositsLoading(false)
    }
  }

  const loadWithdrawRequests = async () => {
    try {
      const token = localStorage.getItem("affiliate-token")
      if (!token) return

      const response = await fetch("/api/affiliate/withdraws", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWithdrawRequests(data.withdraws || [])
      }
    } catch (error) {
      console.error("Erro ao carregar saques:", error)
    }
  }

  useEffect(() => {
    loadDashboardData()
    loadWithdrawRequests()
  }, [])

  useEffect(() => {
    if (activeTab === "deposits") {
      loadDeposits(1)
    }
  }, [activeTab])

  const handleCopyLink = async () => {
    if (affiliate?.affiliate_link) {
      try {
        await navigator.clipboard.writeText(affiliate.affiliate_link)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error("Erro ao copiar:", error)
      }
    }
  }

  const handleWithdrawRequest = async () => {
    if (!withdrawForm.amount || !withdrawForm.pix_key) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const amount = Number.parseFloat(withdrawForm.amount)
    if (amount <= 0) {
      alert("Valor deve ser maior que zero")
      return
    }

    if (amount < 50) {
      alert("Valor mínimo para saque é R$ 50,00")
      return
    }

    const availableBalance = affiliate?.balance || 0
    if (amount > availableBalance) {
      alert(`Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`)
      return
    }

    setWithdrawLoading(true)
    try {
      const token = localStorage.getItem("affiliate-token")
      const response = await fetch("/api/affiliate/withdraw/request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withdrawForm),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Solicitação de saque enviada com sucesso!")
        setShowWithdrawDialog(false)
        setWithdrawForm({ amount: "", pix_key: "", pix_type: "cpf" })

        // Recarregar dados
        loadDashboardData()
        loadWithdrawRequests()
      } else {
        alert(data.error || "Erro ao solicitar saque")
      }
    } catch (error) {
      console.error("Erro ao solicitar saque:", error)
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleCancelWithdraw = async (withdrawId: number) => {
    if (!confirm("Tem certeza que deseja cancelar este saque?")) {
      return
    }

    setCancellingWithdraw(withdrawId)
    try {
      const token = localStorage.getItem("affiliate-token")
      const response = await fetch("/api/affiliate/withdraws", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ withdraw_id: withdrawId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Saque cancelado com sucesso!")
        // Recarregar dados
        loadDashboardData()
        loadWithdrawRequests()
      } else {
        alert(data.error || "Erro ao cancelar saque")
      }
    } catch (error) {
      console.error("Erro ao cancelar saque:", error)
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setCancellingWithdraw(null)
    }
  }

  const handleLogout = async () => {
    try {
      console.log("🚪 Fazendo logout...")

      // Limpar localStorage
      localStorage.removeItem("affiliate-token")
      localStorage.removeItem("affiliate-data")

      // Chamar API de logout (opcional)
      await fetch("/api/affiliate/auth/logout", {
        method: "POST",
      })

      console.log("✅ Logout realizado")
      router.push("/affiliate/login")
    } catch (error) {
      console.error("❌ Erro no logout:", error)
      // Mesmo com erro, redirecionar
      router.push("/affiliate/login")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        )
      case "paid":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Pago
          </Badge>
        )
      case "success":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Confirmado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            {status}
          </Badge>
        )
    }
  }

  const getCommissionTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Depósito
          </Badge>
        )
      case "loss_gain":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Perda do Usuário
          </Badge>
        )
      case "loss_penalty":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Ganho do Usuário
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            {type}
          </Badge>
        )
    }
  }

  const getPixTypeName = (type: string) => {
    const types = {
      cpf: "CPF",
      cnpj: "CNPJ",
      email: "E-mail",
      phone: "Telefone",
      random: "Chave Aleatória",
    }
    return types[type as keyof typeof types] || type
  }

  // Calcular saldo em saques pendentes
  const pendingWithdrawAmount = withdrawRequests
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md bg-red-900/20 border-red-500/30">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-gray-400">{affiliate?.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-white">
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 space-y-3">
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!affiliate?.balance || affiliate.balance <= 0}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Desktop Header */}
        <div className="hidden lg:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Olá, {affiliate?.name}! 👋</h1>
            <p className="text-gray-400 mt-1">
              Código: <span className="font-mono font-semibold text-white">{affiliate?.affiliate_code}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!affiliate?.balance || affiliate.balance <= 0}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Withdraw Dialog */}
        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Solicitar Saque</DialogTitle>
              <DialogDescription className="text-gray-400">
                <div className="space-y-2">
                  <div>
                    Saldo disponível:{" "}
                    <span className="text-green-400 font-semibold">
                      R$ {Number(affiliate?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  {balanceDetails && (
                    <div className="text-sm space-y-1">
                      <div>Total ganho: R$ {balanceDetails.total_earnings.toFixed(2)}</div>
                      <div>Já sacado: R$ {balanceDetails.withdrawn_amount.toFixed(2)}</div>
                      <div>Pendente: R$ {balanceDetails.pending_amount.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-white">
                  Valor do Saque (R$) - Mínimo: R$ 50,00
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="50"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  placeholder="50.00"
                  max={affiliate?.balance || 0}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="pix_key" className="text-white">
                  Chave PIX
                </Label>
                <Input
                  id="pix_key"
                  value={withdrawForm.pix_key}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, pix_key: e.target.value })}
                  placeholder="Digite sua chave PIX"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="pix_type" className="text-white">
                  Tipo da Chave PIX
                </Label>
                <select
                  id="pix_type"
                  value={withdrawForm.pix_type}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, pix_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-white"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <Alert className="bg-blue-900/20 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400">
                  O saque será processado em até 24 horas úteis. Você receberá uma notificação quando for aprovado ou
                  rejeitado.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowWithdrawDialog(false)}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleWithdrawRequest}
                disabled={withdrawLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {withdrawLoading ? "Enviando..." : "Solicitar Saque"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link de Afiliado */}
        <Card className="mb-6 bg-gray-900/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Target className="h-5 w-5 mr-2 text-red-500" />
              Seu Link de Afiliado
            </CardTitle>
            <CardDescription className="text-gray-400">
              Compartilhe este link para ganhar comissão em TODOS os depósitos dos seus referidos + comissão por
              perda/ganho nos jogos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex-1 p-3 bg-gray-800 rounded-md font-mono text-sm text-gray-300 break-all">
                {affiliate?.affiliate_link}
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 shrink-0 bg-transparent"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copySuccess ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-gray-700 text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Depósitos PIX
            </TabsTrigger>
            <TabsTrigger value="withdraws" className="data-[state=active]:bg-gray-700 text-white">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Saques
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Estatísticas de Saldo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Saldo Disponível</CardTitle>
                  <Wallet className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    R$ {Number(affiliate?.balance || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">
                    {pendingWithdrawAmount > 0 ? (
                      <span className="text-yellow-400">R$ {pendingWithdrawAmount.toFixed(2)} em saques pendentes</span>
                    ) : (
                      "Pronto para saque"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Ganho</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    R$ {Number(affiliate?.total_earnings || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Todas as comissões recebidas</p>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Referidos</CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-white">{stats?.total_referrals || 0}</div>
                  <p className="text-xs text-gray-400">{stats?.active_referrals || 0} ativos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Depósitos PIX</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-purple-400">{stats?.total_real_deposits || 0}</div>
                  <p className="text-xs text-gray-400">{stats?.total_real_deposits || 0} depósitos</p>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas de Comissões */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Comissões por Depósito</CardTitle>
                  <Award className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    R$ {Number(stats?.deposit_commissions || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">De depósitos PIX dos referidos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Comissões por Perda/Ganho</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${Number(stats?.loss_commissions || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {Number(stats?.loss_commissions || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">Dos jogos dos referidos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total de Comissões</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    R$ {Number(stats?.total_commission_amount || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">{stats?.total_commissions || 0} comissões</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-6">
            {depositStats && (
              <>
                {/* Estatísticas de Depósitos PIX */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-gray-300">Total de Depósitos PIX</CardTitle>
                      <CreditCard className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-blue-400">{depositStats.total_deposits}</div>
                      <p className="text-xs text-gray-400">{depositStats.unique_depositors} usuários únicos</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-gray-300">Comissões PIX</CardTitle>
                      <Award className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-yellow-400">
                        R$ {depositStats.total_commissions_earned.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-400">Dos depósitos PIX</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Estatísticas Mensais */}
                {monthlyStats.length > 0 && (
                  <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                        Depósitos PIX por Mês (Últimos 6 Meses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthlyStats.map((month) => (
                          <div key={month.month} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">
                              {new Date(month.month).toLocaleDateString("pt-BR", {
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-lg font-bold text-white">{month.deposits_count} depósitos PIX</div>
                            <div className="text-sm text-green-400">R$ {month.total_amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{month.unique_users} usuários únicos</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Withdraws Tab */}
          <TabsContent value="withdraws" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <ArrowUpRight className="h-5 w-5 mr-2 text-blue-400" />
                  Histórico de Saques
                </CardTitle>
                <CardDescription className="text-gray-400">Suas solicitações de saque</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowUpRight className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum saque solicitado ainda.</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quando tiver saldo disponível, você pode solicitar um saque.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawRequests.map((withdraw) => (
                      <div key={withdraw.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-white">R$ {Number(withdraw.amount).toFixed(2)}</span>
                              {getStatusBadge(withdraw.status)}
                            </div>
                            <p className="text-sm text-gray-400">
                              PIX: {getPixTypeName(withdraw.pix_type)} • {withdraw.pix_key}
                            </p>
                            <p className="text-xs text-gray-500">
                              Solicitado:{" "}
                              {new Date(withdraw.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {withdraw.processed_at && (
                              <p className="text-xs text-gray-500">
                                Processado:{" "}
                                {new Date(withdraw.processed_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                            {withdraw.admin_notes && (
                              <p className="text-xs text-gray-400 mt-1">
                                <strong>Observações:</strong> {withdraw.admin_notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {withdraw.status === "pending" && (
                              <Button
                                onClick={() => handleCancelWithdraw(withdraw.id)}
                                disabled={cancellingWithdraw === withdraw.id}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                              >
                                {cancellingWithdraw === withdraw.id ? (
                                  <div className="flex items-center space-x-2">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    <span>Cancelando...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <XCircle className="h-3 w-3" />
                                    <span>Cancelar</span>
                                  </div>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
