"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface LiveStoriesButtonProps {
  thumbnailSrc: string
  altText: string
  modalTitle: string
  modalContent: React.ReactNode
}

export function LiveStoriesButton({ thumbnailSrc, altText, modalTitle, modalContent }: LiveStoriesButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative w-10 h-10 rounded-full p-0 overflow-hidden border-2 border-primary hover:border-primary/80 transition-all duration-200 flex-shrink-0"
        onClick={() => setIsModalOpen(true)}
        aria-label={`Ver ${altText}`}
      >
        <Image
          src={thumbnailSrc || "/placeholder.svg"}
          alt={altText}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 rounded-full ring-2 ring-primary/50 animate-pulse-ring"></div>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full p-6 bg-card border-border text-foreground md:max-w-2xl md:w-full md:h-auto sm:max-w-full sm:h-full sm:p-4">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">{modalTitle}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setIsModalOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="mt-4">{modalContent}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
