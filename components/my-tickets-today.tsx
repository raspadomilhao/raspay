"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

type Profile = { id: number; name?: string | null; email?: string }

export default function MyTicketsToday({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        // Get current user profile to obtain user id
        const profileRes = await fetch("/api/user/profile", { cache: "no-store" })
        if (!profileRes.ok) throw new Error("Não autenticado")
        const profile = (await profileRes.json()) as { user: Profile }
        const userId = profile?.user?.id
        if (!userId) throw new Error("Usuário inválido")

        const ticketsRes = await fetch(`/api/cg160/my-tickets?user_id=${userId}`, { cache: "no-store" })
        if (!ticketsRes.ok) throw new Error("Erro ao buscar números de hoje")
        const data = (await ticketsRes.json()) as { tickets_today: number }
        if (active) {
          setCount(data.tickets_today ?? 0)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError("Não foi possível carregar seus números de hoje.")
          setCount(0)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white">Seus Números da Sorte (hoje)</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-gray-400 text-sm">Total de números válidos apenas para o dia de hoje.</div>
        {count === null ? (
          <div className="flex items-center gap-2 text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-base px-3 py-1">{count}</Badge>
        )}
      </CardContent>
      {error && <div className="px-6 pb-4 text-sm text-red-300">{error}</div>}
    </Card>
  )
}
