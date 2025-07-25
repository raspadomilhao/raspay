"use client"

import { useState, useEffect } from "react"
import { Wallet, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthClient } from "@/lib/auth-client"
import { useDebounce } from "@/lib/debounce"
import Link from "next/link"

interface UserProfile {
  user: {
    id: number
    email: string
    name: string
    user_type?: string
  }
  wallet: {
    balance: string | number
  }
}

interface FloatingBalanceProps {
  userProfile?: UserProfile | null
  onBalanceUpdate?: (newBalance: number) => void
}

export function FloatingBalanceOptimized({ userProfile: initialProfile, onBalanceUpdate }: FloatingBalanceProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  // Debounced function para buscar perfil
  const debouncedFetchProfile = useDebounce(async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile-complete")
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        setLastUpdateTime(Date.now())

        if (onBalanceUpdate) {
          const balance = Number.parseFloat(profile.wallet.balance?.toString() || "0")
          onBalanceUpdate(balance)
        }
      } else if (response.status === 401) {
        setIsLoggedIn(false)
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }, 500) // Debounce de 500ms

  useEffect(() => {
    const token = AuthClient.getToken()
    const loggedIn = token && AuthClient.isLoggedIn()
    setIsLoggedIn(loggedIn)

    if (loggedIn && !initialProfile) {
      debouncedFetchProfile()
    }
  }, [initialProfile, debouncedFetchProfile])

  // Atualizar perfil quando receber props externas
  useEffect(() => {
    if (initialProfile) {
      setUserProfile(initialProfile)
      setLastUpdateTime(Date.now())
    }
  }, [initialProfile])

  // Auto-refresh com intervalo inteligente (apenas se necessário)
  useEffect(() => {
    if (!isLoggedIn) return

    // Refresh menos frequente - apenas a cada 30 segundos
    const interval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime

      // Só atualizar se passou mais de 25 segundos desde a última atualização
      if (timeSinceLastUpdate > 25000) {
        debouncedFetchProfile()
      }
    }, 30000) // A cada 30 segundos

    return () => clearInterval(interval)
  }, [isLoggedIn, lastUpdateTime, debouncedFetchProfile])

  const formatCurrency = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  if (!isLoggedIn || !userProfile) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-green-400" />
            <span className="text-white font-semibold text-sm">R$ {formatCurrency(userProfile.wallet.balance)}</span>
          </div>
          <Link href="/deposito">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-7">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
