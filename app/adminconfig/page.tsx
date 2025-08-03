"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableHead } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Activity,
  Wallet,
  Clock,
  Eye,
  Gamepad2,
  BarChart3,
  CreditCard,
  CheckCircle,
  XCircle,
  Lock,
  AlertCircle,
  FileText,
  UserCog,
  Zap,
  Menu,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Smartphone,
  Info,
} from "lucide-react"

import { AuthClient } from "@/lib/auth-client"
import { usePushNotifications } from "@/hooks/use-push-notifications"

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
  status: string
  created_at: string
  manager_id?: number
  manager_name?: string
  balance: number
  deposits_count: number
}

interface Manager {
  id: number
  name: string
  email: string
  username: string
  commission_rate: number
  total_earnings: number
  balance: number
  status: string
  created_at: string
  total_affiliates?: number
  total_referrals_managed?: number
  total_deposit_volume?: number
}

interface AffiliateWithdraw {
  id: number
  affiliate_id: number
  amount: number
  pix_key: string
  pix_type: string
  status: string
  admin_notes?: string
  created_at: string
  processed_at?: string
  affiliate_name: string
  affiliate_email: string
  affiliate_username: string
  affiliate_code: string
}

interface ManagerWithdraw {
  id: number
  manager_id: number
  amount: number
  pix_key: string
  pix_type: string
  status: string
  admin_notes?: string
  created_at: string
  processed_at?: string
  manager_name: string
  manager_email: string
  manager_username: string
}

interface SystemSettings {
  min_deposit_amount?: { value: string; description: string; updated_at: string }
  min_withdraw_amount?: { value: string; description: string; updated_at: string }
}

interface AdminStats {
  users: {
    total: number
    blogger_count: number
    active_today: number
    new_this_week: number
    online_now: number
  }
  transactions: {
    total: number
    successful: number
    pending: number
    failed: number
    total_volume: number
    deposits_volume: number
    withdraws_volume: number
    today_transactions: number
    today_volume: number
    detailed_list: Array<{
      id: number
      type: string
      amount: number
      status: string
      external_id?: number
      end_to_end_id?: string
      payer_name?: string
      pix_key?: string
      pix_type?: string
      created_at: string
      updated_at: string
      user: {
        id: number
        name: string
        username?: string
        email: string
        user_type: string
        balance: number
      }
    }>
  }
  games: {
    total_plays: number
    total_spent: number
    total_won: number
    profit_margin: number
    today_plays: number
    today_spent: number
    today_won: number
    games_breakdown: any
  }
  financial: {
    platform_balance: number
    pending_withdraws: number
    available_balance: number
    total_user_balance: number
    daily_revenue: number
    weekly_revenue: number
    monthly_revenue: number
  }
  withdraws: {
    pending_count: number
    pending_amount: number
    processed_today: number
    processed_today_amount: number
  }
  recent_activities: Array<{
    id: number
    type: string
    description: string
    amount: number | null
    user_email: string
    created_at: string
  }>
  performance: {
    avg_deposit_time: number | null
    avg_withdraw_time: number | null
    api_error_rate: string
    system_uptime: string
  }
}

interface AnalyticsData {
  revenue_trend: Array<{
    date: string
    revenue: number
    deposits: number
    withdraws: number
    users: number
  }>
  affiliate_performance: Array<{
    affiliate_name: string
    total_earnings: number
    referrals: number
    conversion_rate: number
    deposits_count: number
  }>
  manager_performance: Array<{
    manager_name: string
    total_earnings: number
    affiliates_count: number
    total_referrals: number
    avg_conversion: number
  }>
  period_comparison: {
    current_period: {
      revenue: number
      users: number
      transactions: number
      affiliates_earnings: number
    }
    previous_period: {
      revenue: number
      users: number
      transactions: number
      affiliates_earnings: number
    }
  }
}

