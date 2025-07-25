"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { AuthClient } from "@/lib/auth-client"

interface UserProfile {
  user: {
    id: number
    name: string
    username: string
    email: string
    balance: number
  }
  wallet: {
    balance: number
  }
}

interface FloatingBalanceProps {
  userProfile?: UserProfile | null
}

export function FloatingBalance({ userProfile }: FloatingBalanceProps) {
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(userProfile || null)

  useEffect(() => {
    if (userProfile) {
      setLocalProfile(userProfile)
    }
  }, [userProfile])

  useEffect(() => {
    // If no userProfile is passed, fetch it locally
    if (!userProfile) {
      const fetchProfile = async () => {
        try {
          const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
          if (response.ok) {
            const data = await response.json()
            setLocalProfile(data)
          }
        } catch (error) {
          console.error("Erro ao buscar perfil no FloatingBalance:", error)
        }
      }

      fetchProfile()
      const interval = setInterval(fetchProfile, 10000)
      return () => clearInterval(interval)
    }
  }, [userProfile])

  // Helper function to safely convert to number and format
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Get the current balance from either user.balance or wallet.balance
  const getCurrentBalance = (): number => {
    if (localProfile?.wallet?.balance !== undefined) {
      return localProfile.wallet.balance
    }
    if (localProfile?.user?.balance !== undefined) {
      return localProfile.user.balance
    }
    return 0
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-green-400" />
            <span className="text-white font-semibold text-sm">R$ {formatCurrency(getCurrentBalance())}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
