"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Users, TrendingUp, LogOut, Copy, CheckCircle, Banknote } from "lucide-react"
import { toast } from "sonner"

// Dados fake hardcoded
const FAKE_AFFILIATE_DATA = {
  id: 19,
  name: "Ramon Mídia",
  email: "ramon.mida89@gmail.com",
  username: "ramonmidia",
  affiliate_code: "RAMON2024",
  balance: 54328.0,
  total_earnings: 54328.0,
  total_referrals: 1044,
  total_deposits: 6890,
}

const FAKE_USERS = [
  {
    id: 1,
    name: "Carlos Silva",
    email: "carlos.silva@gmail.com",
    created_at: "2025-01-10T14:30:00Z",
    total_deposits: 2,
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@hotmail.com",
    created_at: "2025-01-10T09:15:00Z",
    total_deposits: 1,
  },
  {
    id: 3,
    name: "João Oliveira",
    email: "joao.oliveira@yahoo.com",
    created_at: "2025-01-11T16:45:00Z",
    total_deposits: 3,
  },
  { id: 4, name: "Ana Costa", email: "ana.costa@gmail.com", created_at: "2025-01-11T11:20:00Z", total_deposits: 1 },
  {
    id: 5,
    name: "Pedro Almeida",
    email: "pedro.almeida@outlook.com",
    created_at: "2025-01-12T08:30:00Z",
    total_deposits: 2,
  },
  {
    id: 6,
    name: "Lucia Ferreira",
    email: "lucia.ferreira@gmail.com",
    created_at: "2025-01-12T13:10:00Z",
    total_deposits: 1,
  },
  {
    id: 7,
    name: "Roberto Lima",
    email: "roberto.lima@hotmail.com",
    created_at: "2025-01-13T10:45:00Z",
    total_deposits: 2,
  },
  {
    id: 8,
    name: "Fernanda Rocha",
    email: "fernanda.rocha@gmail.com",
    created_at: "2025-01-13T15:20:00Z",
    total_deposits: 1,
  },
  {
    id: 9,
    name: "Marcos Pereira",
    email: "marcos.pereira@yahoo.com",
    created_at: "2025-01-14T12:00:00Z",
    total_deposits: 3,
  },
  {
    id: 10,
    name: "Juliana Souza",
    email: "juliana.souza@gmail.com",
    created_at: "2025-01-14T17:30:00Z",
    total_deposits: 1,
  },
  {
    id: 11,
    name: "Ricardo Martins",
    email: "ricardo.martins@outlook.com",
    created_at: "2025-01-15T09:45:00Z",
    total_deposits: 2,
  },
  {
    id: 12,
    name: "Patricia Gomes",
    email: "patricia.gomes@gmail.com",
    created_at: "2025-01-15T14:15:00Z",
    total_deposits: 1,
  },
  {
    id: 13,
    name: "André Barbosa",
    email: "andre.barbosa@hotmail.com",
    created_at: "2025-01-16T11:30:00Z",
    total_deposits: 2,
  },
  {
    id: 14,
    name: "Camila Dias",
    email: "camila.dias@gmail.com",
    created_at: "2025-01-16T16:00:00Z",
    total_deposits: 1,
  },
  {
    id: 15,
    name: "Bruno Cardoso",
    email: "bruno.cardoso@yahoo.com",
    created_at: "2025-01-16T19:45:00Z",
    total_deposits: 3,
  },
]

