import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import dynamicImport from "next/dynamic"
import { Award } from "lucide-react"
import Image from "next/image"

// Client component to show the logged-in user's tickets today
const MyTicketsTodayComponent = dynamicImport(() => import("@/components/my-tickets-today"), { ssr: false })

export const revalidate = 0
export const dynamic = "force-dynamic"

type RankingRow = {
  id: number
  name: string | null
  username: string | null
  email: string
  total_deposit: string
  tickets: number
}

function getFirstName(name: string | null, email: string) {
  const trimmed = (name || "").trim()
  if (trimmed.length > 0) {
    return trimmed.split(/\s+/)[0]
  }
  const local = (email || "Usuario").split("@")[0] || "Usuario"
  return local.charAt(0).toUpperCase() + local.slice(1)
}

// Only "usuários comuns" and deposits approved from today's start (Brasília timezone)
async function getRanking(limit = 5): Promise<RankingRow[]> {
  const sql = neon(process.env.DATABASE_URL!)

  // Start of "today" in America/Sao_Paulo as timestamptz (UTC)
  const rows = await sql<RankingRow>`
WITH start_of_today_sp AS (
SELECT (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo') AS ts
)
SELECT 
u.id,
u.name,
u.username,
u.email,
COALESCE(SUM(t.amount), 0) AS total_deposit,
FLOOR(COALESCE(SUM(t.amount), 0))::int AS tickets
FROM users u
JOIN transactions t 
ON t.user_id = u.id
AND t.type = 'deposit'
AND t.status = 'success'
AND t.created_at >= (SELECT ts FROM start_of_today_sp)
WHERE COALESCE(u.user_type, 'user') NOT IN ('admin','manager','affiliate')
GROUP BY u.id, u.name, u.username, u.email
HAVING COALESCE(SUM(t.amount), 0) > 0
ORDER BY total_deposit DESC
LIMIT ${limit}
`
  return rows
}

export default async function CG160Page() {
  const ranking = await getRanking(5)

  return (
    <main className="min-h-[60vh] px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
            <Award className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">CG160 - Sorteio do Dia</h1>
        </div>

        {/* Hero - Motorcycle image */}
        <section className="mt-4">
          <Card className="overflow-hidden border-slate-700 bg-slate-900/50">
            <CardContent className="relative aspect-[16/9] p-0">
              <Image
                src="/images/moto.png"
                alt="Prêmio CG 160 - motocicleta"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 100vw"
                priority
              />
            </CardContent>
          </Card>
        </section>

        <MyTicketsTodayComponent />

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>- Cada R$1,00 depositado hoje equivale a 1 número.</p>
            <p>- Apenas depósitos aprovados e realizados no dia corrente contam.</p>
            <p>- Os números são zerados diariamente.</p>
          </CardContent>
        </Card>

        {/* Ranking */}
        <section className="mt-8 sm:mt-10">
          <div className="mb-4 sm:mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Ranking de Depositantes (Hoje)</h2>
              <p className="text-sm text-muted-foreground">
                Top 100 por Números da Sorte conquistados hoje (somente usuários comuns)
              </p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Números da Sorte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                          Ainda não há depósitos aprovados hoje.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ranking.map((row, idx) => {
                        const rank = idx + 1
                        const firstName = getFirstName(row.name, row.email)
                        const maskedName = `${firstName} ####`

                        return (
                          <TableRow
                            key={row.id}
                            className={cn(
                              rank === 1 && "bg-emerald-50/60",
                              rank === 2 && "bg-emerald-50/40",
                              rank === 3 && "bg-emerald-50/20",
                            )}
                          >
                            <TableCell className="font-semibold">{rank}</TableCell>
                            <TableCell className="font-medium">{maskedName}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="font-mono">
                                {row.tickets.toLocaleString("pt-BR")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
