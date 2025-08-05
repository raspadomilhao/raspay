"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  LogOut,
  Calendar,
  Hash,
  User,
  RefreshCw,
  Target,
  UserPlus,
  Mail,
  Lock,
  Code,
  GamepadIcon,
  Calculator,
  History,
  Info,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ManagerStats {
  total_affiliates: number
  active_affiliates: number
  total_referrals: number
  current_balance: number
  commission_rate: number
  pending_withdraws: number
  total_affiliate_earnings: number
  calculated_manager_earnings: number
  this_month_transactions: number
  total_deposits_managed: number
  total_deposit_volume_managed: number
  recent_activity: Array<{
    activity_type: string
    affiliate_name: string
    total_earnings: number
    activity_date: string
    manager_share: number
  }>
}

interface Affiliate {
  id: number
  name: string
  email: string
  username: string
  affiliate_code: string
  commission_rate: number
  loss_commission_rate: number
  total_earnings: number
  total_referrals: number
  active_referrals: number
  total_deposit_volume: number
  manager_commissions_generated: number
  status: string
}

interface Commission {
  id: number
  amount: number
  commission_type: string
  description: string
  created_at: string
  affiliate_name: string
  affiliate_code: string
  user_name?: string
  user_email?: string
  result_type: "win" | "loss" | "neutral"
}

interface Withdraw {
  id: number
  amount: number
  pix_key: string
  pix_type: string
  status: string
  admin_notes?: string
  created_at: string
  processed_at?: string
}

