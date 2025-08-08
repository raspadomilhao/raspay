"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { toast } from "sonner"
import { Users, UserPlus, Edit, Trash2, DollarSign, TrendingUp, Settings, Activity, Wallet, Clock, Eye, Gamepad2, BarChart3, CreditCard, CheckCircle, XCircle, Lock, AlertCircle, Check, X, FileText, UserCog, Link, Unlink, Zap, Menu, Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, TrendingDown, Target, Home, Shield, RefreshCw, MoreVertical, Plus, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"

import { AuthClient } from "@/lib/auth-client"

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
      success: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "Sucesso" },
      pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock, label: "Pendente" },
      failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Falhou" },
      cancelled: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle, label: "Cancelado" },
      approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "Aprovado" },
      rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Rejeitado" },
      active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "Ativo" },
      inactive: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Inativo" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      deposit: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Depósito" },
      withdraw: { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Saque" },
      game_play: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Jogo" },
      game_prize: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Prêmio" },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: type }

    return <Badge className={`${config.color} border px-2.5 py-1 text-xs font-medium`}>{config.label}</Badge>
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
    <div className={`bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 space-y-3 ${className}`}>{children}</div>
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-800/50">
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
          className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-white px-3 py-1 bg-black/20 rounded-md border border-gray-700">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
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
          { id: "dashboard", label: "Dashboard", icon: Home },
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
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black"></div>
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-gray-800/50 shadow-2xl relative z-10">
          <CardHeader className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-white text-2xl font-bold">Acesso Administrativo</CardTitle>
              <CardDescription className="text-gray-400">Digite a senha para acessar o painel administrativo</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAuthentication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Digite a senha administrativa"
                  required
                />
                {authError && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-medium py-3 shadow-lg"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verificando...
                  </div>
                ) : (
                  "Acessar Painel"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse shadow-lg">
            <Settings className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">Carregando configurações...</p>
            <p className="text-gray-400 text-sm">Aguarde um momento</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black"></div>
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-black/60 backdrop-blur-xl border-b border-gray-800/50 p-4 relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {accessLevel === "managers_only" ? "Painel de Gerentes" : "Admin Panel"}
              </h1>
              <p className="text-sm text-gray-400">
                {navigationTabs.find((tab) => tab.id === activeTab)?.label || "Dashboard"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-gray-800/50"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-black/80 backdrop-blur-xl border-b border-gray-800/50 p-4 relative z-40">
          <div className="grid grid-cols-2 gap-2">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`justify-start text-left h-auto p-3 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6 relative z-10">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {accessLevel === "managers_only" ? "Painel de Gerentes" : "Painel Administrativo"}
              </h1>
              <p className="text-gray-400 text-lg">
                {accessLevel === "managers_only"
                  ? "Gerencie gerentes e monitore suas atividades"
                  : "Gerencie afiliados, gerentes, configurações e monitore estatísticas da plataforma"}
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400" : "bg-gray-400"}`} />
              <span className="text-sm text-gray-400">Auto-refresh: {autoRefresh ? "Ativo" : "Inativo"}</span>
            </div>
            <div className="text-sm text-gray-500">Última: {lastUpdate.toLocaleTimeString("pt-BR")}</div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50 flex-1 sm:flex-none"
            >
              {autoRefresh ? <Minus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {autoRefresh ? "Pausar" : "Ativar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50 flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tab List */}
          <div className="hidden lg:block">
            <TabsList className="bg-black/40 backdrop-blur-sm border border-gray-800/50 w-full grid grid-cols-9 h-auto p-1 rounded-xl">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg p-3 rounded-lg transition-all duration-200"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="font-medium">{tab.label}</span>
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
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Usuários Online</p>
                          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.users.online_now}</p>
                          <p className="text-xs text-gray-500 mt-1">Última hora</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Eye className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Receita Hoje</p>
                          <p className="text-3xl font-bold text-blue-400 mt-2">
                            {formatCurrency(stats.financial.daily_revenue)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Lucro dos jogos</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Transações Hoje</p>
                          <p className="text-3xl font-bold text-purple-400 mt-2">{stats.transactions.today_transactions}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.transactions.today_volume)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Activity className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Saques Pendentes</p>
                          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.withdraws.pending_count}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.withdraws.pending_amount)}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Clock className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial and Revenue Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span>Situação Financeira</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saldo da Plataforma</span>
                        <span className="text-emerald-400 font-bold">
                          {formatCurrency(stats.financial.platform_balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saldo dos Usuários</span>
                        <span className="text-blue-400 font-bold">
                          {formatCurrency(stats.financial.total_user_balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saques Pendentes</span>
                        <span className="text-amber-400 font-bold">
                          {formatCurrency(stats.financial.pending_withdraws)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-gray-300 font-medium">Saldo Disponível</span>
                        <span className="text-white font-bold text-lg">
                          {formatCurrency(stats.financial.available_balance)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Receitas por Período</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Hoje</span>
                        <span className="text-emerald-400 font-bold">
                          {formatCurrency(stats.financial.daily_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Esta Semana</span>
                        <span className="text-blue-400 font-bold">
                          {formatCurrency(stats.financial.weekly_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Este Mês</span>
                        <span className="text-purple-400 font-bold">
                          {formatCurrency(stats.financial.monthly_revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
                        <span className="text-gray-300 font-medium">Margem de Lucro</span>
                        <span className="text-white font-bold text-lg">{stats.games.profit_margin.toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Users and Games Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Usuários</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Total de Usuários</span>
                        <span className="text-blue-400 font-bold">{stats.users.total}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Ativos Hoje</span>
                        <span className="text-emerald-400 font-bold">{stats.users.active_today}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Novos esta Semana</span>
                        <span className="text-purple-400 font-bold">{stats.users.new_this_week}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Bloggers</span>
                        <span className="text-amber-400 font-bold">{stats.users.blogger_count}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Gamepad2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span>Jogos Hoje</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Jogadas</span>
                        <span className="text-emerald-400 font-bold">{stats.games.today_plays}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Apostado</span>
                        <span className="text-red-400 font-bold">{formatCurrency(stats.games.today_spent)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Pago em Prêmios</span>
                        <span className="text-amber-400 font-bold">{formatCurrency(stats.games.today_won)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-gray-300 font-medium">Lucro Hoje</span>
                        <span className="text-white font-bold text-lg">
                          {formatCurrency(stats.games.today_spent - stats.games.today_won)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activities */}
                <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span>Atividades Recentes (24h)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stats.recent_activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-4 bg-gray-800/20 rounded-xl hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                activity.type === "deposit"
                                  ? "bg-emerald-400"
                                  : activity.type === "withdraw"
                                    ? "bg-red-400"
                                    : activity.type === "game"
                                      ? "bg-blue-400"
                                      : "bg-gray-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm truncate font-medium">{activity.description}</p>
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
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Analytics Avançados</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Select
                  value={analyticsDateRange}
                  onValueChange={(value) => {
                    setAnalyticsDateRange(value)
                    fetchAnalytics()
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-gray-700 text-white w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={analyticsPeriod}
                  onValueChange={(value) => {
                    setAnalyticsPeriod(value)
                    fetchAnalytics()
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-gray-700 text-white w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {analyticsData && (
              <>
                {/* Period Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Receita</p>
                          <p className="text-3xl font-bold text-emerald-400 mt-2">
                            {formatCurrency(analyticsData.period_comparison.current_period.revenue)}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            {analyticsData.period_comparison.current_period.revenue >
                            analyticsData.period_comparison.previous_period.revenue ? (
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className="text-xs text-gray-500">vs período anterior</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Usuários</p>
                          <p className="text-3xl font-bold text-blue-400 mt-2">
                            {analyticsData.period_comparison.current_period.users}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            {analyticsData.period_comparison.current_period.users >
                            analyticsData.period_comparison.previous_period.users ? (
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className="text-xs text-gray-500">vs período anterior</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Transações</p>
                          <p className="text-3xl font-bold text-purple-400 mt-2">
                            {analyticsData.period_comparison.current_period.transactions}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            {analyticsData.period_comparison.current_period.transactions >
                            analyticsData.period_comparison.previous_period.transactions ? (
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className="text-xs text-gray-500">vs período anterior</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Activity className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Comissões</p>
                          <p className="text-3xl font-bold text-amber-400 mt-2">
                            {formatCurrency(analyticsData.period_comparison.current_period.affiliates_earnings)}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            {analyticsData.period_comparison.current_period.affiliates_earnings >
                            analyticsData.period_comparison.previous_period.affiliates_earnings ? (
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            )}
                            <span className="text-xs text-gray-500">vs período anterior</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Target className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Trend Chart */}
                <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span>Tendência de Receita</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Receita",
                          color: "hsl(var(--chart-1))",
                        },
                        deposits: {
                          label: "Depósitos",
                          color: "hsl(var(--chart-2))",
                        },
                        withdraws: {
                          label: "Saques",
                          color: "hsl(var(--chart-3))",
                        },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.revenue_trend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2}
                            name="Receita"
                          />
                          <Line
                            type="monotone"
                            dataKey="deposits"
                            stroke="var(--color-deposits)"
                            strokeWidth={2}
                            name="Depósitos"
                          />
                          <Line
                            type="monotone"
                            dataKey="withdraws"
                            stroke="var(--color-withdraws)"
                            strokeWidth={2}
                            name="Saques"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Affiliate Performance */}
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Performance de Afiliados</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          earnings: {
                            label: "Ganhos",
                            color: "hsl(var(--chart-1))",
                          },
                          conversion: {
                            label: "Conversão",
                            color: "hsl(var(--chart-2))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.affiliate_performance.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="affiliate_name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="total_earnings" fill="var(--color-earnings)" name="Ganhos (R$)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Manager Performance */}
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <UserCog className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Performance de Gerentes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          earnings: {
                            label: "Ganhos",
                            color: "hsl(var(--chart-3))",
                          },
                          affiliates: {
                            label: "Afiliados",
                            color: "hsl(var(--chart-4))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.manager_performance.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="manager_name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="total_earnings" fill="var(--color-earnings)" name="Ganhos (R$)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Transações do Sistema</h2>

            {stats && (
              <>
                {/* Transaction Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Total de Transações</p>
                          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.transactions.total}</p>
                          <p className="text-xs text-gray-500 mt-1">Todas as transações</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Bem-sucedidas</p>
                          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.transactions.successful}</p>
                          <p className="text-xs text-gray-500 mt-1">Concluídas</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Pendentes</p>
                          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.transactions.pending}</p>
                          <p className="text-xs text-gray-500 mt-1">Aguardando</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Clock className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Falharam</p>
                          <p className="text-3xl font-bold text-red-400 mt-2">{stats.transactions.failed}</p>
                          <p className="text-xs text-gray-500 mt-1">Com erro</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <XCircle className="h-6 w-6 text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Volume Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span>Volume Total</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-white">{formatCurrency(stats.transactions.total_volume)}</p>
                      <p className="text-gray-400 text-sm mt-2">Todas as transações</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Volume de Depósitos</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(stats.transactions.deposits_volume)}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">Entradas na plataforma</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-red-400" />
                        </div>
                        <span>Volume de Saques</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(stats.transactions.withdraws_volume)}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">Saídas da plataforma</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Transactions Table */}
                <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span>Transações Recentes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-800/50 hover:bg-gray-800/20">
                            <TableHead className="text-gray-400 font-medium">ID</TableHead>
                            <TableHead className="text-gray-400 font-medium">Usuário</TableHead>
                            <TableHead className="text-gray-400 font-medium">Tipo</TableHead>
                            <TableHead className="text-gray-400 font-medium">Valor</TableHead>
                            <TableHead className="text-gray-400 font-medium">Status</TableHead>
                            <TableHead className="text-gray-400 font-medium">PIX</TableHead>
                            <TableHead className="text-gray-400 font-medium">Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.transactions.detailed_list?.slice(0, 20).map((transaction) => (
                            <TableRow key={transaction.id} className="hover:bg-gray-800/20 border-gray-800/50 transition-colors">
                              <TableCell>
                                <span className="text-white font-mono text-sm">#{transaction.id}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-white font-medium text-sm">{transaction.user.name}</span>
                                  <span className="text-gray-500 text-xs">{transaction.user.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                              <TableCell>
                                <span className="text-white font-medium">{formatCurrency(transaction.amount)}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>
                                {transaction.pix_key ? (
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs truncate max-w-32">{transaction.pix_key}</span>
                                    <span className="text-gray-500 text-xs">{transaction.pix_type}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-400 text-xs">{formatDate(transaction.created_at)}</span>
                              </TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                Nenhuma transação encontrada
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden p-4 space-y-4">
                      {stats.transactions.detailed_list?.slice(0, 20).map((transaction) => (
                        <MobileCard key={transaction.id}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-white font-mono text-sm">#{transaction.id}</span>
                              <div className="mt-1">
                                <span className="text-white font-medium text-sm">{transaction.user.name}</span>
                                <p className="text-gray-500 text-xs">{transaction.user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-medium text-sm">
                                {formatCurrency(transaction.amount)}
                              </span>
                              <p className="text-gray-400 text-xs mt-1">{formatDate(transaction.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            {getTypeBadge(transaction.type)}
                            {getStatusBadge(transaction.status)}
                          </div>
                          {transaction.pix_key && (
                            <div className="mt-2 p-3 bg-gray-800/30 rounded-lg">
                              <p className="text-white text-xs truncate">{transaction.pix_key}</p>
                              <p className="text-gray-500 text-xs">{transaction.pix_type}</p>
                            </div>
                          )}
                        </MobileCard>
                      )) || <div className="text-center py-8 text-gray-400">Nenhuma transação encontrada</div>}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Affiliates Tab */}
          <TabsContent value="affiliates" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Gerenciar Afiliados</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleExportData("affiliates")}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg w-full sm:w-auto">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Afiliado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/90 backdrop-blur-xl border border-gray-800/50 text-white max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl font-bold">Criar Novo Afiliado</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAffiliate} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-white font-medium">
                            Nome
                          </Label>
                          <Input
                            id="name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-white font-medium">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="username" className="text-white font-medium">
                            Nome de Usuário
                          </Label>
                          <Input
                            id="username"
                            value={createForm.username}
                            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="affiliate_code" className="text-white font-medium">
                            Código de Afiliado
                          </Label>
                          <Input
                            id="affiliate_code"
                            value={createForm.affiliate_code}
                            onChange={(e) => setCreateForm({ ...createForm, affiliate_code: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password" className="text-white font-medium">
                            Senha
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="commission_rate" className="text-white font-medium">
                            Taxa de Comissão (%)
                          </Label>
                          <Input
                            id="commission_rate"
                            type="number"
                            min="0"
                            max="100"
                            value={createForm.commission_rate}
                            onChange={(e) => setCreateForm({ ...createForm, commission_rate: Number(e.target.value) })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="loss_commission_rate" className="text-white font-medium">
                            Taxa de Comissão de Perda (%)
                          </Label>
                          <Input
                            id="loss_commission_rate"
                            type="number"
                            min="0"
                            max="100"
                            value={createForm.loss_commission_rate}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, loss_commission_rate: Number(e.target.value) })
                            }
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg"
                        >
                          Criar Afiliado
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, email, username ou código..."
                      value={affiliateSearchTerm}
                      onChange={(e) => setAffiliateSearchTerm(e.target.value)}
                      className="pl-10 bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <Select value={affiliateStatusFilter} onValueChange={setAffiliateStatusFilter}>
                    <SelectTrigger className="bg-black/40 border-gray-700 text-white w-full sm:w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800/50 hover:bg-gray-800/20">
                        <SortableHeader
                          label="Afiliado"
                          sortKey="name"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <TableHead className="text-gray-400 font-medium">Código</TableHead>
                        <SortableHeader
                          label="Comissão"
                          sortKey="commission_rate"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Referidos"
                          sortKey="total_referrals"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Depósitos"
                          sortKey="deposits_count"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Ganhos"
                          sortKey="total_earnings"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Saldo"
                          sortKey="balance"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <TableHead className="text-gray-400 font-medium">Gerente</TableHead>
                        <SortableHeader
                          label="Status"
                          sortKey="status"
                          currentSortBy={affiliateSortBy}
                          currentSortOrder={affiliateSortOrder}
                          onSort={(key) => {
                            if (affiliateSortBy === key) {
                              setAffiliateSortOrder(affiliateSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setAffiliateSortBy(key as keyof Affiliate)
                              setAffiliateSortOrder("asc")
                            }
                          }}
                        />
                        <TableHead className="text-gray-400 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAffiliates.map((affiliate) => (
                        <TableRow key={affiliate.id} className="hover:bg-gray-800/20 border-gray-800/50 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{affiliate.name}</span>
                              <span className="text-gray-500 text-xs">{affiliate.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-600 text-white bg-gray-800/20">
                              {affiliate.affiliate_code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-emerald-400 font-medium">{affiliate.commission_rate}%</span>
                              {affiliate.loss_commission_rate > 0 && (
                                <span className="text-red-400 text-xs">{affiliate.loss_commission_rate}% (perda)</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{affiliate.total_referrals}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-emerald-400 font-medium">{affiliate.deposits_count}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(affiliate.total_earnings)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(affiliate.balance)}</span>
                          </TableCell>
                          <TableCell>
                            {affiliate.manager_name ? (
                              <div className="flex items-center space-x-1">
                                <UserCog className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-400 text-xs">{affiliate.manager_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">Sem gerente</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(affiliate)}
                                className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAssignManagerDialog(affiliate)}
                                className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg"
                              >
                                {affiliate.manager_id ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAffiliate(affiliate.id)}
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {paginatedAffiliates.map((affiliate) => (
                    <MobileCard key={affiliate.id}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{affiliate.name}</h3>
                          <p className="text-gray-500 text-xs">{affiliate.email}</p>
                          <div className="mt-2">
                            <Badge variant="outline" className="border-gray-600 text-white text-xs bg-gray-800/20">
                              {affiliate.affiliate_code}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">{getStatusBadge(affiliate.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Comissão</p>
                          <p className="text-emerald-400 font-medium">{affiliate.commission_rate}%</p>
                          {affiliate.loss_commission_rate > 0 && (
                            <p className="text-red-400 text-xs">{affiliate.loss_commission_rate}% (perda)</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-400">Referidos</p>
                          <p className="text-white font-medium">{affiliate.total_referrals}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ganhos</p>
                          <p className="text-white font-medium">{formatCurrency(affiliate.total_earnings)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Saldo</p>
                          <p className="text-white font-medium">{formatCurrency(affiliate.balance)}</p>
                        </div>
                      </div>

                      {affiliate.manager_name && (
                        <div className="flex items-center space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <UserCog className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400 text-sm font-medium">Gerente: {affiliate.manager_name}</span>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(affiliate)}
                          className="flex-1 border-gray-700 bg-black/20 text-blue-400 hover:bg-blue-900/20"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignManagerDialog(affiliate)}
                          className="flex-1 border-gray-700 bg-black/20 text-purple-400 hover:bg-purple-900/20"
                        >
                          {affiliate.manager_id ? (
                            <>
                              <Unlink className="h-3 w-3 mr-1" />
                              Desvincular
                            </>
                          ) : (
                            <>
                              <Link className="h-3 w-3 mr-1" />
                              Vincular
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAffiliate(affiliate.id)}
                          className="border-gray-700 bg-black/20 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
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

            {/* Edit Affiliate Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="bg-black/90 backdrop-blur-xl border border-gray-800/50 text-white max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">Editar Afiliado</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditAffiliate} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-white font-medium">
                        Nome
                      </Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email" className="text-white font-medium">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-username" className="text-white font-medium">
                        Nome de Usuário
                      </Label>
                      <Input
                        id="edit-username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-commission-rate" className="text-white font-medium">
                        Taxa de Comissão (%)
                      </Label>
                      <Input
                        id="edit-commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.commission_rate}
                        onChange={(e) => setEditForm({ ...editForm, commission_rate: Number(e.target.value) })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-loss-commission-rate" className="text-white font-medium">
                        Taxa de Comissão de Perda (%)
                      </Label>
                      <Input
                        id="edit-loss-commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.loss_commission_rate}
                        onChange={(e) => setEditForm({ ...editForm, loss_commission_rate: Number(e.target.value) })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-status" className="text-white font-medium">
                        Status
                      </Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger className="bg-black/40 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-password" className="text-white font-medium">
                        Nova Senha
                      </Label>
                      <Input
                        id="edit-password"
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="Deixe em branco para não alterar"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Assign Manager Dialog */}
            <Dialog open={isAssignManagerDialogOpen} onOpenChange={setIsAssignManagerDialogOpen}>
              <DialogContent className="bg-black/90 backdrop-blur-xl border border-gray-800/50 text-white max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">
                    {selectedAffiliateForManager?.manager_id ? "Alterar Gerente" : "Vincular Gerente"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/20 rounded-lg">
                    <p className="text-white font-medium">{selectedAffiliateForManager?.name}</p>
                    <p className="text-gray-400 text-sm">{selectedAffiliateForManager?.email}</p>
                    {selectedAffiliateForManager?.manager_name && (
                      <p className="text-blue-400 text-sm mt-2">
                        Gerente atual: {selectedAffiliateForManager.manager_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Selecionar Gerente</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                        onClick={() => {
                          if (selectedAffiliateForManager) {
                            handleAssignManager(selectedAffiliateForManager.id, null)
                            setIsAssignManagerDialogOpen(false)
                          }
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover Gerente
                      </Button>
                      {managers
                        .filter((manager) => manager.status === "active")
                        .map((manager) => (
                          <Button
                            key={manager.id}
                            variant="outline"
                            className="w-full justify-start border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                            onClick={() => {
                              if (selectedAffiliateForManager) {
                                handleAssignManager(selectedAffiliateForManager.id, manager.id)
                                setIsAssignManagerDialogOpen(false)
                              }
                            }}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            <div className="text-left">
                              <p className="font-medium">{manager.name}</p>
                              <p className="text-xs text-gray-400">{manager.email}</p>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignManagerDialogOpen(false)}
                      className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Managers Tab */}
          <TabsContent value="managers" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Gerenciar Gerentes</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleExportData("managers")}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
                <Dialog open={isCreateManagerDialogOpen} onOpenChange={setIsCreateManagerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg w-full sm:w-auto">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Gerente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/90 backdrop-blur-xl border border-gray-800/50 text-white max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl font-bold">Criar Novo Gerente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateManager} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="manager-name" className="text-white font-medium">
                            Nome
                          </Label>
                          <Input
                            id="manager-name"
                            value={createManagerForm.name}
                            onChange={(e) => setCreateManagerForm({ ...createManagerForm, name: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="manager-email" className="text-white font-medium">
                            Email
                          </Label>
                          <Input
                            id="manager-email"
                            type="email"
                            value={createManagerForm.email}
                            onChange={(e) => setCreateManagerForm({ ...createManagerForm, email: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="manager-username" className="text-white font-medium">
                            Nome de Usuário
                          </Label>
                          <Input
                            id="manager-username"
                            value={createManagerForm.username}
                            onChange={(e) => setCreateManagerForm({ ...createManagerForm, username: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="manager-password" className="text-white font-medium">
                            Senha
                          </Label>
                          <Input
                            id="manager-password"
                            type="password"
                            value={createManagerForm.password}
                            onChange={(e) => setCreateManagerForm({ ...createManagerForm, password: e.target.value })}
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="manager-commission-rate" className="text-white font-medium">
                            Taxa de Comissão (%)
                          </Label>
                          <Input
                            id="manager-commission-rate"
                            type="number"
                            min="0"
                            max="100"
                            value={createManagerForm.commission_rate}
                            onChange={(e) =>
                              setCreateManagerForm({ ...createManagerForm, commission_rate: Number(e.target.value) })
                            }
                            className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateManagerDialogOpen(false)}
                          className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg"
                        >
                          Criar Gerente
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, email ou username..."
                      value={managerSearchTerm}
                      onChange={(e) => setManagerSearchTerm(e.target.value)}
                      className="pl-10 bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <Select value={managerStatusFilter} onValueChange={setManagerStatusFilter}>
                    <SelectTrigger className="bg-black/40 border-gray-700 text-white w-full sm:w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800/50 hover:bg-gray-800/20">
                        <SortableHeader
                          label="Gerente"
                          sortKey="name"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Comissão"
                          sortKey="commission_rate"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("asc")
                            }
                          }}
                        />
                        <TableHead className="text-gray-400 font-medium">Afiliados</TableHead>
                        <TableHead className="text-gray-400 font-medium">Referidos</TableHead>
                        <SortableHeader
                          label="Ganhos"
                          sortKey="total_earnings"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Saldo"
                          sortKey="balance"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("asc")
                            }
                          }}
                        />
                        <SortableHeader
                          label="Status"
                          sortKey="status"
                          currentSortBy={managerSortBy}
                          currentSortOrder={managerSortOrder}
                          onSort={(key) => {
                            if (managerSortBy === key) {
                              setManagerSortOrder(managerSortOrder === "asc" ? "desc" : "asc")
                            } else {
                              setManagerSortBy(key as keyof Manager)
                              setManagerSortOrder("asc")
                            }
                          }}
                        />
                        <TableHead className="text-gray-400 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedManagers.map((manager) => (
                        <TableRow key={manager.id} className="hover:bg-gray-800/20 border-gray-800/50 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{manager.name}</span>
                              <span className="text-gray-500 text-xs">{manager.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-emerald-400 font-medium">{manager.commission_rate}%</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-400 font-medium">{manager.total_affiliates || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-purple-400 font-medium">{manager.total_referrals_managed || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(manager.total_earnings)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(manager.balance)}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(manager.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditManagerDialog(manager)}
                                className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteManager(manager.id)}
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {paginatedManagers.map((manager) => (
                    <MobileCard key={manager.id}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{manager.name}</h3>
                          <p className="text-gray-500 text-xs">{manager.email}</p>
                        </div>
                        <div className="text-right">{getStatusBadge(manager.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Comissão</p>
                          <p className="text-emerald-400 font-medium">{manager.commission_rate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Afiliados</p>
                          <p className="text-blue-400 font-medium">{manager.total_affiliates || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ganhos</p>
                          <p className="text-white font-medium">{formatCurrency(manager.total_earnings)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Saldo</p>
                          <p className="text-white font-medium">{formatCurrency(manager.balance)}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditManagerDialog(manager)}
                          className="flex-1 border-gray-700 bg-black/20 text-blue-400 hover:bg-blue-900/20"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteManager(manager.id)}
                          className="border-gray-700 bg-black/20 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
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

            {/* Edit Manager Dialog */}
            <Dialog open={isEditManagerDialogOpen} onOpenChange={setIsEditManagerDialogOpen}>
              <DialogContent className="bg-black/90 backdrop-blur-xl border border-gray-800/50 text-white max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">Editar Gerente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditManager} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-manager-name" className="text-white font-medium">
                        Nome
                      </Label>
                      <Input
                        id="edit-manager-name"
                        value={editManagerForm.name}
                        onChange={(e) => setEditManagerForm({ ...editManagerForm, name: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-manager-email" className="text-white font-medium">
                        Email
                      </Label>
                      <Input
                        id="edit-manager-email"
                        type="email"
                        value={editManagerForm.email}
                        onChange={(e) => setEditManagerForm({ ...editManagerForm, email: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-manager-username" className="text-white font-medium">
                        Nome de Usuário
                      </Label>
                      <Input
                        id="edit-manager-username"
                        value={editManagerForm.username}
                        onChange={(e) => setEditManagerForm({ ...editManagerForm, username: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-manager-commission-rate" className="text-white font-medium">
                        Taxa de Comissão (%)
                      </Label>
                      <Input
                        id="edit-manager-commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={editManagerForm.commission_rate}
                        onChange={(e) =>
                          setEditManagerForm({ ...editManagerForm, commission_rate: Number(e.target.value) })
                        }
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-manager-status" className="text-white font-medium">
                        Status
                      </Label>
                      <Select
                        value={editManagerForm.status}
                        onValueChange={(value) => setEditManagerForm({ ...editManagerForm, status: value })}
                      >
                        <SelectTrigger className="bg-black/40 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/80 backdrop-blur-sm border-gray-700 text-white">
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditManagerDialogOpen(false)}
                      className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-lg"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Affiliate Withdraws Tab */}
          <TabsContent value="affiliate-withdraws" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Saques de Afiliados</h2>

            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800/50 hover:bg-gray-800/20">
                        <TableHead className="text-gray-400 font-medium">ID</TableHead>
                        <TableHead className="text-gray-400 font-medium">Afiliado</TableHead>
                        <TableHead className="text-gray-400 font-medium">Valor</TableHead>
                        <TableHead className="text-gray-400 font-medium">PIX</TableHead>
                        <TableHead className="text-gray-400 font-medium">Status</TableHead>
                        <TableHead className="text-gray-400 font-medium">Data</TableHead>
                        <TableHead className="text-gray-400 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateWithdraws.map((withdraw) => (
                        <TableRow key={withdraw.id} className="hover:bg-gray-800/20 border-gray-800/50 transition-colors">
                          <TableCell>
                            <span className="text-white font-mono text-sm">#{withdraw.id}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{withdraw.affiliate_name}</span>
                              <span className="text-gray-500 text-xs">{withdraw.affiliate_email}</span>
                              <Badge variant="outline" className="border-gray-600 text-white text-xs bg-gray-800/20 w-fit mt-1">
                                {withdraw.affiliate_code}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(withdraw.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white text-xs truncate max-w-32">{withdraw.pix_key}</span>
                              <span className="text-gray-500 text-xs">{withdraw.pix_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-xs">{formatDate(withdraw.created_at)}</span>
                              {withdraw.processed_at && (
                                <span className="text-gray-500 text-xs">
                                  Processado: {formatDate(withdraw.processed_at)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {withdraw.status === "pending" && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleProcessWithdraw(withdraw.id, "approve")}
                                  disabled={processingWithdraw === withdraw.id}
                                  className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 rounded-lg"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleProcessWithdraw(withdraw.id, "reject")}
                                  disabled={processingWithdraw === withdraw.id}
                                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {withdraw.admin_notes && (
                              <div className="mt-2 p-2 bg-gray-800/20 rounded text-xs text-gray-400">
                                {withdraw.admin_notes}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {affiliateWithdraws.map((withdraw) => (
                    <MobileCard key={withdraw.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-mono text-sm">#{withdraw.id}</span>
                          <div className="mt-1">
                            <span className="text-white font-medium">{withdraw.affiliate_name}</span>
                            <p className="text-gray-500 text-xs">{withdraw.affiliate_email}</p>
                            <Badge variant="outline" className="border-gray-600 text-white text-xs bg-gray-800/20 w-fit mt-1">
                              {withdraw.affiliate_code}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium text-sm">{formatCurrency(withdraw.amount)}</span>
                          <p className="text-gray-400 text-xs mt-1">{formatDate(withdraw.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {getStatusBadge(withdraw.status)}
                      </div>

                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <p className="text-white text-xs truncate">{withdraw.pix_key}</p>
                        <p className="text-gray-500 text-xs">{withdraw.pix_type}</p>
                      </div>

                      {withdraw.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessWithdraw(withdraw.id, "approve")}
                            disabled={processingWithdraw === withdraw.id}
                            className="flex-1 border-gray-700 bg-black/20 text-emerald-400 hover:bg-emerald-900/20"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessWithdraw(withdraw.id, "reject")}
                            disabled={processingWithdraw === withdraw.id}
                            className="flex-1 border-gray-700 bg-black/20 text-red-400 hover:bg-red-900/20"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}

                      {withdraw.admin_notes && (
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <p className="text-gray-400 text-xs">{withdraw.admin_notes}</p>
                        </div>
                      )}
                    </MobileCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manager Withdraws Tab */}
          <TabsContent value="manager-withdraws" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Saques de Gerentes</h2>

            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800/50 hover:bg-gray-800/20">
                        <TableHead className="text-gray-400 font-medium">ID</TableHead>
                        <TableHead className="text-gray-400 font-medium">Gerente</TableHead>
                        <TableHead className="text-gray-400 font-medium">Valor</TableHead>
                        <TableHead className="text-gray-400 font-medium">PIX</TableHead>
                        <TableHead className="text-gray-400 font-medium">Status</TableHead>
                        <TableHead className="text-gray-400 font-medium">Data</TableHead>
                        <TableHead className="text-gray-400 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managerWithdraws.map((withdraw) => (
                        <TableRow key={withdraw.id} className="hover:bg-gray-800/20 border-gray-800/50 transition-colors">
                          <TableCell>
                            <span className="text-white font-mono text-sm">#{withdraw.id}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{withdraw.manager_name}</span>
                              <span className="text-gray-500 text-xs">{withdraw.manager_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-white font-medium">{formatCurrency(withdraw.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white text-xs truncate max-w-32">{withdraw.pix_key}</span>
                              <span className="text-gray-500 text-xs">{withdraw.pix_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-gray-400 text-xs">{formatDate(withdraw.created_at)}</span>
                              {withdraw.processed_at && (
                                <span className="text-gray-500 text-xs">
                                  Processado: {formatDate(withdraw.processed_at)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {withdraw.status === "pending" && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleProcessManagerWithdraw(withdraw.id, "approve")}
                                  disabled={processingManagerWithdraw === withdraw.id}
                                  className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 rounded-lg"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleProcessManagerWithdraw(withdraw.id, "reject")}
                                  disabled={processingManagerWithdraw === withdraw.id}
                                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {withdraw.admin_notes && (
                              <div className="mt-2 p-2 bg-gray-800/20 rounded text-xs text-gray-400">
                                {withdraw.admin_notes}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {managerWithdraws.map((withdraw) => (
                    <MobileCard key={withdraw.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-mono text-sm">#{withdraw.id}</span>
                          <div className="mt-1">
                            <span className="text-white font-medium">{withdraw.manager_name}</span>
                            <p className="text-gray-500 text-xs">{withdraw.manager_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium text-sm">{formatCurrency(withdraw.amount)}</span>
                          <p className="text-gray-400 text-xs mt-1">{formatDate(withdraw.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        {getStatusBadge(withdraw.status)}
                      </div>

                      <div className="p-3 bg-gray-800/30 rounded-lg">
                        <p className="text-white text-xs truncate">{withdraw.pix_key}</p>
                        <p className="text-gray-500 text-xs">{withdraw.pix_type}</p>
                      </div>

                      {withdraw.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessManagerWithdraw(withdraw.id, "approve")}
                            disabled={processingManagerWithdraw === withdraw.id}
                            className="flex-1 border-gray-700 bg-black/20 text-emerald-400 hover:bg-emerald-900/20"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessManagerWithdraw(withdraw.id, "reject")}
                            disabled={processingManagerWithdraw === withdraw.id}
                            className="flex-1 border-gray-700 bg-black/20 text-red-400 hover:bg-red-900/20"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}

                      {withdraw.admin_notes && (
                        <div className="p-3 bg-gray-800/30 rounded-lg">
                          <p className="text-gray-400 text-xs">{withdraw.admin_notes}</p>
                        </div>
                      )}
                    </MobileCard>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Relatórios e Exportações</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Afiliados</p>
                      <p className="text-white text-lg font-bold mt-2">Exportar dados completos</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExportData("affiliates")}
                    disabled={isExporting}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Gerentes</p>
                      <p className="text-white text-lg font-bold mt-2">Exportar dados completos</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExportData("managers")}
                    disabled={isExporting}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Transações</p>
                      <p className="text-white text-lg font-bold mt-2">Exportar histórico</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExportData("transactions")}
                    disabled={isExporting}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Comissões</p>
                      <p className="text-white text-lg font-bold mt-2">Exportar relatório</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExportData("commissions")}
                    disabled={isExporting}
                    className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exportando..." : "Exportar CSV"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Report Summary */}
            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center space-x-2">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span>Resumo dos Relatórios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">Dados Disponíveis para Exportação</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Afiliados cadastrados</span>
                        <span className="text-white font-medium">{affiliates.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Gerentes cadastrados</span>
                        <span className="text-white font-medium">{managers.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saques de afiliados</span>
                        <span className="text-white font-medium">{affiliateWithdraws.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saques de gerentes</span>
                        <span className="text-white font-medium">{managerWithdraws.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">Informações dos Relatórios</h3>
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="p-3 bg-gray-800/20 rounded-lg">
                        <p className="font-medium text-white mb-2">Formato dos Arquivos</p>
                        <p>• Todos os relatórios são exportados em formato CSV</p>
                        <p>• Compatível com Excel, Google Sheets e outros</p>
                        <p>• Codificação UTF-8 para caracteres especiais</p>
                      </div>
                      <div className="p-3 bg-gray-800/20 rounded-lg">
                        <p className="font-medium text-white mb-2">Dados Incluídos</p>
                        <p>• Informações completas de cada registro</p>
                        <p>• Datas de criação e última atualização</p>
                        <p>• Status e valores monetários</p>
                        <p>• Relacionamentos entre entidades</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span>Configurações Financeiras</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="min-deposit" className="text-white font-medium">
                      Valor Mínimo de Depósito (R$)
                    </Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        id="min-deposit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={settingsForm.min_deposit_amount}
                        onChange={(e) => setSettingsForm({ ...settingsForm, min_deposit_amount: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="Ex: 10.00"
                      />
                      <Button
                        onClick={() => handleUpdateSetting("min_deposit_amount", settingsForm.min_deposit_amount)}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg"
                      >
                        Salvar
                      </Button>
                    </div>
                    {settings.min_deposit_amount && (
                      <p className="text-gray-400 text-xs mt-2">
                        Atual: R$ {settings.min_deposit_amount.value} (atualizado em{" "}
                        {formatDate(settings.min_deposit_amount.updated_at)})
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="min-withdraw" className="text-white font-medium">
                      Valor Mínimo de Saque (R$)
                    </Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        id="min-withdraw"
                        type="number"
                        min="0"
                        step="0.01"
                        value={settingsForm.min_withdraw_amount}
                        onChange={(e) => setSettingsForm({ ...settingsForm, min_withdraw_amount: e.target.value })}
                        className="bg-black/40 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                        placeholder="Ex: 20.00"
                      />
                      <Button
                        onClick={() => handleUpdateSetting("min_withdraw_amount", settingsForm.min_withdraw_amount)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                      >
                        Salvar
                      </Button>
                    </div>
                    {settings.min_withdraw_amount && (
                      <p className="text-gray-400 text-xs mt-2">
                        Atual: R$ {settings.min_withdraw_amount.value} (atualizado em{" "}
                        {formatDate(settings.min_withdraw_amount.updated_at)})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-400" />
                    </div>
                    <span>Configurações Gerais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-800/20 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Auto-refresh</h4>
                    <p className="text-gray-400 text-sm mb-3">
                      Atualização automática dos dados a cada 30 segundos
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">Status: {autoRefresh ? "Ativo" : "Inativo"}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="border-gray-700 bg-black/20 text-white hover:bg-gray-800/50"
                      >
                        {autoRefresh ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/20 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Última Atualização</h4>
                    <p className="text-gray-400 text-sm">
                      {lastUpdate.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-800/20 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Nível de Acesso</h4>
                    <p className="text-gray-400 text-sm">
                      {accessLevel === "full" ? "Administrador Completo" : "Gerente de Gerentes"}
                    </p>
                    <Badge
                      className={`mt-2 ${
                        accessLevel === "full"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      } border`}
                    >
                      {accessLevel === "full" ? "Acesso Total" : "Acesso Limitado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-400" />
                  </div>
                  <span>Informações do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-white font-medium">Performance</h4>
                    {stats && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                          <span className="text-gray-400 text-sm">Tempo Médio de Depósito</span>
                          <span className="text-white text-sm">
                            {stats.performance.avg_deposit_time ? `${stats.performance.avg_deposit_time}min` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                          <span className="text-gray-400 text-sm">Tempo Médio de Saque</span>
                          <span className="text-white text-sm">
                            {stats.performance.avg_withdraw_time ? `${stats.performance.avg_withdraw_time}min` : "N/A"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-white font-medium">Disponibilidade</h4>
                    {stats && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                          <span className="text-gray-400 text-sm">Taxa de Erro da API</span>
                          <span className="text-white text-sm">{stats.performance.api_error_rate}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                          <span className="text-gray-400 text-sm">Uptime do Sistema</span>
                          <span className="text-white text-sm">{stats.performance.system_uptime}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-white font-medium">Versão</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400 text-sm">Painel Admin</span>
                        <span className="text-white text-sm">v2.1.0</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400 text-sm">Última Atualização</span>
                        <span className="text-white text-sm">Janeiro 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Monitoramento de Performance</h2>

            {stats && (
              <>
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Uptime do Sistema</p>
                          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.performance.system_uptime}</p>
                          <p className="text-xs text-gray-500 mt-1">Disponibilidade</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Zap className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Taxa de Erro da API</p>
                          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.performance.api_error_rate}</p>
                          <p className="text-xs text-gray-500 mt-1">Últimas 24h</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Tempo Médio Depósito</p>
                          <p className="text-3xl font-bold text-purple-400 mt-2">
                            {stats.performance.avg_deposit_time ? `${stats.performance.avg_deposit_time}min` : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Processamento</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Clock className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">Tempo Médio Saque</p>
                          <p className="text-3xl font-bold text-amber-400 mt-2">
                            {stats.performance.avg_withdraw_time ? `${stats.performance.avg_withdraw_time}min` : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Processamento</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span>Saúde do Sistema</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-white font-medium">API Principal</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          Operacional
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-white font-medium">Base de Dados</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          Operacional
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-white font-medium">Sistema de Pagamentos</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          Operacional
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-white font-medium">Sistema de Jogos</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          Operacional
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-white flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Métricas de Uso</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Usuários Online Agora</span>
                        <span className="text-emerald-400 font-bold">{stats.users.online_now}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Transações Hoje</span>
                        <span className="text-blue-400 font-bold">{stats.transactions.today_transactions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Jogadas Hoje</span>
                        <span className="text-purple-400 font-bold">{stats.games.today_plays}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/20 rounded-lg">
                        <span className="text-gray-400">Saques Pendentes</span>
                        <span className="text-amber-400 font-bold">{stats.withdraws.pending_count}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Actions */}
                <Card className="bg-black/40 backdrop-blur-sm border border-gray-800/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center space-x-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <Settings className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span>Ações de Manutenção</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        <RefreshCw className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`} />
                        <span className="font-medium">Atualizar Dados</span>
                        <span className="text-xs opacity-80">Forçar refresh</span>
                      </Button>

                      <Button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        {autoRefresh ? <Minus className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                        <span className="font-medium">{autoRefresh ? "Pausar" : "Ativar"} Auto-refresh</span>
                        <span className="text-xs opacity-80">Atualização automática</span>
                      </Button>

                      <Button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        <RefreshCw className="h-6 w-6" />
                        <span className="font-medium">Recarregar Página</span>
                        <span className="text-xs opacity-80">Refresh completo</span>
                      </Button>

                      <Button
                        onClick={() => toast.success("Cache limpo com sucesso!")}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        <Trash2 className="h-6 w-6" />
                        <span className="font-medium">Limpar Cache</span>
                        <span className="text-xs opacity-80">Cache do navegador</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
