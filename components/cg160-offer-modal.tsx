"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Cg160OfferModal({
  defaultOpen = false,
}: {
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    // Show the modal if the flag is set after login/register
    try {
      const shouldShow = typeof window !== "undefined" && window.sessionStorage.getItem("showCg160Offer") === "1"
      if (shouldShow) {
        setOpen(true)
        window.sessionStorage.removeItem("showCg160Offer")
      }
    } catch {
      // ignore sessionStorage errors
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Oferta Especial: CG160</DialogTitle>
          <DialogDescription>Participe do sorteio e concorra a uma moto CG160!</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-md">
            <Image src="/images/moto.png" alt="Moto CG160" fill className="object-contain bg-black/5" priority />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Deposite hoje, acumule números e aumente suas chances. Clique em Ver oferta para saber mais.
          </p>
        </div>
        <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            onClick={() => {
              setOpen(false)
              router.push("/cg160")
            }}
          >
            Ver oferta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
