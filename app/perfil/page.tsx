"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { AuthClient } from "@/lib/auth-client"
import { FloatingBalance } from "@/components/floating-balance"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  User,
  CreditCard,
  Lock,
  Calendar,
  Mail,
  Phone,
  UserCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  Share2,
  Copy,
  ExternalLink,
  Users,
  TrendingUp,
  Gift,
  Menu,
  Wallet,
} from "lucide-react"

interface UserProfile {
  user: {
    id: number
    name: string
    username: string
    email: string
    phone: string
    user_type: string
    created_at: string
  }
  wallet: {
    balance: number
  }
}

interface Deposit {
  id: number
  amount: number
  status: string
  external_id: number
  created_at: string
  payer_name?: string
  end_to_end_id?: string
}

interface ReferralData {
  id: number
  referred_name: string
  referred_email: string
  referred_created_at: string
  bonus_amount: number
  bonus_paid: boolean
  bonus_paid_at?: string
  has_valid_deposit: boolean
}

interface ReferralStats {
  total_referrals: number
  paid_referrals: number
  total_earned: number
  active_referrals: number
}

export default function PerfilPage() {
  const searchParams = useSearchParams()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Get initial tab from URL params
  const initialTab = searchParams?.get("tab") || "deposits"

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    phone: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total_referrals: 0,
    paid_referrals: 0,
    total_earned: 0,
    active_referrals: 0,
  })
  const [referralLink, setReferralLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    fetchDeposits()
    fetchReferrals()
    generateReferralLink()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        setProfileForm({
          name: data.user.name || "",
          username: data.user.username || "",
          phone: data.user.phone || "",
        })
      } else {
        toast.error("Erro ao carregar perfil")
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      toast.error("Erro ao carregar perfil")
    }
  }

  const fetchDeposits = async () => {
    try {
      setLoading(true)
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/deposits")
      if (response.ok) {
        const data = await response.json()
        setDeposits(data.deposits || [])
      } else {
        toast.error("Erro ao carregar histórico de depósitos")
      }
    } catch (error) {
      console.error("Erro ao buscar depósitos:", error)
      toast.error("Erro ao carregar histórico de depósitos")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      })

      if (response.ok) {
        toast.success("Perfil atualizado com sucesso!")
        await fetchUserProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil")
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    setChangingPassword(true)

    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Senha alterada com sucesso!")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao alterar senha")
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      toast.error("Erro ao alterar senha")
    } finally {
      setChangingPassword(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const fetchReferrals = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/referral/list")
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals || [])
        setReferralStats(
          data.stats || {
            total_referrals: 0,
            paid_referrals: 0,
            total_earned: 0,
            active_referrals: 0,
          },
        )
      } else {
        toast.error("Erro ao carregar indicações")
      }
    } catch (error) {
      console.error("Erro ao buscar indicações:", error)
      toast.error("Erro ao carregar indicações")
    }
  }

  const generateReferralLink = async () => {
    try {
      setIsGeneratingLink(true)
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/referral/generate", {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setReferralLink(data.referral_url)
      }
    } catch (error) {
      console.error("Erro ao gerar link:", error)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Link copiado para a área de transferência")
    } catch (error) {
      toast.error("Não foi possível copiar o link")
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "RasPay - Jogos de Raspadinha",
          text: "Venha jogar comigo no RasPay! Cadastre-se pelo meu link e ganhe bônus!",
          url: referralLink,
        })
      } catch (error) {
        console.log("Compartilhamento cancelado")
      }
    } else {
      copyToClipboard(referralLink)
    }
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando perfil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
        {/* Header with Menu */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden p-2 text-purple-400 hover:bg-purple-400/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-slate-900 border-slate-700">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-3 p-4 border-b border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{userProfile?.user?.name || "Usuário"}</p>
                      <p className="text-sm text-gray-400">@{userProfile?.user?.username || "usuario"}</p>
                    </div>
                  </div>

                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      <a
                        href="/home"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Início</span>
                      </a>
                      <a
                        href="/jogos"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Jogos</span>
                      </a>
                      <a
                        href="/deposito"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Depositar</span>
                      </a>
                      <a
                        href="/saque"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Sacar</span>
                      </a>
                      <a
                        href="/vencedores"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Vencedores</span>
                      </a>
                      <a
                        href="/perfil"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-purple-600 text-white transition-colors"
                      >
                        <UserCircle className="h-4 w-4" />
                        <span>Perfil</span>
                      </a>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-3">
              <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Perfil</h1>
                <p className="text-sm text-gray-400">Gerencie suas informações pessoais</p>
              </div>
            </div>
          </div>
          <div
            className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => (window.location.href = "/deposito")}
          >
            <Wallet className="h-4 w-4 text-green-400" />
            <span className="text-white font-semibold text-sm md:text-base">
              R$ {userProfile?.wallet?.balance ? Number(userProfile.wallet.balance).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        {/* Mobile-Optimized Tabs */}
        <Tabs defaultValue={initialTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700 h-auto">
            <TabsTrigger
              value="deposits"
              className="data-[state=active]:bg-purple-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Depósitos</span>
              <span className="sm:hidden">Depósitos</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-purple-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Informações</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="data-[state=active]:bg-purple-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Senha</span>
              <span className="sm:hidden">Senha</span>
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="data-[state=active]:bg-purple-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Indicações</span>
              <span className="sm:hidden">Indic.</span>
            </TabsTrigger>
          </TabsList>

          {/* Deposits Tab - Mobile Optimized */}
          <TabsContent value="deposits">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Histórico de Depósitos
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm">
                  Visualize todos os seus depósitos realizados
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {loading ? (
                  <div className="text-center py-8 text-gray-300">Carregando histórico...</div>
                ) : deposits.length === 0 ? (
                  <div className="text-center py-8 text-gray-300">Nenhum depósito encontrado</div>
                ) : (
                  <div className="space-y-3 sm:hidden">
                    {/* Mobile Card Layout */}
                    {deposits.map((deposit) => (
                      <Card key={deposit.id} className="bg-slate-700/50 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-white font-semibold text-lg">
                              {formatCurrency(Number(deposit.amount))}
                            </div>
                            {getStatusBadge(deposit.status)}
                          </div>
                          <div className="space-y-1 text-sm text-gray-300">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-2" />
                              {formatDate(deposit.created_at)}
                            </div>
                            <div>ID: #{deposit.external_id}</div>
                            {deposit.payer_name && <div>Pagador: {deposit.payer_name}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Desktop Table Layout */}
                {!loading && deposits.length > 0 && (
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-gray-300">Data</TableHead>
                          <TableHead className="text-gray-300">Valor</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">ID Externo</TableHead>
                          <TableHead className="text-gray-300">Pagador</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deposits.map((deposit) => (
                          <TableRow key={deposit.id} className="border-slate-700">
                            <TableCell className="text-gray-300">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {formatDate(deposit.created_at)}
                              </div>
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              {formatCurrency(Number(deposit.amount))}
                            </TableCell>
                            <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                            <TableCell className="text-gray-300">#{deposit.external_id}</TableCell>
                            <TableCell className="text-gray-300">{deposit.payer_name || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab - Mobile Optimized */}
          <TabsContent value="profile">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm">Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300 text-sm">
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-300 text-sm">
                        Nome de Usuário
                      </Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300 text-sm">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          value={userProfile.user.email}
                          className="bg-slate-700 border-slate-600 text-gray-400 pl-10 h-11"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-gray-400">O email não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300 text-sm">
                        Telefone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white pl-10 h-11"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-11"
                    >
                      {updating ? "Atualizando..." : "Atualizar Perfil"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab - Mobile Optimized */}
          <TabsContent value="password">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Alterar Senha
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm">
                  Mantenha sua conta segura alterando sua senha regularmente
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-300 text-sm">
                      Senha Atual
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white pr-12 h-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-300 text-sm">
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white pr-12 h-11"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">A senha deve ter pelo menos 6 caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white pr-12 h-11"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-11"
                    >
                      {changingPassword ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab - Mobile Optimized */}
          <TabsContent value="referrals">
            <div className="space-y-4 sm:space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-white">{referralStats.total_referrals}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Total</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-white">{referralStats.active_referrals}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Ativos</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-white">{referralStats.paid_referrals}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Pagos</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-green-400 text-lg sm:text-2xl font-bold mb-2">R$</div>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {Number(referralStats.total_earned).toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">Ganho</p>
                  </CardContent>
                </Card>
              </div>

              {/* Link de Indicação */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Seu Link de Indicação
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Compartilhe com amigos. Quando se cadastrarem e fizerem o primeiro depósito, você ganha R$ 5!
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-slate-900 rounded-lg border border-slate-600">
                      <p className="text-white text-xs sm:text-sm break-all">{referralLink || "Gerando link..."}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      disabled={!referralLink || isGeneratingLink}
                      className="bg-purple-600 hover:bg-purple-700 px-3"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={shareLink}
                      disabled={!referralLink || isGeneratingLink}
                      className="bg-blue-600 hover:bg-blue-700 px-3"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Indicações */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg sm:text-xl">Suas Indicações</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Acompanhe o status das suas indicações
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {referrals.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2 text-sm sm:text-base">Nenhuma indicação ainda</p>
                      <p className="text-xs sm:text-sm text-gray-500">Compartilhe seu link para começar a ganhar!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600 space-y-2 sm:space-y-0"
                        >
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm sm:text-base">{referral.referred_name}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">{referral.referred_email}</p>
                            <p className="text-gray-500 text-xs">
                              Cadastrado em {formatDate(referral.referred_created_at)}
                            </p>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-1">
                            {referral.bonus_paid ? (
                              <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                R$ {Number(referral.bonus_amount).toFixed(2)}
                              </Badge>
                            ) : referral.has_valid_deposit ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Processando
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Aguardando depósito
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingBalance />
      <MobileBottomNav />
    </div>
  )
}
