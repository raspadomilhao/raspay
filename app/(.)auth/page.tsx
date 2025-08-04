"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthModal } from "@/components/auth-modal"
import { AuthClient } from "@/lib/auth-client"

export default function AuthInterceptPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // Se já estiver logado, redirecionar para home
    if (AuthClient.isLoggedIn()) {
      router.push("/home")
      return
    }
  }, [router])

  const handleClose = () => {
    setIsOpen(false)
    router.back()
  }

  const handleSuccess = () => {
    setIsOpen(false)
    router.push("/home")
  }

  return <AuthModal isOpen={isOpen} onClose={handleClose} onSuccess={handleSuccess} />
}