const FAKE_DEPOSITS = [
  {
    id: 1,
    user_name: "Carlos Silva",
    amount: 50.0,
    status: "completed",
    created_at: "2025-01-10T14:35:00Z",
    commission: 10.0,
  },
  {
    id: 2,
    user_name: "Carlos Silva",
    amount: 75.0,
    status: "completed",
    created_at: "2025-01-10T18:20:00Z",
    commission: 10.0,
  },
  {
    id: 3,
    user_name: "Maria Santos",
    amount: 100.0,
    status: "completed",
    created_at: "2025-01-10T09:20:00Z",
    commission: 10.0,
  },
  {
    id: 4,
    user_name: "João Oliveira",
    amount: 30.0,
    status: "completed",
    created_at: "2025-01-11T16:50:00Z",
    commission: 10.0,
  },
  {
    id: 5,
    user_name: "João Oliveira",
    amount: 60.0,
    status: "completed",
    created_at: "2025-01-11T20:15:00Z",
    commission: 10.0,
  },
  {
    id: 6,
    user_name: "João Oliveira",
    amount: 40.0,
    status: "completed",
    created_at: "2025-01-12T10:30:00Z",
    commission: 10.0,
  },
  {
    id: 7,
    user_name: "Ana Costa",
    amount: 80.0,
    status: "completed",
    created_at: "2025-01-11T11:25:00Z",
    commission: 10.0,
  },
  {
    id: 8,
    user_name: "Pedro Almeida",
    amount: 45.0,
    status: "completed",
    created_at: "2025-01-12T08:35:00Z",
    commission: 10.0,
  },
  {
    id: 9,
    user_name: "Pedro Almeida",
    amount: 90.0,
    status: "completed",
    created_at: "2025-01-12T15:45:00Z",
    commission: 10.0,
  },
  {
    id: 10,
    user_name: "Lucia Ferreira",
    amount: 65.0,
    status: "completed",
    created_at: "2025-01-12T13:15:00Z",
    commission: 10.0,
  },
  {
    id: 11,
    user_name: "Roberto Lima",
    amount: 55.0,
    status: "completed",
    created_at: "2025-01-13T10:50:00Z",
    commission: 10.0,
  },
  {
    id: 12,
    user_name: "Roberto Lima",
    amount: 85.0,
    status: "completed",
    created_at: "2025-01-13T19:20:00Z",
    commission: 10.0,
  },
  {
    id: 13,
    user_name: "Fernanda Rocha",
    amount: 70.0,
    status: "completed",
    created_at: "2025-01-13T15:25:00Z",
    commission: 10.0,
  },
  {
    id: 14,
    user_name: "Marcos Pereira",
    amount: 35.0,
    status: "completed",
    created_at: "2025-01-14T12:05:00Z",
    commission: 10.0,
  },
  {
    id: 15,
    user_name: "Marcos Pereira",
    amount: 95.0,
    status: "completed",
    created_at: "2025-01-14T16:30:00Z",
    commission: 10.0,
  },
  {
    id: 16,
    user_name: "Marcos Pereira",
    amount: 25.0,
    status: "completed",
    created_at: "2025-01-15T09:15:00Z",
    commission: 10.0,
  },
  {
    id: 17,
    user_name: "Juliana Souza",
    amount: 50.0,
    status: "completed",
    created_at: "2025-01-14T17:35:00Z",
    commission: 10.0,
  },
  {
    id: 18,
    user_name: "Ricardo Martins",
    amount: 60.0,
    status: "completed",
    created_at: "2025-01-15T09:50:00Z",
    commission: 10.0,
  },
  {
    id: 19,
    user_name: "Ricardo Martins",
    amount: 40.0,
    status: "completed",
    created_at: "2025-01-15T14:20:00Z",
    commission: 10.0,
  },
  {
    id: 20,
    user_name: "Patricia Gomes",
    amount: 75.0,
    status: "completed",
    created_at: "2025-01-15T14:20:00Z",
    commission: 10.0,
  },
]

const FAKE_COMMISSIONS = FAKE_DEPOSITS.map((deposit, index) => ({
  id: index + 1,
  user_name: deposit.user_name,
  deposit_amount: deposit.amount,
  commission_amount: deposit.commission,
  status: "paid",
  created_at: deposit.created_at,
  type: "deposit_commission",
}))

