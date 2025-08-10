"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ShieldCheck, UserCheck } from "lucide-react"

type User = { id: number; name: string | null; email: string | null; username: string | null }

export default function Cg160AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // After a successful auth the backend should set httpOnly "admin-token"
  async function login() {
    try {
      setError(null)
      setMessage(null)
      setLoading(true)
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        throw new Error("Senha inválida")
      }
      setIsAuthed(true)
      setMessage("Autenticado com sucesso.")
    } catch (e: any) {
      setError(e?.message || "Erro ao autenticar")
    } finally {
      setLoading(false)
    }
  }

  async function search() {
    if (!q.trim()) {
      setUsers([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cg160/admin/search-users?q=${encodeURIComponent(q)}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Falha na busca")
      const data = await res.json()
      setUsers(data?.users || [])
    } catch (e: any) {
      setError(e?.message || "Erro de busca")
    } finally {
      setLoading(false)
    }
  }

  async function setWinner(userId: number) {
    setSaving(userId)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch("/api/cg160/admin/set-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, setBy: "admin" }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || "Falha ao definir vencedor")
      }
      setMessage("Vencedor definido para hoje.")
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar")
    } finally {
      setSaving(null)
    }
  }

  // Optional: check existing admin cookie on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/cg160/admin/search-users?q=__healthcheck__", {
          credentials: "include",
        })
        if (res.status !== 401) {
          setIsAuthed(true)
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {"Admin - CG160 (definir vencedor)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthed ? (
            <div className="flex gap-2 max-w-sm">
              <Input
                type="password"
                placeholder="Senha de administrador (/adminconfig)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={login} disabled={loading || !password}>
                {"Entrar"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Buscar por nome, email ou username"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search()}
                  />
                </div>
                <Button variant="outline" onClick={search}>
                  {"Buscar"}
                </Button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{"ID"}</TableHead>
                      <TableHead>{"Nome"}</TableHead>
                      <TableHead>{"Email"}</TableHead>
                      <TableHead>{"Username"}</TableHead>
                      <TableHead className="text-right">{"Ação"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono">{u.id}</TableCell>
                        <TableCell>{u.name || "-"}</TableCell>
                        <TableCell>{u.email || "-"}</TableCell>
                        <TableCell>{u.username || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setWinner(u.id)} disabled={saving === u.id}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            {saving === u.id ? "Salvando..." : "Definir vencedor"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {loading ? "Carregando..." : "Nenhum resultado"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {message && <div className="text-emerald-600">{message}</div>}
              {error && <div className="text-red-600">{error}</div>}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
