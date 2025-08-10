"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Cg160OfferModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const flag = typeof window !== "undefined" ? window.sessionStorage.getItem("showCg160Offer") : null
      if (flag === "1") {
        setOpen(true)
        // Remove so it shows only once after login
        window.sessionStorage.removeItem("showCg160Offer")
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{"Oferta do Dia: CG160"}</DialogTitle>
          <DialogDescription>
            {"Deposite hoje e concorra a uma Honda CG160. Cada depósito aprovado vale 1 número!"}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <div className="rounded-lg overflow-hidden border bg-white">
            <Image src="/images/moto.png" alt="Honda CG160" width={640} height={400} priority />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {"Fechar"}
          </Button>
          <Button onClick={() => (window.location.href = "/cg160")}>{"Ver sorteio"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
