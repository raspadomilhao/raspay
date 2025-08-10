"use client"

import Image from "next/image"
import MyTicketsToday from "@/components/my-tickets-today"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function Cg160Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <section className="grid gap-6 md:grid-cols-2 items-center">
        <div className="order-2 md:order-1">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{"Sorteio CG160 de Hoje"}</h1>
          <p className="mt-2 text-muted-foreground">
            {
              "Deposite hoje para ganhar números da sorte e concorrer a uma Honda CG160. Quanto mais depósitos, mais chances!"
            }
          </p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => (window.location.href = "/deposito")}>{"Depositar agora"}</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/vencedores")}>
              {"Últimos vencedores"}
            </Button>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="rounded-lg overflow-hidden border bg-white">
            <Image src="/images/moto.png" alt="Imagem da moto CG160" width={800} height={600} priority />
          </div>
        </div>
      </section>

      <section>
        <MyTicketsToday />
      </section>

      <section>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">{"Como funciona"}</h2>
            <ol className="mt-3 list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>{"Faça um depósito hoje."}</li>
              <li>{"Cada depósito aprovado gera 1 número para o sorteio de hoje."}</li>
              <li>{"O vencedor pode ser definido manualmente pelo administrador diariamente."}</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