export default function ManagerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<ManagerStats | null>(null)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [withdraws, setWithdraws] = useState<Withdraw[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [isCreateAffiliateDialogOpen, setIsCreateAffiliateDialogOpen] = useState(false)
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    pix_key: "",
    pix_type: "cpf",
  })
  const [affiliateForm, setAffiliateForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    loss_commission_rate: "10",
  })

  // Função para obter headers de autenticação
  const getAuthHeaders = () => {
    const token = localStorage.getItem("manager_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  const fetchData = async () => {
    try {
      console.log("🔄 Carregando dados do dashboard do gerente...")

      // Usar fetch com headers de autenticação
      const [statsRes, affiliatesRes, commissionsRes, withdrawsRes] = await Promise.all([
        fetch("/api/manager/dashboard/stats", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }),
        fetch("/api/manager/affiliates", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }),
        fetch("/api/manager/commissions", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }),
        fetch("/api/manager/withdraws", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        }),
      ])

      console.log("📡 Status das respostas:", {
        stats: statsRes.status,
        affiliates: affiliatesRes.status,
        commissions: commissionsRes.status,
        withdraws: withdrawsRes.status,
      })

      if (statsRes.status === 401 || affiliatesRes.status === 401) {
        console.log("🚫 Token inválido, redirecionando para login...")
        localStorage.removeItem("manager_token")
        localStorage.removeItem("manager_data")
        router.push("/manager/login")
        return
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log("📊 Stats carregadas:", statsData)
        setStats(statsData)
      }

      if (affiliatesRes.ok) {
        const affiliatesData = await affiliatesRes.json()
        console.log("👥 Afiliados carregados:", affiliatesData)
        setAffiliates(affiliatesData.affiliates || [])
      }

      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json()
        console.log("💰 Comissões carregadas:", commissionsData)
        setCommissions(commissionsData.commissions || [])
      }

      if (withdrawsRes.ok) {
        const withdrawsData = await withdrawsRes.json()
        console.log("💸 Saques carregados:", withdrawsData)
        setWithdraws(withdrawsData.withdraws || [])
      }

      console.log("✅ Todos os dados carregados com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error)
      setError("Erro ao carregar dados do dashboard")
      toast.error("Erro ao carregar dados do dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Verificar se há token antes de carregar dados
    const token = localStorage.getItem("manager_token")
    if (!token) {
      console.log("🚫 Nenhum token encontrado, redirecionando para login...")
      router.push("/manager/login")
      return
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/manager/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      })
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      localStorage.removeItem("manager_token")
      localStorage.removeItem("manager_data")
      router.push("/manager/login")
    }
  }

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log("🔄 Enviando solicitação de saque...")

      const response = await fetch("/api/manager/withdraw/request", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(withdrawForm),
      })

      console.log("📡 Status da resposta:", response.status)
      console.log("📡 Headers da resposta:", Object.fromEntries(response.headers.entries()))

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("❌ Resposta não é JSON:", responseText)
        toast.error("Erro interno do servidor. Tente novamente em alguns minutos.")
        return
      }

      // Tentar obter o texto da resposta primeiro
      const responseText = await response.text()
      console.log("📦 Resposta bruta:", responseText)

      // Verificar se a resposta é JSON válido
      let result
      try {
        result = JSON.parse(responseText)
        console.log("📦 Resultado parseado:", result)
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError)
        console.error("❌ Resposta não é JSON:", responseText)

        // Mostrar erro mais detalhado
        if (responseText.includes("Internal server error") || responseText.includes("Internal Server Error")) {
          toast.error("Erro interno do servidor. Tente novamente em alguns minutos.")
        } else {
          toast.error(`Erro no servidor: ${responseText.substring(0, 100)}...`)
        }
        return
      }

      if (response.ok && result.success) {
        toast.success(result.message || "Solicitação de saque enviada com sucesso!")
        setIsWithdrawDialogOpen(false)
        setWithdrawForm({ amount: "", pix_key: "", pix_type: "cpf" })

        // 🔄 Atualizar saldo imediatamente na interface
        if (stats && result.new_balance !== undefined) {
          setStats({
            ...stats,
            current_balance: result.new_balance,
          })
        }

        // Recarregar todos os dados para garantir consistência
        fetchData()
      } else {
        console.error("❌ Erro na resposta:", result)
        toast.error(result.error || "Erro ao solicitar saque")
      }
    } catch (error) {
      console.error("❌ Erro ao solicitar saque:", error)
      toast.error("Erro de conexão com o servidor")
    }
  }

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingAffiliate(true)

    try {
      console.log("🔄 Enviando dados para criar afiliado:", affiliateForm)

      const response = await fetch("/api/manager/affiliates/create", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(affiliateForm),
      })

      console.log("📡 Status da resposta:", response.status)
      console.log("📡 Headers da resposta:", Object.fromEntries(response.headers.entries()))

      // Tentar obter o texto da resposta primeiro
      const responseText = await response.text()
      console.log("📦 Resposta bruta:", responseText)

      // Verificar se a resposta é JSON válido
      let result
      try {
        result = JSON.parse(responseText)
        console.log("📦 Resultado parseado:", result)
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError)
        console.error("❌ Resposta não é JSON:", responseText)

        // Mostrar erro mais detalhado
        if (responseText.includes("Internal server error")) {
          toast.error("Erro interno do servidor. Verifique os logs para mais detalhes.")
        } else {
          toast.error(`Erro no servidor: ${responseText.substring(0, 100)}...`)
        }
        return
      }

      if (response.ok && result.success) {
        toast.success("Afiliado criado com sucesso!")
        setIsCreateAffiliateDialogOpen(false)
        setAffiliateForm({
          name: "",
          email: "",
          username: "",
          password: "",
          loss_commission_rate: "10",
        })
        fetchData() // Recarregar dados
      } else {
        console.error("❌ Erro na resposta:", result)
        toast.error(result.error || result.details || "Erro ao criar afiliado")
      }
    } catch (error) {
      console.error("❌ Erro ao criar afiliado:", error)
      toast.error("Erro de conexão com o servidor")
    } finally {
      setIsCreatingAffiliate(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock, label: "Pendente" },
      approved: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Aprovado" },
      rejected: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Rejeitado" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard do Gerente</h1>
          <p className="text-gray-400">Sistema Simplificado: 5% do Total Ganho dos Afiliados</p>
          {stats && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-blue-500/20 text-blue-400 flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                Fórmula: 5% × R$ {formatCurrency(stats.total_affiliate_earnings).replace("R$", "").trim()}
              </Badge>
              <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Calculado: {formatCurrency(stats.calculated_manager_earnings)}
              </Badge>
            </div>
          )}
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Afiliados Ativos</p>
                  <p className="text-2xl font-bold text-white">{stats.active_affiliates}</p>
                  <p className="text-xs text-gray-500">de {stats.total_affiliates} total</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Seu Saldo Atual</p>
                  <p className={`text-2xl font-bold ${stats.current_balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(stats.current_balance)}
                  </p>
                  <p className="text-xs text-gray-500">{stats.commission_rate}% do total dos afiliados</p>
                </div>
                <Wallet className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Ganho Afiliados</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.total_affiliate_earnings)}</p>
                  <p className="text-xs text-gray-500">Base para seu cálculo</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Indicações Gerenciadas</p>
                  <p className="text-2xl font-bold text-white">{stats.total_referrals}</p>
                  <p className="text-xs text-gray-500">Volume: {formatCurrency(stats.total_deposit_volume_managed)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Explanation Card */}
      {stats && (
        <Card className="bg-slate-900/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5" />
              Como Funciona o Sistema Simplificado
            </CardTitle>
            <CardDescription>
              Seu saldo é sempre {stats.commission_rate}% do total ganho pelos seus afiliados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Total Ganho dos Afiliados:</span>
                  <span className="text-blue-400 font-bold">{formatCurrency(stats.total_affiliate_earnings)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Sua Comissão ({stats.commission_rate}%):</span>
                  <span className="text-green-400 font-bold">{formatCurrency(stats.calculated_manager_earnings)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Saldo Atual:</span>
                  <span className={`font-bold ${stats.current_balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(stats.current_balance)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">✅ Vantagens:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Sistema simples e transparente</li>
                    <li>• Baseado no histórico total (não diminui)</li>
                    <li>• Atualização automática</li>
                    <li>• Fácil de verificar e auditar</li>
                  </ul>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h4 className="text-yellow-400 font-medium mb-2">ℹ️ Importante:</h4>
                  <p className="text-sm text-gray-300">
                    Mesmo que o afiliado saque, o "Total Ganho" é histórico e nunca diminui, garantindo que sua comissão
                    seja sempre justa.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="affiliates" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="affiliates" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Meus Afiliados ({affiliates.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">
            <History className="h-4 w-4 mr-2" />
            Atividade Recente
          </TabsTrigger>
          <TabsTrigger value="withdraws" className="data-[state=active]:bg-slate-700">
            <Wallet className="h-4 w-4 mr-2" />
            Saques ({withdraws.length})
          </TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Meus Afiliados</CardTitle>
                  <CardDescription>
                    Lista dos afiliados sob sua gestão - Você recebe 5% do Total Ganho de cada um
                  </CardDescription>
                </div>
                <Dialog open={isCreateAffiliateDialogOpen} onOpenChange={setIsCreateAffiliateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Afiliado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Criar Novo Afiliado
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAffiliate} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Nome Completo
                        </Label>
                        <Input
                          id="name"
                          value={affiliateForm.name}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="João Silva"
                          required
                          disabled={isCreatingAffiliate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={affiliateForm.email}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, email: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="joao@exemplo.com"
                          required
                          disabled={isCreatingAffiliate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="username" className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Nome de Usuário
                        </Label>
                        <Input
                          id="username"
                          value={affiliateForm.username}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, username: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="joaosilva"
                          required
                          disabled={isCreatingAffiliate}
                        />
                        <p className="text-xs text-gray-400 mt-1">Será usado para gerar o código de afiliado</p>
                      </div>
                      <div>
                        <Label htmlFor="password" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={affiliateForm.password}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, password: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          required
                          disabled={isCreatingAffiliate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="loss_commission_rate" className="flex items-center gap-1">
                          <GamepadIcon className="h-3 w-3" />
                          Comissão por Ganhos/Perdas (%)
                          <span className="text-xs text-yellow-400 ml-1">Máx: 70%</span>
                        </Label>
                        <Input
                          id="loss_commission_rate"
                          type="number"
                          min="0"
                          max="70"
                          step="0.1"
                          value={affiliateForm.loss_commission_rate}
                          onChange={(e) => setAffiliateForm({ ...affiliateForm, loss_commission_rate: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="10"
                          required
                          disabled={isCreatingAffiliate}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Percentual sobre os ganhos e perdas dos jogadores referidos
                        </p>
                      </div>

                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400">
                          <strong className="text-green-400">Sistema Simplificado:</strong>
                        </p>
                        <ul className="text-xs text-gray-400 mt-1 space-y-1">
                          <li>
                            • <strong className="text-blue-400">Afiliado:</strong> Ganha comissões dos jogadores
                          </li>
                          <li>
                            • <strong className="text-green-400">Você (Gerente):</strong> Sempre 5% do Total Ganho do
                            afiliado
                          </li>
                          <li>
                            • <strong className="text-yellow-400">Automático:</strong> Saldo atualizado automaticamente
                          </li>
                          <li>
                            • <strong className="text-purple-400">Histórico:</strong> Baseado no total acumulado (nunca
                            diminui)
                          </li>
                        </ul>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateAffiliateDialogOpen(false)}
                          className="border-slate-600"
                          disabled={isCreatingAffiliate}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isCreatingAffiliate}>
                          {isCreatingAffiliate ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Criar Afiliado
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {affiliates.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-gray-400">Nome</TableHead>
                        <TableHead className="text-gray-400">Código</TableHead>
                        <TableHead className="text-gray-400">Total Ganho</TableHead>
                        <TableHead className="text-gray-400">Sua Comissão (5%)</TableHead>
                        <TableHead className="text-gray-400">Indicações</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((affiliate) => (
                        <TableRow key={affiliate.id} className="hover:bg-slate-800 border-slate-700">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{affiliate.name}</p>
                              <p className="text-gray-400 text-sm">{affiliate.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                              {affiliate.affiliate_code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-blue-400 font-bold text-lg">
                              {formatCurrency(affiliate.total_earnings)}
                            </div>
                            <div className="text-xs text-gray-500">Total histórico</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-400 font-bold text-lg">
                              {formatCurrency(affiliate.total_earnings * 0.05)}
                            </div>
                            <div className="text-xs text-gray-500">5% automático</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-white font-medium">{affiliate.total_referrals}</div>
                              <div className="text-xs text-gray-400">{affiliate.active_referrals} ativos</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={affiliate.status === "active" ? "default" : "secondary"}
                              className={
                                affiliate.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {affiliate.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum afiliado vinculado ainda</p>
                  <p className="text-sm mt-2">Clique em "Criar Afiliado" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Atividade Recente</CardTitle>
              <CardDescription>Atualizações dos ganhos dos seus afiliados</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{activity.affiliate_name}</p>
                          <p className="text-gray-400 text-sm">
                            Total ganho: {formatCurrency(activity.total_earnings)}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(activity.activity_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">+{formatCurrency(activity.manager_share)}</p>
                        <p className="text-xs text-gray-500">Sua comissão (5%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm mt-2">As atividades aparecerão quando seus afiliados ganharem comissões</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraws Tab */}
        <TabsContent value="withdraws">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Meus Saques</CardTitle>
                  <CardDescription>Histórico de solicitações de saque</CardDescription>
                </div>
                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      disabled={!stats || stats.current_balance < 10}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Solicitar Saque
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Solicitar Saque</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawRequest} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="10"
                          max={stats?.current_balance || 0}
                          value={withdrawForm.amount}
                          onChange={(e) => {
                            const value = e.target.value
                            const numValue = Number.parseFloat(value)
                            if (stats && numValue > stats.current_balance) {
                              toast.error(`Valor máximo disponível: ${formatCurrency(stats.current_balance)}`)
                              return
                            }
                            setWithdrawForm({ ...withdrawForm, amount: value })
                          }}
                          className="bg-slate-800 border-slate-600"
                          placeholder="0.00"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Saldo disponível: {formatCurrency(stats?.current_balance || 0)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="pix_type">Tipo de Chave PIX</Label>
                        <Select
                          value={withdrawForm.pix_type}
                          onValueChange={(value) => setWithdrawForm({ ...withdrawForm, pix_type: value })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="pix_key">Chave PIX</Label>
                        <Input
                          id="pix_key"
                          value={withdrawForm.pix_key}
                          onChange={(e) => setWithdrawForm({ ...withdrawForm, pix_key: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                          placeholder="Digite sua chave PIX"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsWithdrawDialogOpen(false)}
                          className="border-slate-600"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          Solicitar Saque
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {withdraws.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-gray-400">ID</TableHead>
                        <TableHead className="text-gray-400">Valor</TableHead>
                        <TableHead className="text-gray-400">PIX</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Data</TableHead>
                        <TableHead className="text-gray-400">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdraws.map((withdraw) => (
                        <TableRow key={withdraw.id} className="hover:bg-slate-800 border-slate-700">
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-gray-500" />
                              <span className="text-white">{withdraw.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg text-white">{formatCurrency(withdraw.amount)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-gray-400">Chave:</span>
                                <div className="font-mono text-white truncate max-w-[100px]">{withdraw.pix_key}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Tipo:</span>
                                <span className="ml-1 capitalize text-white">{withdraw.pix_type}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-400">{formatDate(withdraw.created_at)}</span>
                            </div>
                            {withdraw.processed_at && (
                              <div className="text-xs text-gray-500 mt-1">
                                Processado: {formatDate(withdraw.processed_at)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {withdraw.admin_notes && (
                              <div
                                className="text-xs text-gray-400 max-w-[150px] truncate"
                                title={withdraw.admin_notes}
                              >
                                📝 {withdraw.admin_notes}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum saque solicitado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
