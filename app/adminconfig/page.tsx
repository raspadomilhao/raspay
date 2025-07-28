"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
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
  Hash,
  Key,
  Lock,
  AlertCircle,
  Check,
  X,
  FileText,
  UserCog,
  Link,
  Unlink,
  Zap,
  Gift,
  Package,
  Trophy,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

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
    // Added performance metrics
    avg_deposit_time: number | null
    avg_withdraw_time: number | null
    api_error_rate: string
    system_uptime: string
  }
}

interface PhysicalPrize {
  id: number
  name: string
  description: string | null
  image_url: string | null
  estimated_value: number
  stock_quantity: number
  min_stock_alert: number
  is_active: boolean
  rarity_weight: number
  created_at: string
  updated_at: string
}

interface PhysicalPrizeWinner {
  id: number
  user_id: number
  physical_prize_id: number
  transaction_id: number | null
  game_name: string
  winner_name: string | null
  winner_phone: string | null
  winner_email: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_zipcode: string | null
  delivery_notes: string | null
  status: string
  admin_notes: string | null
  contacted_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_code: string | null
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  prize_name?: string
  prize_image_url?: string
  prize_estimated_value?: number
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

  const [physicalPrizes, setPhysicalPrizes] = useState<PhysicalPrize[]>([])
  const [physicalPrizeWinners, setPhysicalPrizeWinners] = useState<PhysicalPrizeWinner[]>([])
  const [physicalPrizesStats, setPhysicalPrizesStats] = useState<any>(null)
  const [isCreatePhysicalPrizeDialogOpen, setIsCreatePhysicalPrizeDialogOpen] = useState(false)
  const [isEditPhysicalPrizeDialogOpen, setIsEditPhysicalPrizeDialogOpen] = useState(false)
  const [editingPhysicalPrize, setEditingPhysicalPrize] = useState<PhysicalPrize | null>(null)
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false)
  const [selectedPrizeForStock, setSelectedPrizeForStock] = useState<PhysicalPrize | null>(null)
  const [isEditWinnerDialogOpen, setIsEditWinnerDialogOpen] = useState(false)
  const [editingWinner, setEditingWinner] = useState<PhysicalPrizeWinner | null>(null)

  const [physicalPrizeChance, setPhysicalPrizeChance] = useState<number>(1) // Porcentagem
  const [isChanceDialogOpen, setIsChanceDialogOpen] = useState(false)
  const [chanceForm, setChanceForm] = useState({ percentage: 1 })

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

  // Form states para prêmios físicos
  const [createPhysicalPrizeForm, setCreatePhysicalPrizeForm] = useState({
    name: "",
    description: "",
    image_url: "",
    estimated_value: 0,
    stock_quantity: 0,
    min_stock_alert: 5,
    rarity_weight: 5.0,
  })

  const [editPhysicalPrizeForm, setEditPhysicalPrizeForm] = useState({
    name: "",
    description: "",
    image_url: "",
    estimated_value: 0,
    min_stock_alert: 5,
    rarity_weight: 5.0,
    is_active: true,
  })

  const [addStockForm, setAddStockForm] = useState({
    quantity: 0,
    reason: "",
    admin_user: "admin",
  })

  const [editWinnerForm, setEditWinnerForm] = useState({
    winner_name: "",
    winner_phone: "",
    winner_email: "",
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zipcode: "",
    delivery_notes: "",
    status: "pending_contact",
    admin_notes: "",
    tracking_code: "",
  })

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

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
      fetchPhysicalPrizes()
      fetchPhysicalPrizeWinners()
      fetchPhysicalPrizeChance() // Adicionar esta linha
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

  const fetchPhysicalPrizes = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/physical-prizes/list", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setPhysicalPrizes(data.prizes || [])
        setPhysicalPrizesStats(data.stats || null)
      }
    } catch (error) {
      console.error("Erro ao buscar prêmios físicos:", error)
      toast.error("Erro ao carregar prêmios físicos")
    }
  }

  const fetchPhysicalPrizeWinners = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/physical-prizes/winners", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setPhysicalPrizeWinners(data.winners || [])
      }
    } catch (error) {
      console.error("Erro ao buscar ganhadores de prêmios físicos:", error)
      toast.error("Erro ao carregar ganhadores")
    }
  }

  const fetchPhysicalPrizeChance = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/admin/physical-prizes/chance", {
        headers: { "X-Admin-Token": adminToken },
      })
      if (response.ok) {
        const data = await response.json()
        setPhysicalPrizeChance(Number.parseFloat(data.percentage))
        setChanceForm({ percentage: Number.parseFloat(data.percentage) })
      }
    } catch (error) {
      console.error("Erro ao buscar chance de prêmios físicos:", error)
    }
  }

  const handleDeletePhysicalPrize = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o prêmio "${name}"?`)) return

    try {
      const response = await AuthClient.makeAuthenticatedRequest(`/api/admin/physical-prizes/${id}/delete`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken },
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchPhysicalPrizes()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir prêmio")
      }
    } catch (error) {
      console.error("Erro ao excluir prêmio:", error)
      toast.error("Erro interno do servidor")
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
        fetchManagers() // Atualizar saldos dos gerentes
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
      // Atualizar todos os dados em paralelo
      await Promise.all([
        fetchStats(),
        fetchAffiliateWithdraws(),
        fetchManagerWithdraws(),
        fetchAffiliates(),
        fetchManagers(),
        fetchSettings(),
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

              {/* Debug info */}
              <div className="text-xs text-gray-500 text-center mt-4">
                <p>Status: {isAuthenticating ? "Verificando..." : "Aguardando"}</p>
              </div>
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950">
        {/* Mobile Sidebar */}
        <Sidebar className="border-slate-700">
          <SidebarHeader className="border-b border-slate-700 p-4">
            <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {accessLevel === "full" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="dashboard"]')?.click()}
                      className="w-full justify-start"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="transactions"]')?.click()}
                      className="w-full justify-start"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Transações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="affiliates"]')?.click()}
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4" />
                      <span>Afiliados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => document.querySelector('[value="managers"]')?.click()}
                  className="w-full justify-start"
                >
                  <UserCog className="h-4 w-4" />
                  <span>Gerentes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {accessLevel === "full" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="affiliate-withdraws"]')?.click()}
                      className="w-full justify-start"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>Saques Afiliados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="manager-withdraws"]')?.click()}
                      className="w-full justify-start"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Saques Gerentes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="settings"]')?.click()}
                      className="w-full justify-start"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => document.querySelector('[value="performance"]')?.click()}
                      className="w-full justify-start"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Desempenho</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <div className="p-2 sm:p-4 lg:p-6">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-4 lg:mb-8">
              <div className="flex items-center space-x-2">
                <SidebarTrigger className="lg:hidden" />
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {accessLevel === "managers_only" ? "Painel de Gerentes" : "Painel Administrativo"}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 hidden sm:block">
                    {accessLevel === "managers_only"
                      ? "Gerencie gerentes e monitore suas atividades"
                      : "Gerencie afiliados, gerentes, configurações e monitore estatísticas da plataforma"}
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Controls - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 p-3 sm:p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-400" : "bg-gray-400"}`} />
                  <span className="text-xs sm:text-sm text-gray-400">
                    Auto-refresh: {autoRefresh ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Última: {lastUpdate.toLocaleTimeString("pt-BR")}</div>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="border-slate-600 text-white hover:bg-slate-700 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  {autoRefresh ? "Pausar" : "Ativar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="border-slate-600 text-white hover:bg-slate-700 bg-transparent flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Activity className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue={accessLevel === "managers_only" ? "managers" : "dashboard"}
              className="space-y-4 lg:space-y-6"
            >
              {/* Mobile-friendly Tab List */}
              <div className="overflow-x-auto">
                <TabsList className="bg-slate-800 border-slate-700 w-full sm:w-auto grid grid-cols-4 sm:flex h-auto">
                  {accessLevel === "full" && (
                    <>
                      <TabsTrigger
                        value="dashboard"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Dashboard</span>
                        <span className="sm:hidden">Dash</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="transactions"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Transações</span>
                        <span className="sm:hidden">Trans</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="affiliates"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Afiliados</span>
                        <span className="sm:hidden">Afil</span>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger
                    value="managers"
                    className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                  >
                    <UserCog className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Gerentes</span>
                    <span className="sm:hidden">Ger</span>
                  </TabsTrigger>
                  {accessLevel === "full" && (
                    <>
                      <TabsTrigger
                        value="affiliate-withdraws"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Saques Afiliados</span>
                        <span className="sm:hidden">S.Afil</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="manager-withdraws"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Saques Gerentes</span>
                        <span className="sm:hidden">S.Ger</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="settings"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Configurações</span>
                        <span className="sm:hidden">Config</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="performance"
                        className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                      >
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Desempenho</span>
                        <span className="sm:hidden">Perf</span>
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger
                    value="physical-prizes"
                    className="data-[state=active]:bg-slate-700 text-xs sm:text-sm p-2 sm:p-3"
                  >
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Prêmios Físicos</span>
                    <span className="sm:hidden">Prêmios</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Dashboard Tab - Mobile Optimized */}
              <TabsContent value="dashboard" className="space-y-4 lg:space-y-6">
                {stats && (
                  <>
                    {/* Stats Cards - Mobile Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-xs sm:text-sm">Usuários Online</p>
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                                {stats.users.online_now}
                              </p>
                              <p className="text-xs text-gray-500">Última hora</p>
                            </div>
                            <Eye className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-xs sm:text-sm">Receita Hoje</p>
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                                {formatCurrency(stats.financial.daily_revenue)}
                              </p>
                              <p className="text-xs text-gray-500">Lucro dos jogos</p>
                            </div>
                            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-xs sm:text-sm">Transações Hoje</p>
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">
                                {stats.transactions.today_transactions}
                              </p>
                              <p className="text-xs text-gray-500">{formatCurrency(stats.transactions.today_volume)}</p>
                            </div>
                            <Activity className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-400 text-xs sm:text-sm">Saques Pendentes</p>
                              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">
                                {stats.withdraws.pending_count}
                              </p>
                              <p className="text-xs text-gray-500">{formatCurrency(stats.withdraws.pending_amount)}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Financial Stats - Mobile Stack */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            <span>Situação Financeira</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Saldo da Plataforma</span>
                            <span className="text-green-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.platform_balance)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Saldo dos Usuários</span>
                            <span className="text-blue-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.total_user_balance)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Saques Pendentes</span>
                            <span className="text-yellow-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.pending_withdraws)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                            <span className="text-gray-300 font-medium text-xs sm:text-sm">Saldo Disponível</span>
                            <span className="text-white font-bold text-sm:text-lg">
                              {formatCurrency(stats.financial.available_balance)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                            <span>Receitas por Período</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Hoje</span>
                            <span className="text-green-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.daily_revenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Esta Semana</span>
                            <span className="text-blue-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.weekly_revenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Este Mês</span>
                            <span className="text-purple-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.financial.monthly_revenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                            <span className="text-gray-300 font-medium text-xs sm:text-sm">Margem de Lucro</span>
                            <span className="text-white font-bold text-sm:text-lg">
                              {stats.games.profit_margin.toFixed(1)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Users and Games Stats - Mobile Stack */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                            <span>Usuários</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Total de Usuários</span>
                            <span className="text-blue-400 font-bold text-sm:text-base">{stats.users.total}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Ativos Hoje</span>
                            <span className="text-green-400 font-bold text-sm:text-base">
                              {stats.users.active_today}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Novos esta Semana</span>
                            <span className="text-purple-400 font-bold text-sm:text-base">
                              {stats.users.new_this_week}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Bloggers</span>
                            <span className="text-yellow-400 font-bold text-sm:text-base">
                              {stats.users.blogger_count}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                            <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            <span>Jogos Hoje</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Jogadas</span>
                            <span className="text-green-400 font-bold text-sm:text-base">
                              {stats.games.today_plays}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Apostado</span>
                            <span className="text-red-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.games.today_spent)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs sm:text-sm">Pago em Prêmios</span>
                            <span className="text-yellow-400 font-bold text-sm:text-base">
                              {formatCurrency(stats.games.today_won)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                            <span className="text-gray-300 font-medium text-xs sm:text-sm">Lucro Hoje</span>
                            <span className="text-white font-bold text-sm:text-lg">
                              {formatCurrency(stats.games.today_spent - stats.games.today_won)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activities - Mobile Optimized */}
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                          <span>Atividades Recentes (24h)</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                          {stats.recent_activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-center justify-between p-2 sm:p-3 bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
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
                                  <p className="text-white text-xs sm:text-sm truncate">{activity.description}</p>
                                  <p className="text-gray-400 text-xs truncate">{activity.user_email}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                {activity.amount && (
                                  <p className="text-white font-medium text-xs sm:text-sm">
                                    {formatCurrency(activity.amount)}
                                  </p>
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

              {/* Transactions Tab - Mobile Optimized */}
              <TabsContent value="transactions" className="space-y-4 lg:space-y-6">
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Transações Recentes</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Lista das últimas transações do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {stats?.transactions?.detailed_list ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-gray-400 text-xs sm:text-sm">ID</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm">Usuário</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm">Tipo</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm">Valor</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                                PIX
                              </TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm">Saldo</TableHead>
                              <TableHead className="text-gray-400 text-xs sm:text-sm hidden sm:table-cell">
                                Data
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.transactions.detailed_list.map((transaction) => (
                              <TableRow key={transaction.id} className="hover:bg-slate-800 border-slate-700">
                                <TableCell className="font-mono text-xs">
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3 text-gray-500" />
                                    <span className="text-white">{transaction.id}</span>
                                  </div>
                                  {transaction.external_id && (
                                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                                      <Key className="h-3 w-3" />
                                      <span className="text-xs">{transaction.external_id}</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs">{transaction.user.name}</span>
                                    <span className="text-gray-500 text-xs">{transaction.user.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                                <TableCell
                                  className={`font-medium ${
                                    transaction.type === "deposit" || transaction.type === "game_prize"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  {transaction.pix_key ? (
                                    <div className="flex flex-col">
                                      <span className="text-white text-xs truncate max-w-32">
                                        {transaction.pix_key}
                                      </span>
                                      <span className="text-gray-500 text-xs">{transaction.pix_type}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-white">
                                  {formatCurrency(transaction.user.balance)}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-gray-400 text-xs">
                                  {formatDate(transaction.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-400">Carregando transações...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Affiliates Tab - Mobile Optimized */}
              <TabsContent value="affiliates" className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Gerenciar Afiliados</h2>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs sm:text-sm">
                        <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Novo Afiliado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Criar Novo Afiliado</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateAffiliate} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-white">
                              Nome
                            </Label>
                            <Input
                              id="name"
                              value={createForm.name}
                              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-white">
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={createForm.email}
                              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="username" className="text-white">
                              Nome de Usuário
                            </Label>
                            <Input
                              id="username"
                              value={createForm.username}
                              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="affiliate_code" className="text-white">
                              Código de Afiliado
                            </Label>
                            <Input
                              id="affiliate_code"
                              value={createForm.affiliate_code}
                              onChange={(e) => setCreateForm({ ...createForm, affiliate_code: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="password" className="text-white">
                              Senha
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={createForm.password}
                              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="commission_rate" className="text-white">
                              Taxa de Comissão (%)
                            </Label>
                            <Input
                              id="commission_rate"
                              type="number"
                              min="0"
                              max="100"
                              value={createForm.commission_rate}
                              onChange={(e) =>
                                setCreateForm({ ...createForm, commission_rate: Number(e.target.value) })
                              }
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="loss_commission_rate" className="text-white">
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
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            className="border-slate-600 text-white hover:bg-slate-700"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          >
                            Criar Afiliado
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Afiliado</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden sm:table-cell">
                              Código
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Comissão</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                              Referidos
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ganhos</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Saldo</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                              Gerente
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {affiliates.map((affiliate) => (
                            <TableRow key={affiliate.id} className="hover:bg-slate-800 border-slate-700">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-white text-xs sm:text-sm font-medium">{affiliate.name}</span>
                                  <span className="text-gray-500 text-xs">{affiliate.email}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline" className="border-slate-600 text-white">
                                  {affiliate.affiliate_code}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-green-400 text-xs sm:text-sm">
                                    {affiliate.commission_rate}%
                                  </span>
                                  {affiliate.loss_commission_rate > 0 && (
                                    <span className="text-red-400 text-xs">
                                      {affiliate.loss_commission_rate}% (perda)
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="text-white text-xs sm:text-sm">{affiliate.total_referrals}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-white text-xs sm:text-sm">
                                  {formatCurrency(affiliate.total_earnings)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-white text-xs sm:text-sm">
                                  {formatCurrency(affiliate.balance)}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
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
                                    className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openAssignManagerDialog(affiliate)}
                                    className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                  >
                                    {affiliate.manager_id ? (
                                      <>
                                        <Unlink className="h-3 w-3" />
                                        <span className="sr-only">Desvincular Gerente</span>
                                      </>
                                    ) : (
                                      <>
                                        <Link className="h-3 w-3" />
                                        <span className="sr-only">Vincular Gerente</span>
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAffiliate(affiliate.id)}
                                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Affiliate Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Editar Afiliado</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditAffiliate} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="edit-name" className="text-white">
                            Nome
                          </Label>
                          <Input
                            id="edit-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-email" className="text-white">
                            Email
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-username" className="text-white">
                            Nome de Usuário
                          </Label>
                          <Input
                            id="edit-username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-commission-rate" className="text-white">
                            Taxa de Comissão (%)
                          </Label>
                          <Input
                            id="edit-commission-rate"
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.commission_rate}
                            onChange={(e) => setEditForm({ ...editForm, commission_rate: Number(e.target.value) })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-loss-commission-rate" className="text-white">
                            Taxa de Comissão de Perda (%)
                          </Label>
                          <Input
                            id="edit-loss-commission-rate"
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.loss_commission_rate}
                            onChange={(e) => setEditForm({ ...editForm, loss_commission_rate: Number(e.target.value) })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-status" className="text-white">
                            Status
                          </Label>
                          <Select
                            value={editForm.status}
                            onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          className="border-slate-600 text-white hover:bg-slate-700"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          Salvar Alterações
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Assign Manager Dialog */}
                <Dialog open={isAssignManagerDialogOpen} onOpenChange={setIsAssignManagerDialogOpen}>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        {selectedAffiliateForManager?.manager_id
                          ? "Desvincular Gerente"
                          : "Vincular Afiliado a um Gerente"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-slate-800 p-3 rounded-md">
                        <p className="text-gray-400 text-xs">Afiliado</p>
                        <p className="text-white font-medium">{selectedAffiliateForManager?.name}</p>
                        <p className="text-gray-400 text-xs">{selectedAffiliateForManager?.email}</p>
                      </div>

                      {selectedAffiliateForManager?.manager_id ? (
                        <div className="space-y-4">
                          <div className="bg-slate-800 p-3 rounded-md">
                            <p className="text-gray-400 text-xs">Gerente Atual</p>
                            <div className="flex items-center space-x-2">
                              <UserCog className="h-4 w-4 text-blue-400" />
                              <p className="text-white font-medium">{selectedAffiliateForManager?.manager_name}</p>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAssignManagerDialogOpen(false)}
                              className="border-slate-600 text-white hover:bg-slate-700"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                if (selectedAffiliateForManager) {
                                  handleAssignManager(selectedAffiliateForManager.id, null)
                                  setIsAssignManagerDialogOpen(false)
                                }
                              }}
                            >
                              <Unlink className="h-4 w-4 mr-2" />
                              Desvincular Gerente
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="manager-id" className="text-white">
                              Selecione um Gerente
                            </Label>
                            <Select
                              onValueChange={(value) => {
                                if (selectedAffiliateForManager) {
                                  handleAssignManager(selectedAffiliateForManager.id, Number(value))
                                  setIsAssignManagerDialogOpen(false)
                                }
                              }}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Selecione um gerente" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {managers
                                  .filter((manager) => manager.status === "active")
                                  .map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id.toString()}>
                                      {manager.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAssignManagerDialogOpen(false)}
                              className="border-slate-600 text-white hover:bg-slate-700"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Managers Tab - Mobile Optimized */}
              <TabsContent value="managers" className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Gerenciar Gerentes</h2>
                  <Dialog open={isCreateManagerDialogOpen} onOpenChange={setIsCreateManagerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-xs sm:text-sm">
                        <UserCog className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Novo Gerente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Criar Novo Gerente</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateManager} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="manager-name" className="text-white">
                              Nome
                            </Label>
                            <Input
                              id="manager-name"
                              value={createManagerForm.name}
                              onChange={(e) => setCreateManagerForm({ ...createManagerForm, name: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="manager-email" className="text-white">
                              Email
                            </Label>
                            <Input
                              id="manager-email"
                              type="email"
                              value={createManagerForm.email}
                              onChange={(e) => setCreateManagerForm({ ...createManagerForm, email: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="manager-username" className="text-white">
                              Nome de Usuário
                            </Label>
                            <Input
                              id="manager-username"
                              value={createManagerForm.username}
                              onChange={(e) => setCreateManagerForm({ ...createManagerForm, username: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="manager-password" className="text-white">
                              Senha
                            </Label>
                            <Input
                              id="manager-password"
                              type="password"
                              value={createManagerForm.password}
                              onChange={(e) => setCreateManagerForm({ ...createManagerForm, password: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="manager-commission-rate" className="text-white">
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
                              className="bg-slate-800 border-slate-700 text-white"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateManagerDialogOpen(false)}
                            className="border-slate-600 text-white hover:bg-slate-700"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                          >
                            Criar Gerente
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Gerente</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Comissão</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                              Afiliados
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                              Referidos
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ganhos</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Saldo</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {managers.map((manager) => (
                            <TableRow key={manager.id} className="hover:bg-slate-800 border-slate-700">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-white text-xs sm:text-sm font-medium">{manager.name}</span>
                                  <span className="text-gray-500 text-xs">{manager.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-purple-400 text-xs sm:text-sm">{manager.commission_rate}%</span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <span className="text-white text-xs sm:text-sm">{manager.total_affiliates || 0}</span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-white text-xs sm:text-sm">
                                  {manager.total_referrals_managed || 0}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-white text-xs sm:text-sm">
                                  {formatCurrency(manager.total_earnings)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-white text-xs sm:text-sm">{formatCurrency(manager.balance)}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(manager.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditManagerDialog(manager)}
                                    className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteManager(manager.id)}
                                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Manager Dialog */}
                <Dialog open={isEditManagerDialogOpen} onOpenChange={setIsEditManagerDialogOpen}>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Editar Gerente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditManager} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="edit-manager-name" className="text-white">
                            Nome
                          </Label>
                          <Input
                            id="edit-manager-name"
                            value={editManagerForm.name}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, name: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-manager-email" className="text-white">
                            Email
                          </Label>
                          <Input
                            id="edit-manager-email"
                            type="email"
                            value={editManagerForm.email}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-manager-username" className="text-white">
                            Nome de Usuário
                          </Label>
                          <Input
                            id="edit-manager-username"
                            value={editManagerForm.username}
                            onChange={(e) => setEditManagerForm({ ...editManagerForm, username: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-manager-commission-rate" className="text-white">
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
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-manager-status" className="text-white">
                            Status
                          </Label>
                          <Select
                            value={editManagerForm.status}
                            onValueChange={(value) => setEditManagerForm({ ...editManagerForm, status: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditManagerDialogOpen(false)}
                          className="border-slate-600 text-white hover:bg-slate-700"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                        >
                          Salvar Alterações
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Affiliate Withdraws Tab - Mobile Optimized */}
              <TabsContent value="affiliate-withdraws" className="space-y-4 lg:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Saques de Afiliados</h2>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Afiliado</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Valor</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                              Chave PIX
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                              Solicitado
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {affiliateWithdraws.length > 0 ? (
                            affiliateWithdraws.map((withdraw) => (
                              <TableRow key={withdraw.id} className="hover:bg-slate-800 border-slate-700">
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs sm:text-sm font-medium">
                                      {withdraw.affiliate_name}
                                    </span>
                                    <span className="text-gray-500 text-xs">{withdraw.affiliate_email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-white text-xs sm:text-sm font-medium">
                                    {formatCurrency(withdraw.amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs truncate max-w-32">{withdraw.pix_key}</span>
                                    <span className="text-gray-500 text-xs">{withdraw.pix_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <span className="text-gray-400 text-xs">{formatDate(withdraw.created_at)}</span>
                                </TableCell>
                                <TableCell>
                                  {withdraw.status === "pending" ? (
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleProcessWithdraw(withdraw.id, "approve")}
                                        disabled={processingWithdraw === withdraw.id}
                                        className="h-7 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Aprovar</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleProcessWithdraw(withdraw.id, "reject")}
                                        disabled={processingWithdraw === withdraw.id}
                                        className="h-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Rejeitar</span>
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-gray-500 text-xs">
                                        {withdraw.processed_at ? formatDate(withdraw.processed_at) : "Processado"}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                                Nenhum saque de afiliado encontrado
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manager Withdraws Tab - Mobile Optimized */}
              <TabsContent value="manager-withdraws" className="space-y-4 lg:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Saques de Gerentes</h2>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Gerente</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Valor</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                              Chave PIX
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm hidden lg:table-cell">
                              Solicitado
                            </TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {managerWithdraws.length > 0 ? (
                            managerWithdraws.map((withdraw) => (
                              <TableRow key={withdraw.id} className="hover:bg-slate-800 border-slate-700">
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs sm:text-sm font-medium">
                                      {withdraw.manager_name}
                                    </span>
                                    <span className="text-gray-500 text-xs">{withdraw.manager_email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-white text-xs sm:text-sm font-medium">
                                    {formatCurrency(withdraw.amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex flex-col">
                                    <span className="text-white text-xs truncate max-w-32">{withdraw.pix_key}</span>
                                    <span className="text-gray-500 text-xs">{withdraw.pix_type}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <span className="text-gray-400 text-xs">{formatDate(withdraw.created_at)}</span>
                                </TableCell>
                                <TableCell>
                                  {withdraw.status === "pending" ? (
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleProcessManagerWithdraw(withdraw.id, "approve")}
                                        disabled={processingManagerWithdraw === withdraw.id}
                                        className="h-7 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Aprovar</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleProcessManagerWithdraw(withdraw.id, "reject")}
                                        disabled={processingManagerWithdraw === withdraw.id}
                                        className="h-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Rejeitar</span>
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-gray-500 text-xs">
                                        {withdraw.processed_at ? formatDate(withdraw.processed_at) : "Processado"}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                                Nenhum saque de gerente encontrado
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab - Mobile Optimized */}
              <TabsContent value="settings" className="space-y-4 lg:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Configurações do Sistema</h2>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                      Configurações Financeiras
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Defina os valores mínimos para depósitos e saques
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min-deposit" className="text-white">
                          Depósito Mínimo (R$)
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="min-deposit"
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.min_deposit_amount}
                            onChange={(e) => setSettingsForm({ ...settingsForm, min_deposit_amount: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <Button
                            onClick={() => handleUpdateSetting("min_deposit_amount", settingsForm.min_deposit_amount)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          >
                            Salvar
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Atual: {settings.min_deposit_amount?.value || "Não definido"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="min-withdraw" className="text-white">
                          Saque Mínimo (R$)
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="min-withdraw"
                            type="number"
                            min="0"
                            step="0.01"
                            value={settingsForm.min_withdraw_amount}
                            onChange={(e) => setSettingsForm({ ...settingsForm, min_withdraw_amount: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <Button
                            onClick={() => handleUpdateSetting("min_withdraw_amount", settingsForm.min_withdraw_amount)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          >
                            Salvar
                          </Button>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Atual: {settings.min_withdraw_amount?.value || "Não definido"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm sm:text-base lg:text-lg">Ações Administrativas</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Funções especiais para administradores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-white font-medium">Recalcular Saldos de Gerentes</h3>
                        <p className="text-gray-400 text-xs">
                          Recalcula os saldos dos gerentes com base nas comissões dos afiliados
                        </p>
                        <Button
                          onClick={async () => {
                            try {
                              const response = await AuthClient.makeAuthenticatedRequest(
                                "/api/admin/recalculate-manager-balances",
                                {
                                  method: "POST",
                                  headers: { "X-Admin-Token": adminToken },
                                },
                              )
                              if (response.ok) {
                                const data = await response.json()
                                toast.success(data.message || "Saldos recalculados com sucesso!")
                                fetchManagers()
                              } else {
                                const error = await response.json()
                                toast.error(error.error || "Erro ao recalcular saldos")
                              }
                            } catch (error) {
                              console.error("Erro ao recalcular saldos:", error)
                              toast.error("Erro interno do servidor")
                            }
                          }}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          Recalcular Saldos
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-white font-medium">Sincronizar Saldos de Gerentes</h3>
                        <p className="text-gray-400 text-xs">
                          Sincroniza os saldos dos gerentes com base nas comissões dos afiliados
                        </p>
                        <Button
                          onClick={async () => {
                            try {
                              const response = await AuthClient.makeAuthenticatedRequest(
                                "/api/admin/sync-manager-balances",
                                {
                                  method: "POST",
                                  headers: { "X-Admin-Token": adminToken },
                                },
                              )
                              if (response.ok) {
                                const data = await response.json()
                                toast.success(data.message || "Saldos sincronizados com sucesso!")
                                fetchManagers()
                              } else {
                                const error = await response.json()
                                toast.error(error.error || "Erro ao sincronizar saldos")
                              }
                            } catch (error) {
                              console.error("Erro ao sincronizar saldos:", error)
                              toast.error("Erro interno do servidor")
                            }
                          }}
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                        >
                          Sincronizar Saldos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab - Mobile Optimized */}
              <TabsContent value="performance" className="space-y-4 lg:space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Desempenho do Sistema</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Tempo Médio de Depósito</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                            {stats?.performance?.avg_deposit_time
                              ? `${stats.performance.avg_deposit_time.toFixed(1)}s`
                              : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">Processamento</p>
                        </div>
                        <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Tempo Médio de Saque</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">
                            {stats?.performance?.avg_withdraw_time
                              ? `${stats.performance.avg_withdraw_time.toFixed(1)}s`
                              : "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">Processamento</p>
                        </div>
                        <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Taxa de Erro da API</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-400">
                            {stats?.performance?.api_error_rate || "0%"}
                          </p>
                          <p className="text-xs text-gray-500">Últimas 24h</p>
                        </div>
                        <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Uptime do Sistema</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-400">
                            {stats?.performance?.system_uptime || "99.9%"}
                          </p>
                          <p className="text-xs text-gray-500">Últimos 30 dias</p>
                        </div>
                        <Activity className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center space-x-2 text-sm sm:text-base">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                      <span>Logs do Sistema</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-slate-800 rounded-md p-3 h-64 overflow-y-auto">
                      <p className="text-gray-400 text-xs">[2023-07-22 15:42:11] INFO: Sistema iniciado com sucesso</p>
                      <p className="text-gray-400 text-xs">
                        [2023-07-22 15:45:23] INFO: Conexão com banco de dados estabelecida
                      </p>
                      <p className="text-green-400 text-xs">
                        [2023-07-22 16:01:45] SUCCESS: Depósito #12345 processado com sucesso
                      </p>
                      <p className="text-yellow-400 text-xs">
                        [2023-07-22 16:12:33] WARNING: Tentativa de login inválida para usuário admin@example.com
                      </p>
                      <p className="text-gray-400 text-xs">
                        [2023-07-22 16:30:12] INFO: Backup do banco de dados concluído
                      </p>
                      <p className="text-red-400 text-xs">
                        [2023-07-22 16:45:18] ERROR: Falha na conexão com gateway de pagamento
                      </p>
                      <p className="text-gray-400 text-xs">
                        [2023-07-22 16:46:22] INFO: Reconexão com gateway de pagamento bem-sucedida
                      </p>
                      <p className="text-green-400 text-xs">
                        [2023-07-22 17:01:05] SUCCESS: Saque #5678 processado com sucesso
                      </p>
                      <p className="text-gray-400 text-xs">
                        [2023-07-22 17:15:30] INFO: Manutenção programada iniciada
                      </p>
                      <p className="text-gray-400 text-xs">
                        [2023-07-22 17:30:45] INFO: Manutenção programada concluída
                      </p>
                    </div>
                    <div className="mt-4">
                      <Textarea
                        placeholder="Digite um comando para executar..."
                        className="bg-slate-800 border-slate-700 text-white h-10"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                        >
                          Executar Comando
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Physical Prizes Tab */}
              <TabsContent value="physical-prizes" className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Gerenciar Prêmios Físicos</h2>
                  <Button
                    onClick={() => setIsCreatePhysicalPrizeDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs sm:text-sm"
                  >
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Novo Prêmio
                  </Button>
                </div>

                {/* Estatísticas dos Prêmios */}
                {physicalPrizesStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Total de Prêmios</p>
                            <p className="text-lg sm:text-xl font-bold text-white">
                              {physicalPrizesStats.prizes.total_prizes}
                            </p>
                          </div>
                          <Gift className="h-6 w-6 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Em Estoque</p>
                            <p className="text-lg sm:text-xl font-bold text-green-400">
                              {physicalPrizesStats.prizes.prizes_in_stock}
                            </p>
                          </div>
                          <Package className="h-6 w-6 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Ganhadores</p>
                            <p className="text-lg sm:text-xl font-bold text-blue-400">
                              {physicalPrizesStats.winners.total_winners}
                            </p>
                          </div>
                          <Trophy className="h-6 w-6 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Estoque Baixo</p>
                            <p className="text-lg sm:text-xl font-bold text-yellow-400">
                              {physicalPrizesStats.prizes.low_stock_alerts}
                            </p>
                          </div>
                          <AlertCircle className="h-6 w-6 text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Chance de Prêmio Físico</p>
                            <p className="text-lg sm:text-xl font-bold text-cyan-400">
                              {physicalPrizeChance.toFixed(2)}%
                            </p>
                          </div>
                          <Button
                            onClick={() => setIsChanceDialogOpen(true)}
                            className="h-6 w-6 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                            variant="ghost"
                            size="icon"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Lista de Prêmios */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm sm:text-base">Prêmios Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Prêmio</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Valor</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Estoque</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Raridade</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {physicalPrizes.map((prize) => (
                            <TableRow key={prize.id} className="hover:bg-slate-800 border-slate-700">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  {prize.image_url ? (
                                    <img
                                      src={prize.image_url || "/placeholder.svg"}
                                      alt={prize.name}
                                      className="w-10 h-10 object-contain rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(prize.name.charAt(0))}`
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                                      <Gift className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-white font-medium text-xs sm:text-sm">{prize.name}</p>
                                    {prize.description && (
                                      <p className="text-gray-400 text-xs truncate max-w-32">{prize.description}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-green-400 font-medium text-xs sm:text-sm">
                                  {formatCurrency(prize.estimated_value)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs sm:text-sm font-medium ${
                                      prize.stock_quantity <= prize.min_stock_alert ? "text-red-400" : "text-white"
                                    }`}
                                  >
                                    {prize.stock_quantity}
                                  </span>
                                  {prize.stock_quantity <= prize.min_stock_alert && (
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-purple-400 text-xs sm:text-sm">{prize.rarity_weight}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(prize.is_active ? "active" : "inactive")}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedPrizeForStock(prize)
                                      setIsAddStockDialogOpen(true)
                                    }}
                                    className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  >
                                    <Package className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingPhysicalPrize(prize)
                                      setEditPhysicalPrizeForm({
                                        name: prize.name,
                                        description: prize.description || "",
                                        image_url: prize.image_url || "",
                                        estimated_value: prize.estimated_value,
                                        min_stock_alert: prize.min_stock_alert,
                                        rarity_weight: prize.rarity_weight,
                                        is_active: prize.is_active,
                                      })
                                      setIsEditPhysicalPrizeDialogOpen(true)
                                    }}
                                    className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePhysicalPrize(prize.id, prize.name)}
                                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Ganhadores */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm sm:text-base">Ganhadores de Prêmios Físicos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ganhador</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Prêmio</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Jogo</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Status</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Data</TableHead>
                            <TableHead className="text-gray-400 text-xs sm:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {physicalPrizeWinners.map((winner) => (
                            <TableRow key={winner.id} className="hover:bg-slate-800 border-slate-700">
                              <TableCell>
                                <div>
                                  <p className="text-white font-medium text-xs sm:text-sm">{winner.user_name}</p>
                                  <p className="text-gray-400 text-xs">{winner.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {winner.prize_image_url && (
                                    <img
                                      src={winner.prize_image_url || "/placeholder.svg"}
                                      alt={winner.prize_name || ""}
                                      className="w-8 h-8 object-contain rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="text-white text-xs sm:text-sm">{winner.prize_name}</p>
                                    <p className="text-green-400 text-xs">
                                      {winner.prize_estimated_value ? formatCurrency(winner.prize_estimated_value) : ""}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-300 text-xs sm:text-sm">{winner.game_name}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(winner.status)}</TableCell>
                              <TableCell>
                                <span className="text-gray-400 text-xs">{formatDate(winner.created_at)}</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingWinner(winner)
                                    setEditWinnerForm({
                                      winner_name: winner.winner_name || "",
                                      winner_phone: winner.winner_phone || "",
                                      winner_email: winner.winner_email || "",
                                      delivery_address: winner.delivery_address || "",
                                      delivery_city: winner.delivery_city || "",
                                      delivery_state: winner.delivery_state || "",
                                      delivery_zipcode: winner.delivery_zipcode || "",
                                      delivery_notes: winner.delivery_notes || "",
                                      status: winner.status,
                                      admin_notes: winner.admin_notes || "",
                                      tracking_code: winner.tracking_code || "",
                                    })
                                    setIsEditWinnerDialogOpen(true)
                                  }}
                                  className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>

      {/* Create Physical Prize Dialog */}
      <Dialog open={isCreatePhysicalPrizeDialogOpen} onOpenChange={setIsCreatePhysicalPrizeDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Criar Novo Prêmio Físico</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                const response = await AuthClient.makeAuthenticatedRequest("/api/admin/physical-prizes/create", {
                  method: "POST",
                  headers: { "X-Admin-Token": adminToken },
                  body: JSON.stringify(createPhysicalPrizeForm),
                })

                if (response.ok) {
                  toast.success("Prêmio físico criado com sucesso!")
                  setIsCreatePhysicalPrizeDialogOpen(false)
                  setCreatePhysicalPrizeForm({
                    name: "",
                    description: "",
                    image_url: "",
                    estimated_value: 0,
                    stock_quantity: 0,
                    min_stock_alert: 5,
                    rarity_weight: 5.0,
                  })
                  fetchPhysicalPrizes()
                } else {
                  const error = await response.json()
                  toast.error(error.error || "Erro ao criar prêmio físico")
                }
              } catch (error) {
                console.error("Erro ao criar prêmio físico:", error)
                toast.error("Erro interno do servidor")
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="prize-name" className="text-white">
                  Nome do Prêmio
                </Label>
                <Input
                  id="prize-name"
                  value={createPhysicalPrizeForm.name}
                  onChange={(e) => setCreatePhysicalPrizeForm({ ...createPhysicalPrizeForm, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="prize-description" className="text-white">
                  Descrição
                </Label>
                <Textarea
                  id="prize-description"
                  value={createPhysicalPrizeForm.description}
                  onChange={(e) =>
                    setCreatePhysicalPrizeForm({ ...createPhysicalPrizeForm, description: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="prize-image" className="text-white">
                  URL da Imagem
                </Label>
                <Input
                  id="prize-image"
                  value={createPhysicalPrizeForm.image_url}
                  onChange={(e) =>
                    setCreatePhysicalPrizeForm({ ...createPhysicalPrizeForm, image_url: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="prize-value" className="text-white">
                    Valor Estimado (R$)
                  </Label>
                  <Input
                    id="prize-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createPhysicalPrizeForm.estimated_value}
                    onChange={(e) =>
                      setCreatePhysicalPrizeForm({
                        ...createPhysicalPrizeForm,
                        estimated_value: Number(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prize-stock" className="text-white">
                    Quantidade em Estoque
                  </Label>
                  <Input
                    id="prize-stock"
                    type="number"
                    min="0"
                    value={createPhysicalPrizeForm.stock_quantity}
                    onChange={(e) =>
                      setCreatePhysicalPrizeForm({ ...createPhysicalPrizeForm, stock_quantity: Number(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="prize-alert" className="text-white">
                    Alerta de Estoque Baixo
                  </Label>
                  <Input
                    id="prize-alert"
                    type="number"
                    min="0"
                    value={createPhysicalPrizeForm.min_stock_alert}
                    onChange={(e) =>
                      setCreatePhysicalPrizeForm({
                        ...createPhysicalPrizeForm,
                        min_stock_alert: Number(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prize-rarity" className="text-white">
                    Peso de Raridade
                  </Label>
                  <Input
                    id="prize-rarity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={createPhysicalPrizeForm.rarity_weight}
                    onChange={(e) =>
                      setCreatePhysicalPrizeForm({ ...createPhysicalPrizeForm, rarity_weight: Number(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatePhysicalPrizeDialogOpen(false)}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Criar Prêmio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Physical Prize Dialog */}
      <Dialog open={isEditPhysicalPrizeDialogOpen} onOpenChange={setIsEditPhysicalPrizeDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Prêmio Físico</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingPhysicalPrize) return

              try {
                const response = await AuthClient.makeAuthenticatedRequest(
                  `/api/admin/physical-prizes/${editingPhysicalPrize.id}/update`,
                  {
                    method: "PUT",
                    headers: { "X-Admin-Token": adminToken },
                    body: JSON.stringify(editPhysicalPrizeForm),
                  },
                )

                if (response.ok) {
                  toast.success("Prêmio físico atualizado com sucesso!")
                  setIsEditPhysicalPrizeDialogOpen(false)
                  setEditingPhysicalPrize(null)
                  fetchPhysicalPrizes()
                } else {
                  const error = await response.json()
                  toast.error(error.error || "Erro ao atualizar prêmio físico")
                }
              } catch (error) {
                console.error("Erro ao atualizar prêmio físico:", error)
                toast.error("Erro interno do servidor")
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-prize-name" className="text-white">
                  Nome do Prêmio
                </Label>
                <Input
                  id="edit-prize-name"
                  value={editPhysicalPrizeForm.name}
                  onChange={(e) => setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-prize-description" className="text-white">
                  Descrição
                </Label>
                <Textarea
                  id="edit-prize-description"
                  value={editPhysicalPrizeForm.description}
                  onChange={(e) => setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-prize-image" className="text-white">
                  URL da Imagem
                </Label>
                <Input
                  id="edit-prize-image"
                  value={editPhysicalPrizeForm.image_url}
                  onChange={(e) => setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, image_url: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-prize-value" className="text-white">
                    Valor Estimado (R$)
                  </Label>
                  <Input
                    id="edit-prize-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPhysicalPrizeForm.estimated_value}
                    onChange={(e) =>
                      setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, estimated_value: Number(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-prize-alert" className="text-white">
                    Alerta de Estoque Baixo
                  </Label>
                  <Input
                    id="edit-prize-alert"
                    type="number"
                    min="0"
                    value={editPhysicalPrizeForm.min_stock_alert}
                    onChange={(e) =>
                      setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, min_stock_alert: Number(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-prize-rarity" className="text-white">
                    Peso de Raridade
                  </Label>
                  <Input
                    id="edit-prize-rarity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={editPhysicalPrizeForm.rarity_weight}
                    onChange={(e) =>
                      setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, rarity_weight: Number(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-prize-status" className="text-white">
                    Status
                  </Label>
                  <Select
                    value={editPhysicalPrizeForm.is_active ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setEditPhysicalPrizeForm({ ...editPhysicalPrizeForm, is_active: value === "active" })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditPhysicalPrizeDialogOpen(false)}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Estoque</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!selectedPrizeForStock) return

              try {
                const response = await AuthClient.makeAuthenticatedRequest(
                  `/api/admin/physical-prizes/${selectedPrizeForStock.id}/stock`,
                  {
                    method: "POST",
                    headers: { "X-Admin-Token": adminToken },
                    body: JSON.stringify(addStockForm),
                  },
                )

                if (response.ok) {
                  toast.success("Estoque adicionado com sucesso!")
                  setIsAddStockDialogOpen(false)
                  setSelectedPrizeForStock(null)
                  setAddStockForm({
                    quantity: 0,
                    reason: "",
                    admin_user: "admin",
                  })
                  fetchPhysicalPrizes()
                } else {
                  const error = await response.json()
                  toast.error(error.error || "Erro ao adicionar estoque")
                }
              } catch (error) {
                console.error("Erro ao adicionar estoque:", error)
                toast.error("Erro interno do servidor")
              }
            }}
            className="space-y-4"
          >
            <div className="bg-slate-800 p-3 rounded-md">
              <p className="text-gray-400 text-xs">Prêmio</p>
              <p className="text-white font-medium">{selectedPrizeForStock?.name}</p>
              <p className="text-gray-400 text-xs">Estoque atual: {selectedPrizeForStock?.stock_quantity}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="stock-quantity" className="text-white">
                  Quantidade a Adicionar
                </Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="1"
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: Number(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock-reason" className="text-white">
                  Motivo
                </Label>
                <Input
                  id="stock-reason"
                  value={addStockForm.reason}
                  onChange={(e) => setAddStockForm({ ...addStockForm, reason: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: Reposição de estoque"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStockDialogOpen(false)}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Adicionar Estoque
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Winner Dialog */}
      <Dialog open={isEditWinnerDialogOpen} onOpenChange={setIsEditWinnerDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Ganhador</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editingWinner) return

              try {
                const response = await AuthClient.makeAuthenticatedRequest(
                  `/api/admin/physical-prizes/winners/${editingWinner.id}/update`,
                  {
                    method: "PUT",
                    headers: { "X-Admin-Token": adminToken },
                    body: JSON.stringify(editWinnerForm),
                  },
                )

                if (response.ok) {
                  toast.success("Ganhador atualizado com sucesso!")
                  setIsEditWinnerDialogOpen(false)
                  setEditingWinner(null)
                  fetchPhysicalPrizeWinners()
                } else {
                  const error = await response.json()
                  toast.error(error.error || "Erro ao atualizar ganhador")
                }
              } catch (error) {
                console.error("Erro ao atualizar ganhador:", error)
                toast.error("Erro interno do servidor")
              }
            }}
            className="space-y-4"
          >
            <div className="bg-slate-800 p-3 rounded-md">
              <p className="text-gray-400 text-xs">Prêmio Ganho</p>
              <p className="text-white font-medium">{editingWinner?.prize_name}</p>
              <p className="text-green-400 text-xs">
                {editingWinner?.prize_estimated_value ? formatCurrency(editingWinner.prize_estimated_value) : ""}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="winner-name" className="text-white">
                    Nome Completo
                  </Label>
                  <Input
                    id="winner-name"
                    value={editWinnerForm.winner_name}
                    onChange={(e) => setEditWinnerForm({ ...editWinnerForm, winner_name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="winner-phone" className="text-white">
                    Telefone
                  </Label>
                  <Input
                    id="winner-phone"
                    value={editWinnerForm.winner_phone}
                    onChange={(e) => setEditWinnerForm({ ...editWinnerForm, winner_phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="winner-email" className="text-white">
                  E-mail
                </Label>
                <Input
                  id="winner-email"
                  type="email"
                  value={editWinnerForm.winner_email}
                  onChange={(e) => setEditWinnerForm({ ...editWinnerForm, winner_email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="delivery-address" className="text-white">
                  Endereço de Entrega
                </Label>
                <Input
                  id="delivery-address"
                  value={editWinnerForm.delivery_address}
                  onChange={(e) => setEditWinnerForm({ ...editWinnerForm, delivery_address: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="delivery-city" className="text-white">
                    Cidade
                  </Label>
                  <Input
                    id="delivery-city"
                    value={editWinnerForm.delivery_city}
                    onChange={(e) => setEditWinnerForm({ ...editWinnerForm, delivery_city: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery-state" className="text-white">
                    Estado
                  </Label>
                  <Input
                    id="delivery-state"
                    value={editWinnerForm.delivery_state}
                    onChange={(e) => setEditWinnerForm({ ...editWinnerForm, delivery_state: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="delivery-zipcode" className="text-white">
                  CEP
                </Label>
                <Input
                  id="delivery-zipcode"
                  value={editWinnerForm.delivery_zipcode}
                  onChange={(e) => setEditWinnerForm({ ...editWinnerForm, delivery_zipcode: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="winner-status" className="text-white">
                  Status
                </Label>
                <Select
                  value={editWinnerForm.status}
                  onValueChange={(value) => setEditWinnerForm({ ...editWinnerForm, status: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="pending_contact">Aguardando Contato</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="address_collected">Endereço Coletado</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tracking-code" className="text-white">
                  Código de Rastreamento
                </Label>
                <Input
                  id="tracking-code"
                  value={editWinnerForm.tracking_code}
                  onChange={(e) => setEditWinnerForm({ ...editWinnerForm, tracking_code: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="admin-notes" className="text-white">
                  Observações do Admin
                </Label>
                <Textarea
                  id="admin-notes"
                  value={editWinnerForm.admin_notes}
                  onChange={(e) => setEditWinnerForm({ ...editWinnerForm, admin_notes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditWinnerDialogOpen(false)}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Configure Physical Prize Chance Dialog */}
      <Dialog open={isChanceDialogOpen} onOpenChange={setIsChanceDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Configurar Chance de Prêmios Físicos</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                const response = await AuthClient.makeAuthenticatedRequest("/api/admin/physical-prizes/chance", {
                  method: "POST",
                  headers: { "X-Admin-Token": adminToken },
                  body: JSON.stringify({ percentage: chanceForm.percentage }),
                })

                if (response.ok) {
                  const data = await response.json()
                  toast.success(data.message)
                  setIsChanceDialogOpen(false)
                  fetchPhysicalPrizeChance()
                } else {
                  const error = await response.json()
                  toast.error(error.error || "Erro ao salvar configuração")
                }
              } catch (error) {
                console.error("Erro ao salvar configuração:", error)
                toast.error("Erro interno do servidor")
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="chance-percentage" className="text-white">
                Porcentagem de Chance (%)
              </Label>
              <Input
                id="chance-percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={chanceForm.percentage}
                onChange={(e) => setChanceForm({ percentage: Number.parseFloat(e.target.value) || 0 })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
              <p className="text-gray-400 text-xs">
                Chance atual: {physicalPrizeChance.toFixed(2)}%
              </p>
              <p className="text-gray-400 text-xs">
                Define a probabilidade de um jogador ganhar um prêmio físico no jogo Raspe da Esperança
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
\
