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
    const result = await requestPermission()

    if (result === "granted") {
      toast.success("Notificações ativadas com sucesso!")

      // Enviar notificação de teste
      sendNotification({
        title: "🎉 Notificações Ativadas!",
        body: "Você receberá alertas sobre saques pendentes e depósitos confirmados",
        tag: "test-notification",
        data: {
          section: "dashboard",
          type: "test",
        },
      })
    } else if (result === "denied") {
      toast.error("Permissão para notificações negada")
    } else {
      toast.warning("Permissão para notificações não concedida")
    }
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
                  <span className="text-white font-medium">Notificações Push</span>
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
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Ativar
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {permission === "granted" && notificationsEnabled
                    ? "Você será notificado sobre saques e depósitos"
                    : permission === "denied"
                      ? "Notificações bloqueadas - ative nas configurações do navegador"
                      : "Clique para ativar notificações"}
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
                <span className="text-sm text-gray-400">
                  Notificações: {notificationsEnabled && permission === "granted" ? "Ativas" : "Inativas"}
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
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestNotificationPermission}
                      className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none bg-transparent"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Ativar Notificações
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

          {/* Analytics Tab */}
          {accessLevel === "full" && (
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Analytics</h2>
                  <p className="text-gray-400">Análise detalhada de performance e tendências</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={analyticsDateRange}
                    onChange={(e) => setAnalyticsDateRange(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white rounded px-3 py-2 text-sm flex-1 sm:flex-none"
                  >
                    <option value="7">7 dias</option>
                    <option value="30">30 dias</option>
                    <option value="90">90 dias</option>
                  </select>
                  <select
                    value={analyticsPeriod}
                    onChange={(e) => setAnalyticsPeriod(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white rounded px-3 py-2 text-sm flex-1 sm:flex-none"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                  <Button
                    onClick={fetchAnalytics}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex-1 sm:flex-none"
                  >
                    Atualizar
                  </Button>
                </div>
              </div>

              {analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Period Comparison */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Comparação de Períodos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Período Atual</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Receita</span>
                              <span className="text-green-400 font-bold">
                                {formatCurrency(analyticsData.period_comparison.current_period.revenue)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Usuários</span>
                              <span className="text-blue-400 font-bold">
                                {analyticsData.period_comparison.current_period.users}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Transações</span>
                              <span className="text-purple-400 font-bold">
                                {analyticsData.period_comparison.current_period.transactions}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Período Anterior</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Receita</span>
                              <span className="text-gray-400 font-bold">
                                {formatCurrency(analyticsData.period_comparison.previous_period.revenue)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Usuários</span>
                              <span className="text-gray-400 font-bold">
                                {analyticsData.period_comparison.previous_period.users}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Transações</span>
                              <span className="text-gray-400 font-bold">
                                {analyticsData.period_comparison.previous_period.transactions}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Affiliates */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Top Afiliados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {analyticsData.affiliate_performance.slice(0, 10).map((affiliate, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                            <div>
                              <p className="text-white text-sm font-medium">{affiliate.affiliate_name}</p>
                              <p className="text-gray-400 text-xs">
                                {affiliate.referrals} referrals • {affiliate.conversion_rate.toFixed(1)}% conversão
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-400 font-bold text-sm">
                                {formatCurrency(affiliate.total_earnings)}
                              </p>
                              <p className="text-gray-400 text-xs">{affiliate.deposits_count} depósitos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Managers */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Top Gerentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {analyticsData.manager_performance.slice(0, 10).map((manager, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                            <div>
                              <p className="text-white text-sm font-medium">{manager.manager_name}</p>
                              <p className="text-gray-400 text-xs">
                                {manager.affiliates_count} afiliados • {manager.total_referrals} referrals
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-400 font-bold text-sm">
                                {formatCurrency(manager.total_earnings)}
                              </p>
                              <p className="text-gray-400 text-xs">{manager.avg_conversion.toFixed(1)}% conversão</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue Trend Chart */}
                  <Card className="bg-slate-900/50 border-slate-700 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-white">Tendência de Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        <p>Gráfico de tendência de receita seria renderizado aqui</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* Transactions Tab */}
          {accessLevel === "full" && (
            <TabsContent value="transactions" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Transações</h2>
                  <p className="text-gray-400">Monitore todas as transações da plataforma</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleExportData("transactions")}
                    disabled={isExporting}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 sm:flex-none"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </div>
              </div>

              {stats && (
                <div className="space-y-6">
                  {/* Transaction Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-2xl font-bold text-white">{stats.transactions.total}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Bem-sucedidas</p>
                            <p className="text-2xl font-bold text-green-400">{stats.transactions.successful}</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Pendentes</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.transactions.pending}</p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Falharam</p>
                            <p className="text-2xl font-bold text-red-400">{stats.transactions.failed}</p>
                          </div>
                          <XCircle className="h-8 w-8 text-red-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Transactions */}
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">Transações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Desktop Table */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left text-gray-400 p-2">ID</th>
                              <th className="text-left text-gray-400 p-2">Usuário</th>
                              <th className="text-left text-gray-400 p-2">Tipo</th>
                              <th className="text-left text-gray-400 p-2">Valor</th>
                              <th className="text-left text-gray-400 p-2">Status</th>
                              <th className="text-left text-gray-400 p-2">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.transactions.detailed_list.slice(0, 20).map((transaction) => (
                              <tr key={transaction.id} className="border-b border-slate-800">
                                <td className="p-2 text-white">#{transaction.id}</td>
                                <td className="p-2">
                                  <div>
                                    <p className="text-white text-sm">{transaction.user.name}</p>
                                    <p className="text-gray-400 text-xs">{transaction.user.email}</p>
                                  </div>
                                </td>
                                <td className="p-2">{getTypeBadge(transaction.type)}</td>
                                <td className="p-2 text-white font-medium">{formatCurrency(transaction.amount)}</td>
                                <td className="p-2">{getStatusBadge(transaction.status)}</td>
                                <td className="p-2 text-gray-400 text-sm">{formatDate(transaction.created_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="lg:hidden space-y-4">
                        {stats.transactions.detailed_list.slice(0, 10).map((transaction) => (
                          <MobileCard key={transaction.id}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">#{transaction.id}</span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Usuário:</span>
                                <span className="text-white">{transaction.user.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Tipo:</span>
                                {getTypeBadge(transaction.type)}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Valor:</span>
                                <span className="text-white font-medium">{formatCurrency(transaction.amount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Data:</span>
                                <span className="text-gray-300">{formatDate(transaction.created_at)}</span>
                              </div>
                            </div>
                          </MobileCard>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* Affiliates Tab */}
          {accessLevel === "full" && (
            <TabsContent value="affiliates" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Afiliados</h2>
                  <p className="text-gray-400">Gerencie afiliados e suas comissões</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 sm:flex-none"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Criar Afiliado
                  </Button>
                  <Button
                    onClick={() => handleExportData("affiliates")}
                    disabled={isExporting}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-1 sm:flex-none"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar"}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-gray-400">Buscar</Label>
                      <Input
                        placeholder="Nome, email, username..."
                        value={affiliateSearchTerm}
                        onChange={(e) => setAffiliateSearchTerm(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400">Status</Label>
                      <select
                        value={affiliateStatusFilter}
                        onChange={(e) => setAffiliateStatusFilter(e.target.value)}
                        className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-400">Ordenar por</Label>
                      <select
                        value={affiliateSortBy}
                        onChange={(e) => setAffiliateSortBy(e.target.value as keyof Affiliate)}
                        className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                      >
                        <option value="created_at">Data de Criação</option>
                        <option value="name">Nome</option>
                        <option value="total_earnings">Ganhos Totais</option>
                        <option value="commission_rate">Taxa de Comissão</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-400">Ordem</Label>
                      <select
                        value={affiliateSortOrder}
                        onChange={(e) => setAffiliateSortOrder(e.target.value as "asc" | "desc")}
                        className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                      >
                        <option value="desc">Decrescente</option>
                        <option value="asc">Crescente</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affiliates Table */}
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Afiliados ({filteredAndSortedAffiliates.length} de {affiliates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <SortableHeader
                            label="Nome"
                            sortKey="name"
                            currentSortBy={affiliateSortBy}
                            currentSortOrder={affiliateSortOrder}
                            onSort={(key) => {
                              if (affiliateSortBy === key) {
                                setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                              } else {
                                setAffiliateSortBy(key as keyof Affiliate)
                                setAffiliateSortOrder("desc")
                              }
                            }}
                          />
                          <th className="text-left text-gray-400 p-3">Código</th>
                          <th className="text-left text-gray-400 p-3">Comissão</th>
                          <th className="text-left text-gray-400 p-3">Ganhos</th>
                          <th className="text-left text-gray-400 p-3">Referrals</th>
                          <th className="text-left text-gray-400 p-3">Status</th>
                          <th className="text-left text-gray-400 p-3">Gerente</th>
                          <th className="text-left text-gray-400 p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAffiliates.map((affiliate) => (
                          <tr key={affiliate.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-medium">{affiliate.name}</p>
                                <p className="text-gray-400 text-sm">{affiliate.email}</p>
                                <p className="text-gray-500 text-xs">@{affiliate.username}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className="bg-blue-500/20 text-blue-400">{affiliate.affiliate_code}</Badge>
                            </td>
                            <td className="p-3 text-white">
                              <div>
                                <p>{affiliate.commission_rate}%</p>
                                {affiliate.loss_commission_rate > 0 && (
                                  <p className="text-xs text-gray-400">Perda: {affiliate.loss_commission_rate}%</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="text-green-400 font-bold">{formatCurrency(affiliate.total_earnings)}</p>
                                <p className="text-gray-400 text-xs">Saldo: {formatCurrency(affiliate.balance)}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="text-white">{affiliate.total_referrals || 0}</p>
                                <p className="text-gray-400 text-xs">{affiliate.deposits_count || 0} depósitos</p>
                              </div>
                            </td>
                            <td className="p-3">{getStatusBadge(affiliate.status)}</td>
                            <td className="p-3">
                              {affiliate.manager_name ? (
                                <div>
                                  <p className="text-white text-sm">{affiliate.manager_name}</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openAssignManagerDialog(affiliate)}
                                    className="text-xs text-gray-400 hover:text-white p-0 h-auto"
                                  >
                                    Alterar
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAssignManagerDialog(affiliate)}
                                  className="border-slate-600 text-white hover:bg-slate-700 text-xs"
                                >
                                  Vincular
                                </Button>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(affiliate)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAffiliate(affiliate.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  Excluir
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden p-4 space-y-4">
                    {paginatedAffiliates.map((affiliate) => (
                      <MobileCard key={affiliate.id}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{affiliate.name}</p>
                            <p className="text-gray-400 text-sm">{affiliate.email}</p>
                          </div>
                          {getStatusBadge(affiliate.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Código:</span>
                            <Badge className="bg-blue-500/20 text-blue-400">{affiliate.affiliate_code}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Comissão:</span>
                            <span className="text-white">{affiliate.commission_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ganhos:</span>
                            <span className="text-green-400 font-bold">{formatCurrency(affiliate.total_earnings)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Referrals:</span>
                            <span className="text-white">{affiliate.total_referrals || 0}</span>
                          </div>
                          {affiliate.manager_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Gerente:</span>
                              <span className="text-white">{affiliate.manager_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-700">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(affiliate)}
                            className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignManagerDialog(affiliate)}
                            className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          >
                            {affiliate.manager_name ? "Alterar Gerente" : "Vincular Gerente"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAffiliate(affiliate.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            Excluir
                          </Button>
                        </div>
                      </MobileCard>
                    ))}
                  </div>

                  {/* Pagination */}
                  <PaginationControls
                    currentPage={affiliateCurrentPage}
                    totalPages={affiliateTotalPages}
                    onPageChange={setAffiliateCurrentPage}
                    itemsPerPage={affiliateItemsPerPage}
                    totalItems={filteredAndSortedAffiliates.length}
                  />
                </CardContent>
              </Card>

              {/* Create Affiliate Dialog */}
              {isCreateDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-white">Criar Novo Afiliado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateAffiliate} className="space-y-4">
                        <div>
                          <Label className="text-gray-400">Nome</Label>
                          <Input
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Email</Label>
                          <Input
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Username</Label>
                          <Input
                            value={createForm.username}
                            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Código do Afiliado</Label>
                          <Input
                            value={createForm.affiliate_code}
                            onChange={(e) => setCreateForm({ ...createForm, affiliate_code: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Senha</Label>
                          <Input
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Taxa de Comissão (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={createForm.commission_rate}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, commission_rate: Number.parseFloat(e.target.value) })
                            }
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Taxa de Comissão por Perda (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={createForm.loss_commission_rate}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, loss_commission_rate: Number.parseFloat(e.target.value) })
                            }
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1"
                          >
                            Criar Afiliado
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Edit Affiliate Dialog */}
              {isEditDialogOpen && editingAffiliate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-white">Editar Afiliado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleEditAffiliate} className="space-y-4">
                        <div>
                          <Label className="text-gray-400">Nome</Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Email</Label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Username</Label>
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Taxa de Comissão (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editForm.commission_rate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, commission_rate: Number.parseFloat(e.target.value) })
                            }
                            className="bg-slate-800 border-slate-600 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Taxa de Comissão por Perda (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editForm.loss_commission_rate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, loss_commission_rate: Number.parseFloat(e.target.value) })
                            }
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Status</Label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                          >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-gray-400">Nova Senha (deixe em branco para manter)</Label>
                          <Input
                            type="password"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            className="bg-slate-800 border-slate-600 text-white"
                            placeholder="Digite nova senha ou deixe em branco"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-1"
                          >
                            Salvar Alterações
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditDialogOpen(false)
                              setEditingAffiliate(null)
                            }}
                            className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Assign Manager Dialog */}
              {isAssignManagerDialogOpen && selectedAffiliateForManager && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-white">Vincular Gerente</CardTitle>
                      <CardDescription>
                        Afiliado: {selectedAffiliateForManager.name} ({selectedAffiliateForManager.affiliate_code})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-400">Selecionar Gerente</Label>
                          <select
                            className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                            onChange={(e) => {
                              const managerId = e.target.value ? Number.parseInt(e.target.value) : null
                              handleAssignManager(selectedAffiliateForManager.id, managerId)
                              setIsAssignManagerDialogOpen(false)
                              setSelectedAffiliateForManager(null)
                            }}
                            defaultValue={selectedAffiliateForManager.manager_id || ""}
                          >
                            <option value="">Nenhum gerente</option>
                            {managers
                              .filter((m) => m.status === "active")
                              .map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                  {manager.name} ({manager.username})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAssignManagerDialogOpen(false)
                              setSelectedAffiliateForManager(null)
                            }}
                            className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* Managers Tab */}
          <TabsContent value="managers" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Gerentes</h2>
                <p className="text-gray-400">Gerencie gerentes e suas equipes de afiliados</p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsCreateManagerDialogOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 sm:flex-none"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Criar Gerente
                </Button>
                <Button
                  onClick={() => handleExportData("managers")}
                  disabled={isExporting}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-1 sm:flex-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar"}
                </Button>
              </div>
            </div>

            {/* Manager Filters */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-400">Buscar</Label>
                    <Input
                      placeholder="Nome, email, username..."
                      value={managerSearchTerm}
                      onChange={(e) => setManagerSearchTerm(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <select
                      value={managerStatusFilter}
                      onChange={(e) => setManagerStatusFilter(e.target.value)}
                      className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">Ordenar por</Label>
                    <select
                      value={managerSortBy}
                      onChange={(e) => setManagerSortBy(e.target.value as keyof Manager)}
                      className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="created_at">Data de Criação</option>
                      <option value="name">Nome</option>
                      <option value="total_earnings">Ganhos Totais</option>
                      <option value="commission_rate">Taxa de Comissão</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-400">Ordem</Label>
                    <select
                      value={managerSortOrder}
                      onChange={(e) => setManagerSortOrder(e.target.value as "asc" | "desc")}
                      className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                    >
                      <option value="desc">Decrescente</option>
                      <option value="asc">Crescente</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Managers Table */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Gerentes ({filteredAndSortedManagers.length} de {managers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <SortableHeader
                          label="Nome"
                          sortKey="name"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("desc")
                            }
                          }}
                        />
                        <th className="text-left text-gray-400 p-3">Comissão</th>
                        <th className="text-left text-gray-400 p-3">Ganhos</th>
                        <th className="text-left text-gray-400 p-3">Afiliados</th>
                        <th className="text-left text-gray-400 p-3">Referrals</th>
                        <th className="text-left text-gray-400 p-3">Status</th>
                        <th className="text-left text-gray-400 p-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedManagers.map((manager) => (
                        <tr key={manager.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="p-3">
                            <div>
                              <p className="text-white font-medium">{manager.name}</p>
                              <p className="text-gray-400 text-sm">{manager.email}</p>
                              <p className="text-gray-500 text-xs">@{manager.username}</p>
                            </div>
                          </td>
                          <td className="p-3 text-white">{manager.commission_rate}%</td>
                          <td className="p-3">
                            <div>
                              <p className="text-green-400 font-bold">{formatCurrency(manager.total_earnings)}</p>
                              <p className="text-gray-400 text-xs">Saldo: {formatCurrency(manager.balance)}</p>
                            </div>
                          </td>
                          <td className="p-3 text-white">{manager.total_affiliates || 0}</td>
                          <td className="p-3">
                            <div>
                              <p className="text-white">{manager.total_referrals_managed || 0}</p>
                              <p className="text-gray-400 text-xs">
                                {formatCurrency(manager.total_deposit_volume || 0)} volume
                              </p>
                            </div>
                          </td>
                          <td className="p-3">{getStatusBadge(manager.status)}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditManagerDialog(manager)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteManager(manager.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {paginatedManagers.map((manager) => (
                    <MobileCard key={manager.id}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{manager.name}</p>
                          <p className="text-gray-400 text-sm">{manager.email}</p>
                        </div>
                        {getStatusBadge(manager.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Comissão:</span>
                          <span className="text-white">{manager.commission_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ganhos:</span>
                          <span className="text-green-400 font-bold">{formatCurrency(manager.total_earnings)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Saldo:</span>
                          <span className="text-white">{formatCurrency(manager.balance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Afiliados:</span>
                          <span className="text-white">{manager.total_affiliates || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Referrals:</span>
                          <span className="text-white">{manager.total_referrals_managed || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-700">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditManagerDialog(manager)}
                          className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteManager(manager.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          Excluir
                        </Button>
                      </div>
                    </MobileCard>
                  ))}
                </div>

                {/* Pagination */}
                <PaginationControls
                  currentPage={managerCurrentPage}
                  totalPages={managerTotalPages}
                  onPageChange={setManagerCurrentPage}
                  itemsPerPage={managerItemsPerPage}
                  totalItems={filteredAndSortedManagers.length}
                />
              </CardContent>
            </Card>

            {/* Create Manager Dialog */}
            {isCreateManagerDialogOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-white">Criar Novo Gerente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateManager} className="space-y-4">
                      <div>
                        <Label className="text-gray-400">Nome</Label>
                        <Input
                          value={createManagerForm.name}
                          onChange={(e) => setCreateManagerForm({ ...createManagerForm, name: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Email</Label>
                        <Input
                          type="email"
                          value={createManagerForm.email}
                          onChange={(e) => setCreateManagerForm({ ...createManagerForm, email: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Username</Label>
                        <Input
                          value={createManagerForm.username}
                          onChange={(e) => setCreateManagerForm({ ...createManagerForm, username: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Senha</Label>
                        <Input
                          type="password"
                          value={createManagerForm.password}
                          onChange={(e) => setCreateManagerForm({ ...createManagerForm, password: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Taxa de Comissão (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={createManagerForm.commission_rate}
                          onChange={(e) =>
                            setCreateManagerForm({
                              ...createManagerForm,
                              commission_rate: Number.parseFloat(e.target.value),
                            })
                          }
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1"
                        >
                          Criar Gerente
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateManagerDialogOpen(false)}
                          className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Edit Manager Dialog */}
            {isEditManagerDialogOpen && editingManager && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-white">Editar Gerente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEditManager} className="space-y-4">
                      <div>
                        <Label className="text-gray-400">Nome</Label>
                        <Input
                          value={editManagerForm.name}
                          onChange={(e) => setEditManagerForm({ ...editManagerForm, name: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Email</Label>
                        <Input
                          type="email"
                          value={editManagerForm.email}
                          onChange={(e) => setEditManagerForm({ ...editManagerForm, email: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Username</Label>
                        <Input
                          value={editManagerForm.username}
                          onChange={(e) => setEditManagerForm({ ...editManagerForm, username: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Taxa de Comissão (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={editManagerForm.commission_rate}
                          onChange={(e) =>
                            setEditManagerForm({
                              ...editManagerForm,
                              commission_rate: Number.parseFloat(e.target.value),
                            })
                          }
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Status</Label>
                        <select
                          value={editManagerForm.status}
                          onChange={(e) => setEditManagerForm({ ...editManagerForm, status: e.target.value })}
                          className="w-full bg-slate-800 border-slate-600 text-white rounded px-3 py-2"
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex-1"
                        >
                          Salvar Alterações
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditManagerDialogOpen(false)
                            setEditingManager(null)
                          }}
                          className="border-slate-600 text-white hover:bg-slate-700 flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Affiliate Withdraws Tab */}
          {accessLevel === "full" && (
            <TabsContent value="affiliate-withdraws" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Saques de Afiliados</h2>
                  <p className="text-gray-400">Gerencie solicitações de saque dos afiliados</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {affiliateWithdraws.filter((w) => w.status === "pending").length} Pendentes
                  </Badge>
                </div>
              </div>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Solicitações de Saque</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-gray-400 p-3">Afiliado</th>
                          <th className="text-left text-gray-400 p-3">Valor</th>
                          <th className="text-left text-gray-400 p-3">PIX</th>
                          <th className="text-left text-gray-400 p-3">Status</th>
                          <th className="text-left text-gray-400 p-3">Data</th>
                          <th className="text-left text-gray-400 p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliateWithdraws.map((withdraw) => (
                          <tr key={withdraw.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-medium">{withdraw.affiliate_name}</p>
                                <p className="text-gray-400 text-sm">{withdraw.affiliate_email}</p>
                                <p className="text-gray-500 text-xs">@{withdraw.affiliate_username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-white font-bold">{formatCurrency(withdraw.amount)}</td>
                            <td className="p-3">
                              <div>
                                <p className="text-white text-sm">{withdraw.pix_key}</p>
                                <p className="text-gray-400 text-xs">{withdraw.pix_type}</p>
                              </div>
                            </td>
                            <td className="p-3">{getStatusBadge(withdraw.status)}</td>
                            <td className="p-3 text-gray-400 text-sm">{formatDate(withdraw.created_at)}</td>
                            <td className="p-3">
                              {withdraw.status === "pending" ? (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessWithdraw(withdraw.id, "approve")}
                                    disabled={processingWithdraw === withdraw.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {processingWithdraw === withdraw.id ? "..." : "Aprovar"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const notes = prompt("Motivo da rejeição (opcional):")
                                      handleProcessWithdraw(withdraw.id, "reject", notes || undefined)
                                    }}
                                    disabled={processingWithdraw === withdraw.id}
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    Rejeitar
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">
                                  {withdraw.processed_at && <p>Processado em {formatDate(withdraw.processed_at)}</p>}
                                  {withdraw.admin_notes && <p className="text-xs">Obs: {withdraw.admin_notes}</p>}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden p-4 space-y-4">
                    {affiliateWithdraws.map((withdraw) => (
                      <MobileCard key={withdraw.id}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{withdraw.affiliate_name}</p>
                            <p className="text-gray-400 text-sm">{withdraw.affiliate_email}</p>
                          </div>
                          {getStatusBadge(withdraw.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Valor:</span>
                            <span className="text-white font-bold">{formatCurrency(withdraw.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">PIX:</span>
                            <div className="text-right">
                              <p className="text-white text-sm">{withdraw.pix_key}</p>
                              <p className="text-gray-400 text-xs">{withdraw.pix_type}</p>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data:</span>
                            <span className="text-gray-300">{formatDate(withdraw.created_at)}</span>
                          </div>
                        </div>
                        {withdraw.status === "pending" && (
                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-700">
                            <Button
                              size="sm"
                              onClick={() => handleProcessWithdraw(withdraw.id, "approve")}
                              disabled={processingWithdraw === withdraw.id}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              {processingWithdraw === withdraw.id ? "Processando..." : "Aprovar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const notes = prompt("Motivo da rejeição (opcional):")
                                handleProcessWithdraw(withdraw.id, "reject", notes || undefined)
                              }}
                              disabled={processingWithdraw === withdraw.id}
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-1"
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {withdraw.admin_notes && (
                          <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-gray-400">
                            <strong>Observações:</strong> {withdraw.admin_notes}
                          </div>
                        )}
                      </MobileCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Manager Withdraws Tab */}
          {accessLevel === "full" && (
            <TabsContent value="manager-withdraws" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Saques de Gerentes</h2>
                  <p className="text-gray-400">Gerencie solicitações de saque dos gerentes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {managerWithdraws.filter((w) => w.status === "pending").length} Pendentes
                  </Badge>
                </div>
              </div>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Solicitações de Saque</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-gray-400 p-3">Gerente</th>
                          <th className="text-left text-gray-400 p-3">Valor</th>
                          <th className="text-left text-gray-400 p-3">PIX</th>
                          <th className="text-left text-gray-400 p-3">Status</th>
                          <th className="text-left text-gray-400 p-3">Data</th>
                          <th className="text-left text-gray-400 p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerWithdraws.map((withdraw) => (
                          <tr key={withdraw.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="p-3">
                              <div>
                                <p className="text-white font-medium">{withdraw.manager_name}</p>
                                <p className="text-gray-400 text-sm">{withdraw.manager_email}</p>
                                <p className="text-gray-500 text-xs">@{withdraw.manager_username}</p>
                              </div>
                            </td>
                            <td className="p-3 text-white font-bold">{formatCurrency(withdraw.amount)}</td>
                            <td className="p-3">
                              <div>
                                <p className="text-white text-sm">{withdraw.pix_key}</p>
                                <p className="text-gray-400 text-xs">{withdraw.pix_type}</p>
                              </div>
                            </td>
                            <td className="p-3">{getStatusBadge(withdraw.status)}</td>
                            <td className="p-3 text-gray-400 text-sm">{formatDate(withdraw.created_at)}</td>
                            <td className="p-3">
                              {withdraw.status === "pending" ? (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessManagerWithdraw(withdraw.id, "approve")}
                                    disabled={processingManagerWithdraw === withdraw.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {processingManagerWithdraw === withdraw.id ? "..." : "Aprovar"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const notes = prompt("Motivo da rejeição (opcional):")
                                      handleProcessManagerWithdraw(withdraw.id, "reject", notes || undefined)
                                    }}
                                    disabled={processingManagerWithdraw === withdraw.id}
                                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                  >
                                    Rejeitar
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">
                                  {withdraw.processed_at && <p>Processado em {formatDate(withdraw.processed_at)}</p>}
                                  {withdraw.admin_notes && <p className="text-xs">Obs: {withdraw.admin_notes}</p>}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden p-4 space-y-4">
                    {managerWithdraws.map((withdraw) => (
                      <MobileCard key={withdraw.id}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{withdraw.manager_name}</p>
                            <p className="text-gray-400 text-sm">{withdraw.manager_email}</p>
                          </div>
                          {getStatusBadge(withdraw.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Valor:</span>
                            <span className="text-white font-bold">{formatCurrency(withdraw.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">PIX:</span>
                            <div className="text-right">
                              <p className="text-white text-sm">{withdraw.pix_key}</p>
                              <p className="text-gray-400 text-xs">{withdraw.pix_type}</p>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data:</span>
                            <span className="text-gray-300">{formatDate(withdraw.created_at)}</span>
                          </div>
                        </div>
                        {withdraw.status === "pending" && (
                          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-700">
                            <Button
                              size="sm"
                              onClick={() => handleProcessManagerWithdraw(withdraw.id, "approve")}
                              disabled={processingManagerWithdraw === withdraw.id}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              {processingManagerWithdraw === withdraw.id ? "Processando..." : "Aprovar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const notes = prompt("Motivo da rejeição (opcional):")
                                handleProcessManagerWithdraw(withdraw.id, "reject", notes || undefined)
                              }}
                              disabled={processingManagerWithdraw === withdraw.id}
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-1"
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {withdraw.admin_notes && (
                          <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-gray-400">
                            <strong>Observações:</strong> {withdraw.admin_notes}
                          </div>
                        )}
                      </MobileCard>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Reports Tab */}
          {accessLevel === "full" && (
            <TabsContent value="reports" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Relatórios</h2>
                  <p className="text-gray-400">Exporte dados e gere relatórios detalhados</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      <span>Relatórios de Afiliados</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => handleExportData("affiliates")}
                      disabled={isExporting}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isExporting ? "Exportando..." : "Exportar Dados dos Afiliados"}
                    </Button>
                    <Button
                      onClick={() => handleExportData("commissions")}
                      disabled={isExporting}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {isExporting ? "Exportando..." : "Exportar Comissões"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <UserCog className="h-5 w-5 text-purple-400" />
                      <span>Relatórios de Gerentes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => handleExportData("managers")}
                      disabled={isExporting}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isExporting ? "Exportando..." : "Exportar Dados dos Gerentes"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-green-400" />
                      <span>Relatórios de Transações</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => handleExportData("transactions")}
                      disabled={isExporting}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isExporting ? "Exportando..." : "Exportar Transações"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-yellow-400" />
                      <span>Relatórios Personalizados</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">Relatórios personalizados estarão disponíveis em breve</p>
                    <Button disabled className="w-full bg-transparent" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Em Desenvolvimento
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          {accessLevel === "full" && (
            <TabsContent value="settings" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Configurações</h2>
                  <p className="text-gray-400">Configure parâmetros do sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Configurações de Depósito e Saque</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Valor Mínimo de Depósito (R$)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          step="0.01"
                          value={settingsForm.min_deposit_amount}
                          onChange={(e) => setSettingsForm({ ...settingsForm, min_deposit_amount: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white flex-1"
                        />
                        <Button
                          onClick={() => handleUpdateSetting("min_deposit_amount", settingsForm.min_deposit_amount)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          Salvar
                        </Button>
                      </div>
                      {settings.min_deposit_amount && (
                        <p className="text-gray-500 text-xs mt-1">
                          Atual: R$ {settings.min_deposit_amount.value} (atualizado em{" "}
                          {formatDate(settings.min_deposit_amount.updated_at)})
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-400">Valor Mínimo de Saque (R$)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          step="0.01"
                          value={settingsForm.min_withdraw_amount}
                          onChange={(e) => setSettingsForm({ ...settingsForm, min_withdraw_amount: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white flex-1"
                        />
                        <Button
                          onClick={() => handleUpdateSetting("min_withdraw_amount", settingsForm.min_withdraw_amount)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          Salvar
                        </Button>
                      </div>
                      {settings.min_withdraw_amount && (
                        <p className="text-gray-500 text-xs mt-1">
                          Atual: R$ {settings.min_withdraw_amount.value} (atualizado em{" "}
                          {formatDate(settings.min_withdraw_amount.updated_at)})
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Informações do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Versão do Sistema</span>
                      <Badge className="bg-blue-500/20 text-blue-400">v2.1.0</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Última Atualização</span>
                      <span className="text-white">{formatDate(lastUpdate.toISOString())}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status do Sistema</span>
                      <Badge className="bg-green-500/20 text-green-400">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Auto-refresh</span>
                      <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Performance Tab */}
          {accessLevel === "full" && (
            <TabsContent value="performance" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Desempenho</h2>
                  <p className="text-gray-400">Monitore a performance do sistema</p>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        <span>Métricas de Performance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tempo Médio de Depósito</span>
                        <span className="text-green-400 font-bold">
                          {stats.performance.avg_deposit_time
                            ? `${Math.round(stats.performance.avg_deposit_time)}s`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tempo Médio de Saque</span>
                        <span className="text-blue-400 font-bold">
                          {stats.performance.avg_withdraw_time
                            ? `${Math.round(stats.performance.avg_withdraw_time)}s`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Taxa de Erro da API</span>
                        <span className="text-red-400 font-bold">{stats.performance.api_error_rate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Uptime do Sistema</span>
                        <span className="text-green-400 font-bold">{stats.performance.system_uptime}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-cyan-400" />
                        <span>Estatísticas de Uso</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Usuários Ativos (1h)</span>
                        <span className="text-green-400 font-bold">{stats.users.online_now}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Transações Hoje</span>
                        <span className="text-blue-400 font-bold">{stats.transactions.today_transactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Jogadas Hoje</span>
                        <span className="text-purple-400 font-bold">{stats.games.today_plays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Volume Hoje</span>
                        <span className="text-yellow-400 font-bold">
                          {formatCurrency(stats.transactions.today_volume)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
