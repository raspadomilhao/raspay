"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  defaultOpen?: boolean
}

export default function Cg160OfferModal({ defaultOpen = false }: Props = { defaultOpen: false }) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (typeof window === "undefined") return
    const flag = window.sessionStorage.getItem("showCg160Offer")
    if (flag === "1") {
      setOpen(true)
      // remove so it doesn't reopen on subsequent navigations
      window.sessionStorage.removeItem("showCg160Offer")
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Oferta especial: CG 160</DialogTitle>
          <DialogDescription>
            Deposite hoje e ganhe 1 Número da Sorte por real para concorrer a uma motocicleta CG 160.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border">
            <Image
              src="/images/moto.png"
              alt="Moto CG 160"
              fill
              className="object-contain bg-black/5"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Agora não
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                router.push("/cg160")
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ver sorteio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
