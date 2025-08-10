"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Search, Award, Shield, AlertCircle } from "lucide-react"

type Winner = {
  draw_date: string
  winner: { id: number; name: string | null; email: string; username: string | null } | null
  manual?: boolean
  total_tickets?: number | null
  notes?: string | null
  selected_by?: string | null
  created_at?: string
}

type FoundUser = {
  id: number
  name: string | null
  email: string
  username: string | null
  user_type: string | null
}

export default function CG160AdminPage() {
  const [password, setPassword] = useState("")
  const [adminToken, setAdminToken] = useState<string>("")
  const [authStatus, setAuthStatus] = useState<"idle" | "authenticating" | "ok" | "error">("idle")
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<FoundUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [selecting, setSelecting] = useState<number | null>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/cg160/winner", { cache: "no-store" })
        if (res.ok) {
          const json = (await res.json()) as Winner
          setWinner(json)
        }
      } catch {}
    })()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthStatus("authenticating")
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        // Reuse the token returned by /api/admin/auth (same as /adminconfig)
        setAdminToken(data.token || "")
        setAuthStatus("ok")
      } else {
        setAuthStatus("error")
      }
    } catch {
      setAuthStatus("error")
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/cg160/admin/search-users?q=${encodeURIComponent(search)}`, {
        headers: { "X-Admin-Token": adminToken },
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setUsers(json.users || [])
    } catch {
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const setWinnerForToday = async (userId: number) => {
    setSelecting(userId)
    try {
      const res = await fetch("/api/cg160/admin/set-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken, // same token used in /adminconfig
        },
        body: JSON.stringify({ winner_user_id: userId, notes }),
      })
      const data = await res.json()
      if (res.ok) {
        const w = await fetch("/api/cg160/winner", { cache: "no-store" })
        if (w.ok) {
          setWinner(await w.json())
        }
      } else {
        alert(data.error || "Erro ao definir vencedor")
      }
    } catch {
      alert("Erro de conexão")
    } finally {
      setSelecting(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-purple-400" />
        Painel CG160 - Definir Vencedor (Manual)
      </h1>

      {!adminToken ? (
        <Card className="bg-slate-900/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Autenticação Administrativa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Digite a senha administrativa"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={authStatus === "authenticating"}>
                  {authStatus === "authenticating" ? "Verificando..." : "Acessar"}
                </Button>
              </div>
            </form>
            {authStatus === "error" && (
              <div className="mt-3 text-red-300 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Senha incorreta ou erro de autenticação.</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Vencedor de Hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {winner?.winner ? (
              <>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Vencedor definido para {winner.draw_date}</span>
                </div>
                <div className="p-3 rounded bg-slate-800 border border-slate-700">
                  <div className="text-white font-medium">{winner.winner.name || "(sem nome)"}</div>
                  <div className="text-gray-400 text-sm">{winner.winner.email}</div>
                  {winner.winner.username && <div className="text-gray-500 text-xs">@{winner.winner.username}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-600 text-white">
                      ID: {winner.winner.id}
                    </Badge>
                    {winner.total_tickets != null && (
                      <Badge className="bg-emerald-500/90 text-white">
                        Total de bilhetes hoje: {winner.total_tickets}
                      </Badge>
                    )}
                    {winner.manual && <Badge className="bg-purple-500/80 text-white">Manual</Badge>}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Nenhum vencedor definido para hoje.</div>
            )}
            <div className="text-xs text-gray-500">
              Dica: use a busca ao lado para localizar o usuário e definir como vencedor de hoje.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-cyan-400" />
              Buscar Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Nome, email ou username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                disabled={!adminToken}
              />
              <Button type="submit" disabled={!adminToken || loadingUsers}>
                {loadingUsers ? "Buscando..." : "Buscar"}
              </Button>
            </form>

            <div className="mt-4">
              <Label htmlFor="notes" className="text-white">
                Observações (opcional)
              </Label>
              <Input
                id="notes"
                placeholder="Anotação para auditoria (ex.: sorteio manual - auditor x)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                disabled={!adminToken}
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-400">Usuário</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Username</TableHead>
                    <TableHead className="text-gray-400 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400">
                        {loadingUsers ? "Carregando..." : "Nenhum resultado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-white">{u.name || "(sem nome)"}</TableCell>
                        <TableCell className="text-gray-300">{u.email}</TableCell>
                        <TableCell className="text-gray-400">{u.username || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => setWinnerForToday(u.id)}
                            disabled={!adminToken || selecting === u.id}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            <Award className="h-4 w-4 mr-2" />
                            {selecting === u.id ? "Definindo..." : "Definir vencedor"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
