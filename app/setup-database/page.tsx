"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Users,
  CreditCard,
  Gamepad2,
  Webhook,
  Server,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Settings,
  Activity,
  Zap,
  Shield,
  Crown,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SetupStats {
  connection: {
    status: string
    timestamp: string
  }
  tables: {
    total: number
    list: string[]
    expected: string[]
    missing: string[]
  }
  users: {
    total: number
    list: Array<{
      id: number
      name: string
      email: string
      user_type: string
      balance: number
      created_at: string
    }>
  }
  transactions: {
    total: number
    deposits: number
    withdraws: number
    successful: number
    pending: number
    failed: number
  }
  games: {
    total_plays: number
    total_wins: number
    total_bet: number
    total_won: number
  }
  webhooks: {
    total: number
    processed: number
    pending: number
  }
}

interface SetupResponse {
  success: boolean
  setupComplete: boolean
  stats: SetupStats
  recommendations: string[]
  error?: string
}

export default function SetupDatabasePage() {
  const [setupData, setSetupData] = useState<SetupResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswords, setShowPasswords] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchSetupStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/setup-database")
      const data = await response.json()
      setSetupData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Erro ao verificar setup:", error)
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do banco de dados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSetupStatus()
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    })
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return condition ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        {trueText}
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        {falseText}
      </Badge>
    )
  }

  const testCredentials = [
    {
      type: "Admin",
      icon: <Crown className="h-4 w-4 text-yellow-600" />,
      email: "admin@raspay.com",
      password: "admin123",
      description: "Acesso administrativo completo",
      color: "border-yellow-200 bg-yellow-50",
    },
    {
      type: "Blogger",
      icon: <Users className="h-4 w-4 text-blue-600" />,
      email: "blogger@raspay.com",
      password: "admin123",
      description: "Conta para testes com saldo inicial",
      color: "border-blue-200 bg-blue-50",
    },
    {
      type: "Teste",
      icon: <Users className="h-4 w-4 text-green-600" />,
      email: "teste@raspay.com",
      password: "admin123",
      description: "Usuário regular para testes",
      color: "border-green-200 bg-green-50",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Verificando Banco de Dados</h2>
          <p className="text-slate-500">Aguarde enquanto verificamos o status do sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Setup do Banco de Dados - <span className="text-blue-600">RasPay</span>
          </h1>
          <p className="text-xl text-slate-600 mb-6">Verificação e configuração do sistema de banco de dados</p>
          {lastUpdate && (
            <p className="text-sm text-slate-500 flex items-center justify-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Última verificação: {lastUpdate.toLocaleString("pt-BR")}</span>
            </p>
          )}
        </div>

        {/* Status Geral */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">Status do Sistema</CardTitle>
                  <CardDescription>Verificação geral do banco de dados RasPay</CardDescription>
                </div>
              </div>
              <Button onClick={fetchSetupStatus} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {setupData?.success ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  {getStatusIcon(setupData.setupComplete)}
                  <h3 className="font-semibold text-slate-900 mt-2">Setup Completo</h3>
                  <p className="text-sm text-slate-600">
                    {setupData.setupComplete ? "Sistema pronto" : "Configuração pendente"}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {getStatusIcon(setupData.stats.connection.status === "connected")}
                  <h3 className="font-semibold text-slate-900 mt-2">Conexão</h3>
                  <p className="text-sm text-slate-600">
                    {setupData.stats.connection.status === "connected" ? "Conectado" : "Desconectado"}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  {getStatusIcon(setupData.stats.tables.missing.length === 0)}
                  <h3 className="font-semibold text-slate-900 mt-2">Tabelas</h3>
                  <p className="text-sm text-slate-600">
                    {setupData.stats.tables.total} de {setupData.stats.tables.expected.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  {getStatusIcon(setupData.stats.users.total >= 3)}
                  <h3 className="font-semibold text-slate-900 mt-2">Usuários</h3>
                  <p className="text-sm text-slate-600">{setupData.stats.users.total} cadastrados</p>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro de Conexão:</strong> {setupData?.error || "Não foi possível conectar ao banco de dados"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {setupData?.success && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="tables">Tabelas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              <TabsTrigger value="guide">Guia</TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Estatísticas de Transações */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span>Transações</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-semibold">{setupData.stats.transactions.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Depósitos:</span>
                        <span className="font-semibold text-green-600">{setupData.stats.transactions.deposits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Saques:</span>
                        <span className="font-semibold text-red-600">{setupData.stats.transactions.withdraws}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bem-sucedidas:</span>
                        <span className="font-semibold text-blue-600">{setupData.stats.transactions.successful}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estatísticas de Jogos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Gamepad2 className="h-5 w-5 text-purple-600" />
                      <span>Jogos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Jogadas:</span>
                        <span className="font-semibold">{setupData.stats.games.total_plays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Vitórias:</span>
                        <span className="font-semibold text-green-600">{setupData.stats.games.total_wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Apostado:</span>
                        <span className="font-semibold">
                          R$ {setupData.stats.games.total_bet?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ganho:</span>
                        <span className="font-semibold text-yellow-600">
                          R$ {setupData.stats.games.total_won?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estatísticas de Webhooks */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Webhook className="h-5 w-5 text-orange-600" />
                      <span>Webhooks</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-semibold">{setupData.stats.webhooks.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Processados:</span>
                        <span className="font-semibold text-green-600">{setupData.stats.webhooks.processed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pendentes:</span>
                        <span className="font-semibold text-yellow-600">{setupData.stats.webhooks.pending}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendações */}
              {setupData.recommendations.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span>Recomendações</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {setupData.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            rec.includes("✅")
                              ? "bg-green-50 border-green-200 text-green-800"
                              : rec.includes("🔐") || rec.includes("🧪")
                                ? "bg-blue-50 border-blue-200 text-blue-800"
                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                          }`}
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tabelas */}
            <TabsContent value="tables">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>Status das Tabelas</span>
                  </CardTitle>
                  <CardDescription>Verificação das tabelas do banco de dados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Tabelas Esperadas</h3>
                      <div className="space-y-2">
                        {setupData.stats.tables.expected.map((table) => (
                          <div key={table} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="font-mono text-sm">{table}</span>
                            {getStatusBadge(setupData.stats.tables.list.includes(table), "Criada", "Ausente")}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Resumo</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Total de Tabelas:</span>
                            <span className="font-bold text-blue-600">{setupData.stats.tables.total}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Tabelas Criadas:</span>
                            <span className="font-bold text-green-600">
                              {setupData.stats.tables.expected.length - setupData.stats.tables.missing.length}
                            </span>
                          </div>
                        </div>
                        {setupData.stats.tables.missing.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700">Tabelas Ausentes:</span>
                              <span className="font-bold text-red-600">{setupData.stats.tables.missing.length}</span>
                            </div>
                            <div className="mt-2 text-sm text-red-700">{setupData.stats.tables.missing.join(", ")}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usuários */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Usuários do Sistema</span>
                  </CardTitle>
                  <CardDescription>Lista de usuários cadastrados no banco de dados</CardDescription>
                </CardHeader>
                <CardContent>
                  {setupData.stats.users.total > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Saldo</TableHead>
                          <TableHead>Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {setupData.stats.users.list.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono">{user.id}</TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.user_type === "admin"
                                    ? "destructive"
                                    : user.user_type === "blogger"
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {user.user_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">R$ {user.balance?.toFixed(2) || "0.00"}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(user.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum usuário encontrado</h3>
                      <p className="text-slate-500">Execute o script SQL para criar os usuários de teste</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credenciais */}
            <TabsContent value="credentials">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-yellow-600" />
                    <span>Credenciais de Teste</span>
                  </CardTitle>
                  <CardDescription>Use estas credenciais para testar o sistema após o setup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testCredentials.map((cred, index) => (
                      <div key={index} className={`p-4 rounded-lg border-2 ${cred.color}`}>
                        <div className="flex items-center space-x-2 mb-3">
                          {cred.icon}
                          <h3 className="font-semibold text-slate-900">{cred.type}</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-slate-600">Email:</label>
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-white px-2 py-1 rounded border flex-1">{cred.email}</code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cred.email, "Email")}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">Senha:</label>
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-white px-2 py-1 rounded border flex-1">
                                {showPasswords ? cred.password : "••••••••"}
                              </code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(cred.password, "Senha")}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-2">{cred.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="flex items-center space-x-2"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span>{showPasswords ? "Ocultar" : "Mostrar"} Senhas</span>
                    </Button>
                    <div className="flex space-x-2">
                      <Button asChild>
                        <a href="/auth" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Testar Login
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guia */}
            <TabsContent value="guide">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span>Guia de Setup</span>
                  </CardTitle>
                  <CardDescription>Instruções passo-a-passo para configurar o banco de dados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Passo 1 */}
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Criar Projeto no Neon</h3>
                        <p className="text-slate-600 mb-3">
                          Acesse o console do Neon e crie um novo projeto para o RasPay.
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <a href="https://console.neon.tech" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Neon Console
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Configurar DATABASE_URL</h3>
                        <p className="text-slate-600 mb-3">
                          Copie a connection string do Neon e configure nas variáveis de ambiente.
                        </p>
                        <div className="bg-slate-100 p-3 rounded-lg border">
                          <code className="text-sm">DATABASE_URL=postgresql://username:password@host/database</code>
                        </div>
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Executar Script SQL</h3>
                        <p className="text-slate-600 mb-3">
                          Execute o script completo no SQL Editor do Neon para criar todas as tabelas e dados.
                        </p>
                        <div className="bg-slate-100 p-3 rounded-lg border">
                          <code className="text-sm">scripts/000-setup-complete-database.sql</code>
                        </div>
                      </div>
                    </div>

                    {/* Passo 4 */}
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">Verificar e Testar</h3>
                        <p className="text-slate-600 mb-3">
                          Atualize esta página e teste o login com as credenciais fornecidas.
                        </p>
                        <div className="flex space-x-2">
                          <Button onClick={fetchSetupStatus} size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verificar Novamente
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <a href="/auth" target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Testar Login
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Configurações Importantes */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Configurações Atuais</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-blue-800">JWT Secret:</label>
                          <code className="block bg-white p-2 rounded border mt-1">raspay05072025</code>
                        </div>
                        <div>
                          <label className="font-medium text-blue-800">Base URL:</label>
                          <code className="block bg-white p-2 rounded border mt-1">https://v0-raspay.vercel.app</code>
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-medium text-blue-800">Webhook URL:</label>
                          <code className="block bg-white p-2 rounded border mt-1">
                            https://v0-raspay.vercel.app/api/webhook/horsepay
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Solução de Problemas */}
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Solução de Problemas</span>
                      </h3>
                      <div className="space-y-2 text-sm text-yellow-800">
                        <p>
                          • <strong>Erro de conexão:</strong> Verifique se a DATABASE_URL está correta
                        </p>
                        <p>
                          • <strong>Tabelas não criadas:</strong> Execute o script SQL completo no Neon Console
                        </p>
                        <p>
                          • <strong>Login não funciona:</strong> Verifique se o JWT_SECRET está configurado
                        </p>
                        <p>
                          • <strong>Webhooks falham:</strong> Confirme a URL do webhook no HorsePay
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-200">
          <div className="flex items-center justify-center space-x-2 text-slate-500 mb-2">
            <Shield className="h-4 w-4" />
            <span>RasPay Database Setup</span>
          </div>
          <p className="text-sm text-slate-400">Sistema de verificação e configuração do banco de dados</p>
        </div>
      </div>
    </div>
  )
}
