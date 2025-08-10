"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Ticket } from "lucide-react"

type Profile = {
  id: number | string
  name?: string
  email?: string
}

export default function MyTicketsToday() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        // 1) Get profile to know user id
        const profRes = await fetch("/api/user/profile", { credentials: "include" })
        if (!profRes.ok) throw new Error("Falha ao carregar perfil")
        const profData = await profRes.json()
        const profile: Profile | null = profData?.user || profData?.profile || null
        const userId = profile?.id
        if (!userId) throw new Error("Usuário não autenticado")

        // 2) Get my tickets for today
        const tRes = await fetch(`/api/cg160/my-tickets?userId=${encodeURIComponent(String(userId))}`, {
          credentials: "include",
        })
        if (!tRes.ok) throw new Error("Falha ao carregar números de hoje")
        const tData = await tRes.json()
        if (!cancelled) {
          setTickets(Number(tData?.tickets || 0))
          setError(null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erro ao carregar")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-600" />
          {"Seus Números da Sorte (hoje)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {"Carregando..."}
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="flex items-baseline gap-4">
            <div className="text-4xl font-bold tabular-nums">{tickets}</div>
            <div className="text-muted-foreground">{"números para o sorteio de hoje"}</div>
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" onClick={() => (window.location.href = "/deposito")}>
            {"Fazer depósito"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