export default function AffiliateDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [affiliateData, setAffiliateData] = useState(FAKE_AFFILIATE_DATA)

  useEffect(() => {
    // Verificar se está autenticado
    const token = localStorage.getItem("affiliate-demo-token")
    if (!token) {
      router.push("/affiliate/log")
      return
    }

    // Simular carregamento
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("affiliate-demo-token")
    localStorage.removeItem("affiliate-demo-data")
    router.push("/affiliate/log")
  }

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/?ref=${affiliateData.affiliate_code}`
    navigator.clipboard.writeText(link)
    toast.success("Link de afiliado copiado!")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Afiliado</h1>
            <p className="text-gray-400">Bem-vindo, {affiliateData.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Saldo Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(affiliateData.balance)}</div>
              <p className="text-xs text-gray-400">Total acumulado</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Referidos</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{affiliateData.total_referrals}</div>
              <p className="text-xs text-gray-400">Usuários cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Depósitos PIX</CardTitle>
              <Banknote className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{affiliateData.total_deposits}</div>
              <p className="text-xs text-gray-400">Depósitos confirmados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">6890</div>
              <p className="text-xs text-gray-400">R$ 10,00 por depósito</p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Link */}
        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Seu Link de Afiliado</CardTitle>
            <CardDescription className="text-gray-400">Compartilhe este link para ganhar comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-800 rounded-md text-sm text-gray-300 font-mono">
                {`${typeof window !== "undefined" ? window.location.origin : "https://raspay.com"}/?ref=${affiliateData.affiliate_code}`}
              </div>
              <Button onClick={copyAffiliateLink} size="sm" className="bg-red-600 hover:bg-red-700">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900/50 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-600">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-red-600">
              Depósitos PIX
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-red-600">
              Comissões
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-red-600">
              Referidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Últimos Depósitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {FAKE_DEPOSITS.slice(0, 5).map((deposit) => (
                      <div key={deposit.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{deposit.user_name}</p>
                          <p className="text-xs text-gray-400">{formatDate(deposit.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-500 font-bold">{formatCurrency(deposit.amount)}</p>
                          <p className="text-xs text-purple-400">+{formatCurrency(deposit.commission)} comissão</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Novos Referidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {FAKE_USERS.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-green-900/30 text-green-400">
                            {user.total_deposits} depósito{user.total_deposits > 1 ? "s" : ""}
                          </Badge>
                          <p className="text-xs text-gray-400">{formatDate(user.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deposits">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Depósitos PIX</CardTitle>
                <CardDescription className="text-gray-400">
                  Todos os depósitos realizados pelos seus referidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Usuário</TableHead>
                      <TableHead className="text-gray-400">Valor</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Comissão</TableHead>
                      <TableHead className="text-gray-400">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FAKE_DEPOSITS.map((deposit) => (
                      <TableRow key={deposit.id} className="border-gray-700">
                        <TableCell className="text-white">{deposit.user_name}</TableCell>
                        <TableCell className="text-green-500 font-bold">{formatCurrency(deposit.amount)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-900/30 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-400 font-bold">
                          {formatCurrency(deposit.commission)}
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(deposit.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Comissões</CardTitle>
                <CardDescription className="text-gray-400">
                  Todas as comissões recebidas dos seus referidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Usuário</TableHead>
                      <TableHead className="text-gray-400">Depósito</TableHead>
                      <TableHead className="text-gray-400">Comissão</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FAKE_COMMISSIONS.map((commission) => (
                      <TableRow key={commission.id} className="border-gray-700">
                        <TableCell className="text-white">{commission.user_name}</TableCell>
                        <TableCell className="text-gray-400">{formatCurrency(commission.deposit_amount)}</TableCell>
                        <TableCell className="text-green-500 font-bold">
                          {formatCurrency(commission.commission_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-900/30 text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(commission.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Seus Referidos</CardTitle>
                <CardDescription className="text-gray-400">
                  Usuários que se cadastraram através do seu link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Depósitos</TableHead>
                      <TableHead className="text-gray-400">Data Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FAKE_USERS.map((user) => (
                      <TableRow key={user.id} className="border-gray-700">
                        <TableCell className="text-white">{user.name}</TableCell>
                        <TableCell className="text-gray-400">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-900/30 text-blue-400">
                            {user.total_deposits}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(user.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