export default function AdminConfigPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState("")
  const [adminToken, setAdminToken] = useState("")
  const [accessLevel, setAccessLevel] = useState<"full" | "managers_only">("full")

  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [affiliateWithdraws, setAffiliateWithdraws] = useState<AffiliateWithdraw[]>([])
  const [managerWithdraws, setManagerWithdraws] = useState<ManagerWithdraw[]>([])
  const [settings, setSettings] = useState<SystemSettings>({})
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateManagerDialogOpen, setIsCreateManagerDialogOpen] = useState(false)
  const [isEditManagerDialogOpen, setIsEditManagerDialogOpen] = useState(false)
  const [processingWithdraw, setProcessingWithdraw] = useState<number | null>(null)
  const [processingManagerWithdraw, setProcessingManagerWithdraw] = useState<number | null>(null)
  const [isAssignManagerDialogOpen, setIsAssignManagerDialogOpen] = useState(false)
  const [selectedAffiliateForManager, setSelectedAffiliateForManager] = useState<Affiliate | null>(null)

  // Push Notifications
  const {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    isEnabled: notificationsEnabled,
    setIsEnabled: setNotificationsEnabled,
    isIOS,
    canUseNotifications,
  } = usePushNotifications()

  // Refs para controlar notificações duplicadas
  const lastPendingWithdrawsCount = useRef(0)
  const lastSuccessfulDepositsCount = useRef(0)
  const notifiedWithdrawIds = useRef(new Set<number>())
  const notifiedDepositIds = useRef(new Set<number>())

  // Filter and search states
  const [affiliateSearchTerm, setAffiliateSearchTerm] = useState("")
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState("all")
  const [affiliateSortBy, setAffiliateSortBy] = useState<keyof Affiliate>("created_at")
  const [affiliateSortOrder, setAffiliateSortOrder] = useState<"asc" | "desc">("desc")
  const [affiliateCurrentPage, setAffiliateCurrentPage] = useState(1)
  const [affiliateItemsPerPage] = useState(10)

  const [managerSearchTerm, setManagerSearchTerm] = useState("")
  const [managerStatusFilter, setManagerStatusFilter] = useState("all")
  const [managerSortBy, setManagerSortBy] = useState<keyof Manager>("created_at")
  const [managerSortOrder, setManagerSortOrder] = useState<"asc" | "desc">("desc")
  const [managerCurrentPage, setManagerCurrentPage] = useState(1)
  const [managerItemsPerPage] = useState(10)

  // Analytics filters
  const [analyticsDateRange, setAnalyticsDateRange] = useState("30")
  const [analyticsPeriod, setAnalyticsPeriod] = useState("daily")

  // Export states
  const [isExporting, setIsExporting] = useState(false)

  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [isAddBalanceDialogOpen, setIsAddBalanceDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [balanceToAdd, setBalanceToAdd] = useState("")
  const [balanceNote, setBalanceNote] = useState("")

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(accessLevel === "managers_only" ? "managers" : "dashboard")

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    username: "",
    affiliate_code: "",
    password: "",
    commission_rate: 10,
    loss_commission_rate: 0,
  })

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    username: "",
    commission_rate: 10,
    loss_commission_rate: 0,
    status: "active",
    password: "",
  })

  // Manager form states
  const [createManagerForm, setCreateManagerForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    commission_rate: 5,
  })

  const [editManagerForm, setEditManagerForm] = useState({
    name: "",
    email: "",
    username: "",
    commission_rate: 5,
    status: "active",
  })

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    min_deposit_amount: "",
    min_withdraw_amount: "",
  })

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Filtered and sorted affiliates
  const filteredAndSortedAffiliates = useMemo(() => {
    const filtered = affiliates.filter((affiliate) => {
      const matchesSearch =
        affiliate.name.toLowerCase().includes(affiliateSearchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(affiliateSearchTerm.toLowerCase()) ||
        affiliate.username.toLowerCase().includes(affiliateSearchTerm.toLowerCase()) ||
        affiliate.affiliate_code.toLowerCase().includes(affiliateSearchTerm.toLowerCase())

      const matchesStatus = affiliateStatusFilter === "all" || affiliate.status === affiliateStatusFilter

      return matchesSearch && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[affiliateSortBy]
      const bValue = b[affiliateSortBy]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return affiliateSortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return affiliateSortOrder === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return filtered
  }, [affiliates, affiliateSearchTerm, affiliateStatusFilter, affiliateSortBy, affiliateSortOrder])

  // Paginated affiliates
  const paginatedAffiliates = useMemo(() => {
    const startIndex = (affiliateCurrentPage - 1) * affiliateItemsPerPage
    return filteredAndSortedAffiliates.slice(startIndex, startIndex + affiliateItemsPerPage)
  }, [filteredAndSortedAffiliates, affiliateCurrentPage, affiliateItemsPerPage])

  const affiliateTotalPages = Math.ceil(filteredAndSortedAffiliates.length / affiliateItemsPerPage)

  // Filtered and sorted managers
  const filteredAndSortedManagers = useMemo(() => {
    const filtered = managers.filter((manager) => {
      const matchesSearch =
        manager.name.toLowerCase().includes(managerSearchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(managerSearchTerm.toLowerCase()) ||
        manager.username.toLowerCase().includes(managerSearchTerm.toLowerCase())

      const matchesStatus = managerStatusFilter === "all" || manager.status === managerStatusFilter

      return matchesSearch && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[managerSortBy]
      const bValue = b[managerSortBy]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return managerSortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return managerSortOrder === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return filtered
  }, [managers, managerSearchTerm, managerStatusFilter, managerSortBy, managerSortOrder])

  // Paginated managers
  const paginatedManagers = useMemo(() => {
    const startIndex = (managerCurrentPage - 1) * managerItemsPerPage
    return filteredAndSortedManagers.slice(startIndex, startIndex + managerItemsPerPage)
  }, [filteredAndSortedManagers, managerCurrentPage, managerItemsPerPage])

  const managerTotalPages = Math.ceil(filteredAndSortedManagers.length / managerItemsPerPage)

  // Listener para cliques em notificações
  useEffect(() => {
    const handleNotificationClick = (event: CustomEvent) => {
      const { section } = event.detail

      if (section === "affiliate-withdraws") {
        setActiveTab("affiliate-withdraws")
      } else if (section === "manager-withdraws") {
        setActiveTab("manager-withdraws")
      } else if (section === "transactions") {
        setActiveTab("transactions")
      }
    }

    window.addEventListener("notification-click", handleNotificationClick as EventListener)

    return () => {
      window.removeEventListener("notification-click", handleNotificationClick as EventListener)
    }
  }, [])

  // Monitorar mudanças para notificações
  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled || permission !== "granted") return

    // Verificar novos saques pendentes
    const currentPendingWithdraws = [
      ...affiliateWithdraws.filter((w) => w.status === "pending"),
      ...managerWithdraws.filter((w) => w.status === "pending"),
    ]

    // Notificar sobre novos saques pendentes
    currentPendingWithdraws.forEach((withdraw) => {
      if (!notifiedWithdrawIds.current.has(withdraw.id)) {
        const isAffiliate = "affiliate_name" in withdraw
        const name = isAffiliate
          ? (withdraw as AffiliateWithdraw).affiliate_name
          : (withdraw as ManagerWithdraw).manager_name
        const type = isAffiliate ? "Afiliado" : "Gerente"

        sendNotification({
          title: `💰 Novo Saque Pendente - ${type}`,
          body: `${name} solicitou saque de ${formatCurrency(withdraw.amount)}`,
          tag: `withdraw-${withdraw.id}`,
          data: {
            section: isAffiliate ? "affiliate-withdraws" : "manager-withdraws",
            withdrawId: withdraw.id,
            type: "withdraw",
          },
        })

        notifiedWithdrawIds.current.add(withdraw.id)
      }
    })

    // Limpar IDs de saques que não estão mais pendentes
    const currentPendingIds = new Set(currentPendingWithdraws.map((w) => w.id))
    notifiedWithdrawIds.current = new Set([...notifiedWithdrawIds.current].filter((id) => currentPendingIds.has(id)))
  }, [affiliateWithdraws, managerWithdraws, isAuthenticated, notificationsEnabled, permission, sendNotification])

  // Monitorar novos depósitos bem-sucedidos
  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled || permission !== "granted" || !stats) return

    const recentSuccessfulDeposits =
      stats.transactions.detailed_list?.filter(
        (t) =>
          t.type === "deposit" &&
          t.status === "success" &&
          t.external_id &&
          new Date(t.created_at).getTime() > Date.now() - 5 * 60 * 1000, // Últimos 5 minutos
      ) || []

    // Notificar sobre novos depósitos
    recentSuccessfulDeposits.forEach((deposit) => {
      if (!notifiedDepositIds.current.has(deposit.id)) {
        sendNotification({
          title: `💳 Novo Depósito Confirmado`,
          body: `${deposit.user.name} depositou ${formatCurrency(deposit.amount)}`,
          tag: `deposit-${deposit.id}`,
          data: {
            section: "transactions",
            transactionId: deposit.id,
            type: "deposit",
          },
        })

        notifiedDepositIds.current.add(deposit.id)
      }
    })

    // Limpar IDs antigos (manter apenas dos últimos 30 minutos)
    const cutoffTime = Date.now() - 30 * 60 * 1000
    const recentDepositIds = new Set(
      stats.transactions.detailed_list?.filter((t) => new Date(t.created_at).getTime() > cutoffTime).map((t) => t.id) ||
        [],
    )

    notifiedDepositIds.current = new Set([...notifiedDepositIds.current].filter((id) => recentDepositIds.has(id)))
  }, [stats, isAuthenticated, notificationsEnabled, permission, sendNotification])

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setAuthError("")

    console.log("🔐 Tentando autenticar com senha:", password.substring(0, 3) + "...")

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      console.log("📡 Resposta da API:", response.status)

      const data = await response.json()
      console.log("📊 Dados da resposta:", data)

      if (response.ok && data.success) {
        console.log("✅ Autenticação bem-sucedida!")
        setIsAuthenticated(true)
        setAccessLevel(data.accessLevel || "full")
        setAdminToken(data.token || "admin-authenticated")
        setActiveTab(data.accessLevel === "managers_only" ? "managers" : "dashboard")

        if (data.accessLevel === "managers_only") {
          toast.success("Acesso autorizado - Painel de Gerentes")
        } else {
          toast.success("Acesso autorizado!")
        }
      } else {
        console.log("❌ Falha na autenticação:", data.error)
        setAuthError(data.error || "Senha incorreta")
        toast.error(data.error || "Senha incorreta")
      }
    } catch (error) {
      console.error("❌ Erro na requisição de autenticação:", error)
      setAuthError("Erro de conexão com o servidor")
      toast.error("Erro de conexão com o servidor")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleRequestNotificationPermission = async () => {
    console.log("🔔 Iniciando processo de ativação de notificações...")
    console.log("🔔 Estado atual - isSupported:", isSupported, "permission:", permission, "isIOS:", isIOS)

    if (!isSupported) {
      if (isIOS) {
        toast.error("Notificações web não são suportadas no iOS Safari. Use o Chrome ou Firefox no iOS 16.4+")
      } else {
        toast.error("Seu navegador não suporta notificações")
      }
      return
    }

    try {
      const result = await requestPermission()
      console.log("🔔 Resultado final:", result)

      if (result === "granted") {
        toast.success("Notificações ativadas com sucesso!")

        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          console.log("🔔 Enviando notificação de teste...")
          sendNotification({
            title: "🎉 Notificações Ativadas!",
            body: "Você receberá alertas sobre saques pendentes e depósitos confirmados",
            tag: "test-notification",
            data: {
              section: "dashboard",
              type: "test",
            },
          })
        }, 500)
      } else if (result === "denied") {
        if (isIOS) {
          toast.error("Permissão negada. No iOS, verifique as configurações do Safari > Notificações")
        } else {
          toast.error("Permissão para notificações negada. Verifique as configurações do seu navegador.")
        }
      } else {
        toast.warning("Permissão para notificações não concedida")
      }
    } catch (error) {
      console.error("❌ Erro no processo de ativação:", error)
      toast.error("Erro ao ativar notificações")
    }
  }

  // Função para testar notificação manualmente
  const handleTestNotification = () => {
    console.log("🔔 Testando notificação manualmente...")
    sendNotification({
      title: "🧪 Teste de Notificação",
      body: "Esta é uma notificação de teste do painel administrativo",
      tag: "manual-test",
      data: {
        section: "dashboard",
        type: "manual-test",
      },
    })
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAffiliates()
      fetchManagers()
      fetchAffiliateWithdraws()
      fetchManagerWithdraws()
      fetchSettings()
      fetchStats()
      fetchAnalytics()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return

    const interval = setInterval(async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchAffiliateWithdraws(),
          fetchManagerWithdraws(),
          fetchAffiliates(),
          fetchManagers(),
          fetchAnalytics(),
        ])
        setLastUpdate(new Date())
      } catch (error) {
        console.error("Erro no auto-refresh:", error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, autoRefresh])

  const fetchAffiliates = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/affiliates/list", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Dados dos afiliados:", data)
        setAffiliates(data.affiliates || [])
      } else {
        console.error("❌ Erro na resposta dos afiliados:", response.status)
        toast.error("Erro ao carregar afiliados")
      }
    } catch (error) {
      console.error("Erro ao buscar afiliados:", error)
      toast.error("Erro ao carregar afiliados")
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/managers/list", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Dados dos gerentes:", data)
        setManagers(data.managers || [])
      } else {
        console.error("❌ Erro na resposta dos gerentes:", response.status)
        toast.error("Erro ao carregar gerentes")
      }
    } catch (error) {
      console.error("Erro ao buscar gerentes:", error)
      toast.error("Erro ao carregar gerentes")
    }
  }

  const fetchAffiliateWithdraws = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/affiliate-withdraws/list", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setAffiliateWithdraws(data.withdraws || [])
      }
    } catch (error) {
      console.error("Erro ao buscar saques de afiliados:", error)
      toast.error("Erro ao carregar saques de afiliados")
    }
  }

  const fetchManagerWithdraws = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/manager-withdraws/list", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setManagerWithdraws(data.withdraws || [])
      }
    } catch (error) {
      console.error("Erro ao buscar saques de gerentes:", error)
      toast.error("Erro ao carregar saques de gerentes")
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/settings", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSettingsForm({
          min_deposit_amount: data.settings.min_deposit_amount?.value || "",
          min_withdraw_amount: data.settings.min_withdraw_amount?.value || "",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/config/stats", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest(
        `/api/admin/analytics?days=${analyticsDateRange}&period=${analyticsPeriod}`,
        {
          headers: { "X-Admin-Token": adminToken },
        },
      )
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error("Erro ao buscar analytics:", error)
    }
  }

  const handleExportData = async (type: "affiliates" | "managers" | "transactions" | "commissions") => {
    setIsExporting(true)
    try {
      const response = await AuthClient.makeAuthenticatedRequest(`/api/admin/export/${type}`, {
        headers: { "X-Admin-Token": adminToken },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Dados de ${type} exportados com sucesso!`)
      } else {
        toast.error("Erro ao exportar dados")
      }
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar dados")
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/affiliates/create", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        toast.success("Afiliado criado com sucesso!")
        setIsCreateDialogOpen(false)
        setCreateForm({
          name: "",
          email: "",
          username: "",
          affiliate_code: "",
          password: "",
          commission_rate: 10,
          loss_commission_rate: 0,
        })
        fetchAffiliates()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar afiliado")
      }
    } catch (error) {
      console.error("Erro ao criar afiliado:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/managers/create", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify(createManagerForm),
      })

      if (response.ok) {
        toast.success("Gerente criado com sucesso!")
        setIsCreateManagerDialogOpen(false)
        setCreateManagerForm({
          name: "",
          email: "",
          username: "",
          password: "",
          commission_rate: 5,
        })
        fetchManagers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar gerente")
      }
    } catch (error) {
      console.error("Erro ao criar gerente:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleEditAffiliate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAffiliate) return

    try {
      const response = await AuthClient.makeAuthenticatedRequest(
        `/api/admin/affiliates/${editingAffiliate.id}/update`,
        {
          method: "PUT",
          headers: { "X-Admin-Token": adminToken },
          body: JSON.stringify(editForm),
        },
      )

      if (response.ok) {
        toast.success("Afiliado atualizado com sucesso!")
        setIsEditDialogOpen(false)
        setEditingAffiliate(null)
        fetchAffiliates()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar afiliado")
      }
    } catch (error) {
      console.error("Erro ao atualizar afiliado:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleEditManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingManager) return

    try {
      const response = await AuthClient.makeAuthenticatedRequest(`/api/admin/managers/${editingManager.id}/update`, {
        method: "PUT",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify(editManagerForm),
      })

      if (response.ok) {
        toast.success("Gerente atualizado com sucesso!")
        setIsEditManagerDialogOpen(false)
        setEditingManager(null)
        fetchManagers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar gerente")
      }
    } catch (error) {
      console.error("Erro ao atualizar gerente:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleDeleteAffiliate = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este afiliado?")) return

    console.log("🗑️ Iniciando exclusão do afiliado ID:", id)

    try {
      const response = await AuthClient.makeAuthenticatedRequest(`/api/admin/affiliates/${id}/delete`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      })

      console.log("📡 Resposta da exclusão:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Afiliado excluído:", data)
        toast.success("Afiliado excluído com sucesso!")
        fetchAffiliates()
      } else {
        const error = await response.json()
        console.error("❌ Erro na exclusão:", error)
        toast.error(error.error || "Erro ao excluir afiliado")
      }
    } catch (error) {
      console.error("❌ Erro ao excluir afiliado:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleDeleteManager = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este gerente?")) return

    try {
      const response = await AuthClient.makeAuthenticatedRequest(`/api/admin/managers/${id}/delete`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Gerente excluído com sucesso!")
        fetchManagers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir gerente")
      }
    } catch (error) {
      console.error("Erro ao excluir gerente:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleAssignManager = async (affiliateId: number, managerId: number | null) => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/affiliates/assign-manager", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify({
          affiliate_id: affiliateId,
          manager_id: managerId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchAffiliates()
        fetchManagers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao vincular afiliado")
      }
    } catch (error) {
      console.error("Erro ao vincular afiliado:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const handleProcessWithdraw = async (withdrawId: number, action: "approve" | "reject", adminNotes?: string) => {
    setProcessingWithdraw(withdrawId)

    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/affiliate-withdraws/process", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify({
          withdraw_id: withdrawId,
          action,
          admin_notes: adminNotes || "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchAffiliateWithdraws()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao processar saque")
      }
    } catch (error) {
      console.error("Erro ao processar saque:", error)
      toast.error("Erro interno do servidor")
    } finally {
      setProcessingWithdraw(null)
    }
  }

  const handleProcessManagerWithdraw = async (
    withdrawId: number,
    action: "approve" | "reject",
    adminNotes?: string,
  ) => {
    setProcessingManagerWithdraw(withdrawId)

    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/manager-withdraws/process", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify({
          withdraw_id: withdrawId,
          action,
          admin_notes: adminNotes || "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchManagerWithdraws()
        fetchManagers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao processar saque")
      }
    } catch (error) {
      console.error("Erro ao processar saque:", error)
      toast.error("Erro interno do servidor")
    } finally {
      setProcessingManagerWithdraw(null)
    }
  }

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/settings", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
        body: JSON.stringify({ setting_key: key, setting_value: value }),
      })

      if (response.ok) {
        toast.success("Configuração atualizada com sucesso!")
        fetchSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar configuração")
      }
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error)
      toast.error("Erro interno do servidor")
    }
  }

  const openEditDialog = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate)
    setEditForm({
      name: affiliate.name,
      email: affiliate.email,
      username: affiliate.username,
      commission_rate: affiliate.commission_rate,
      loss_commission_rate: affiliate.loss_commission_rate,
      status: affiliate.status,
      password: "",
    })
    setIsEditDialogOpen(true)
  }

  const openEditManagerDialog = (manager: Manager) => {
    setEditingManager(manager)
    setEditManagerForm({
      name: manager.name,
      email: manager.email,
      username: manager.username,
      commission_rate: manager.commission_rate,
      status: manager.status,
    })
    setIsEditManagerDialogOpen(true)
  }

  const openAssignManagerDialog = (affiliate: Affiliate) => {
    setSelectedAffiliateForManager(affiliate)
    setIsAssignManagerDialogOpen(true)
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
      success: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Sucesso" },
      pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock, label: "Pendente" },
      failed: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Falhou" },
      cancelled: { color: "bg-gray-500/20 text-gray-400", icon: XCircle, label: "Cancelado" },
      approved: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Aprovado" },
      rejected: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Rejeitado" },
      active: { color: "bg-green-500/20 text-green-400", icon: CheckCircle, label: "Ativo" },
      inactive: { color: "bg-red-500/20 text-red-400", icon: XCircle, label: "Inativo" },
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

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      deposit: { color: "bg-green-500/20 text-green-400", label: "Depósito" },
      withdraw: { color: "bg-red-500/20 text-red-400", label: "Saque" },
      game_play: { color: "bg-blue-500/20 text-blue-400", label: "Jogo" },
      game_prize: { color: "bg-purple-500/20 text-purple-400", label: "Prêmio" },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || { color: "bg-gray-500/20 text-gray-400", label: type }

    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleManualRefresh = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchAffiliateWithdraws(),
        fetchManagerWithdraws(),
        fetchAffiliates(),
        fetchManagers(),
        fetchSettings(),
        fetchAnalytics(),
      ])
      setLastUpdate(new Date())
      toast.success("Dados atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      toast.error("Erro ao atualizar alguns dados")
    } finally {
      setIsLoading(false)
    }
  }

  // Mobile Card Component for Tables
  const MobileCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 ${className}`}>{children}</div>
  )

  // Pagination Component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    itemsPerPage: number
    totalItems: number
  }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-700">
      <div className="text-sm text-gray-400">
        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de{" "}
        {totalItems} resultados
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-white">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Sort Header Component
  const SortableHeader = ({
    label,
    sortKey,
    currentSortBy,
    currentSortOrder,
    onSort,
  }: {
    label: string
    sortKey: string
    currentSortBy: string
    currentSortOrder: "asc" | "desc"
    onSort: (key: string) => void
  }) => (
    <TableHead
      className="text-gray-400 cursor-pointer hover:text-white transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown className="h-3 w-3" />
        {currentSortBy === sortKey && <span className="text-xs">{currentSortOrder === "asc" ? "↑" : "↓"}</span>}
      </div>
    </TableHead>
  )

  // Navigation tabs for mobile
  const navigationTabs = [
    ...(accessLevel === "full"
      ? [
          { id: "dashboard", label: "Dashboard", icon: BarChart3 },
          { id: "analytics", label: "Analytics", icon: TrendingUp },
          { id: "transactions", label: "Transações", icon: CreditCard },
          { id: "affiliates", label: "Afiliados", icon: Users },
        ]
      : []),
    { id: "managers", label: "Gerentes", icon: UserCog },
    ...(accessLevel === "full"
      ? [
          { id: "affiliate-withdraws", label: "Saques Afiliados", icon: Wallet },
          { id: "manager-withdraws", label: "Saques Gerentes", icon: DollarSign },
          { id: "reports", label: "Relatórios", icon: FileText },
          { id: "settings", label: "Configurações", icon: Settings },
          { id: "performance", label: "Desempenho", icon: Zap },
        ]
      : []),
  ]

  // Tela de autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-white">Acesso Administrativo</CardTitle>
            <CardDescription>Digite a senha para acessar o painel administrativo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Digite a senha administrativa"
                  required
                />
                {authError && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? "Verificando..." : "Acessar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900/50 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {accessLevel === "managers_only" ? "Painel de Gerentes" : "Admin Panel"}
            </h1>
            <p className="text-sm text-gray-400">
              {navigationTabs.find((tab) => tab.id === activeTab)?.label || "Dashboard"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/95 border-b border-slate-700 p-4">
          <div className="grid grid-cols-2 gap-2">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`justify-start text-left h-auto p-3 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-slate-800"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs">{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {accessLevel === "managers_only" ? "Painel de Gerentes" : "Painel Administrativo"}
          </h1>
          <p className="text-gray-400">
            {accessLevel === "managers_only"
              ? "Gerencie gerentes e monitore suas atividades"
              : "Gerencie afiliados, gerentes, configurações e monitore estatísticas da plataforma"}
          </p>
        </div>

        {/* Refresh Controls and Notifications */}
        <div className="space-y-4 mb-6">
          {/* Mobile Notification Controls - Sempre visível */}
          <Card className="bg-slate-900/50 border-slate-700 lg:hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium flex items-center space-x-2">
                    <span>Notificações Push</span>
                    {isIOS && <Smartphone className="h-4 w-4 text-orange-400" />}
                  </span>
                  {isSupported && permission === "granted" ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      {notificationsEnabled ? (
                        <Bell className="h-4 w-4 text-blue-400" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestNotificationPermission}
                      className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                      disabled={!canUseNotifications}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {canUseNotifications ? "Ativar" : "Não Suportado"}
                    </Button>
                  )}
                </div>
                {/* Botão de teste para mobile */}
                {permission === "granted" && notificationsEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    className="w-full border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                  >
                    🧪 Testar Notificação
                  </Button>
                )}
                <div className="text-xs text-gray-400">
                  {isIOS && !canUseNotifications ? (
                    <div className="flex items-start space-x-2">
                      <Info className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>iOS detectado - Notificações web requerem iOS 16.4+ no Safari ou use Chrome/Firefox</span>
                    </div>
                  ) : permission === "granted" && notificationsEnabled ? (
                    "Você será notificado sobre saques e depósitos"
                  ) : permission === "denied" ? (
                    "Notificações bloqueadas - ative nas configurações do navegador"
                  ) : (
                    "Clique para ativar notificações"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Controls */}
          <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-400" : "bg-gray-400"}`} />
                <span className="text-sm text-gray-400">Auto-refresh: {autoRefresh ? "Ativo" : "Inativo"}</span>
              </div>
              <div className="text-sm text-gray-500">Última: {lastUpdate.toLocaleTimeString("pt-BR")}</div>

              {/* Notification Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${notificationsEnabled && permission === "granted" ? "bg-blue-400" : "bg-gray-400"}`}
                />
                <span className="text-sm text-gray-400 flex items-center space-x-1">
                  <span>Notificações: {notificationsEnabled && permission === "granted" ? "Ativas" : "Inativas"}</span>
                  {isIOS && <Smartphone className="h-3 w-3 text-orange-400" />}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Notification Controls */}
              {isSupported && (
                <div className="flex items-center space-x-2">
                  {permission === "granted" ? (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      {notificationsEnabled ? (
                        <Bell className="h-4 w-4 text-blue-400" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                      {/* Botão de teste para desktop */}
                      {notificationsEnabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestNotification}
                          className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                        >
                          🧪 Teste
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestNotificationPermission}
                      className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none bg-transparent"
                      disabled={!canUseNotifications}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {canUseNotifications ? "Ativar Notificações" : "Não Suportado"}
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none"
              >
                {autoRefresh ? "Pausar" : "Ativar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="border-slate-600 text-white hover:bg-slate-700 bg-transparent flex-1 sm:flex-none"
              >
                <Activity className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>

          {/* Mobile Refresh Controls */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg lg:hidden">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-400" : "bg-gray-400"}`} />
              <span className="text-sm text-gray-400">
                {autoRefresh ? "Auto-refresh ativo" : "Auto-refresh pausado"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {autoRefresh ? "Pausar" : "Ativar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
              >
                <Activity className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* iOS Warning Card */}
          {isIOS && !canUseNotifications && (
            <Card className="bg-orange-900/20 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-orange-400 font-medium mb-1">iOS Detectado</h3>
                    <p className="text-orange-300 text-sm">
                      Notificações web no iOS Safari requerem iOS 16.4 ou superior. Para melhor compatibilidade, use
                      Chrome ou Firefox no iOS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tab List */}
          <div className="hidden lg:block">
            <TabsList className="bg-slate-800 border-slate-700 w-full grid grid-cols-9 h-auto">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-slate-700 p-3">
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {stats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Usuários Online</p>
                          <p className="text-2xl font-bold text-green-400">{stats.users.online_now}</p>
                          <p className="text-xs text-gray-500">Última hora</p>
                        </div>
                        <Eye className="h-8 w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Receita Hoje</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {formatCurrency(stats.financial.daily_revenue)}
                          </p>
                          <p className="text-xs text-gray-500">Lucro dos jogos</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Transações Hoje</p>
                          <p className="text-2xl font-bold text-purple-400">{stats.transactions.today_transactions}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(stats.transactions.today_volume)}</p>
                        </div>
                        <Activity className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Saques Pendentes</p>
                          <p className="text-2xl font-bold text-yellow-400">{stats.withdraws.pending_count}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(stats.withdraws.pending_amount)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial and Revenue Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-green-400" />
                        <span>Situação Financeira</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Saldo da Plataforma</span>
                        <span className="text-green-400 font-bold">
                          {formatCurrency(stats.financial.platform_balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Saldo dos Usuários</span>
                        <span className="text-blue-400 font-bold">
                          {formatCurrency(stats.financial.total_user_balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Saques Pendentes</span>
                        <span className="text-yellow-400 font-bold">
                          {formatCurrency(stats.financial.pending_withdraws)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                        <span className="text-gray-300 font-medium">Saldo Disponível</span>
                        <span className="text-white font-bold text-lg">
                          {formatCurrency(stats.financial.available_balance)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-purple-400" />
                        <span>Receitas por Período</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Hoje</span>
                        <span className="text-green-400 font-bold">
                          {formatCurrency(stats.financial.daily_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Esta Semana</span>
                        <span className="text-blue-400 font-bold">
                          {formatCurrency(stats.financial.weekly_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Este Mês</span>
                        <span className="text-purple-400 font-bold">
                          {formatCurrency(stats.financial.monthly_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                        <span className="text-gray-300 font-medium">Margem de Lucro</span>
                        <span className="text-white font-bold text-lg">{stats.games.profit_margin.toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Users and Games Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        <span>Usuários</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total de Usuários</span>
                        <span className="text-blue-400 font-bold">{stats.users.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Ativos Hoje</span>
                        <span className="text-green-400 font-bold">{stats.users.active_today}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Novos esta Semana</span>
                        <span className="text-purple-400 font-bold">{stats.users.new_this_week}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Bloggers</span>
                        <span className="text-yellow-400 font-bold">{stats.users.blogger_count}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Gamepad2 className="h-5 w-5 text-green-400" />
                        <span>Jogos Hoje</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Jogadas</span>
                        <span className="text-green-400 font-bold">{stats.games.today_plays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Apostado</span>
                        <span className="text-red-400 font-bold">{formatCurrency(stats.games.today_spent)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Pago em Prêmios</span>
                        <span className="text-yellow-400 font-bold">{formatCurrency(stats.games.today_won)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                        <span className="text-gray-300 font-medium">Lucro Hoje</span>
                        <span className="text-white font-bold text-lg">
                          {formatCurrency(stats.games.today_spent - stats.games.today_won)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      <span>Atividades Recentes (24h)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stats.recent_activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                activity.type === "deposit"
                                  ? "bg-green-400"
                                  : activity.type === "withdraw"
                                    ? "bg-red-400"
                                    : activity.type === "game"
                                      ? "bg-blue-400"
                                      : "bg-gray-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm truncate">{activity.description}</p>
                              <p className="text-gray-400 text-xs truncate">{activity.user_email}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            {activity.amount && (
                              <p className="text-white font-medium text-sm">{formatCurrency(activity.amount)}</p>
                            )}
                            <p className="text-gray-400 text-xs">{formatDate(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Outras tabs seriam renderizadas aqui... */}
          <TabsContent value="settings" className="space-y-6">
            <div className="text-center text-gray-400 py-8">
              <p>Conteúdo das outras tabs será renderizado aqui...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
