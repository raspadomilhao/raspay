import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Cg160Page() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Sorteio CG160</h1>
            <p className="text-muted-foreground">
              Deposite hoje, acumule números e concorra a uma moto CG160. Quanto mais você deposita, mais chances tem!
            </p>
            <div className="flex gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                <Link href="/deposito">Depositar</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/home">Voltar</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Moto em destaque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-[16/9] bg-black/5 rounded-md">
                <Image src="/images/moto.png" alt="Imagem da Moto CG160" fill className="object-contain" priority />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
