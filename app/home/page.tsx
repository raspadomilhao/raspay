"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    // Redireciona para a página principal
    redirect("/")
  }, [])

  return null
}
