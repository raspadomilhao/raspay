"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, TrendingUp, Zap } from 'lucide-react'
import { AuthClient } from "@/lib/auth-client"
import { DepositModal } from "@/components/deposit-modal"

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

export function FloatingBalanceOptimized() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile-complete")
      
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const formatCurrency = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  const handleDepositSuccess = () => {
    fetchUserProfile()
  }

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            <span className="text-white text-sm">Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!userProfile) return null

  const balance = formatCurrency(userProfile.wallet.balance)
  const balanceNum = Number.parseFloat(balance)

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-3">
            {/* Saldo */}
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-green-400" />
              <span className="text-white font-semibold text-sm">
                R$ {balance}
              </span>
            </div>

            {/* Botão de Depósito - Verde destacado */}
            <Button
              onClick={() => setShowDepositModal(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white rounded-full h-8 px-3 font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-3 w-3 mr-1" />
              <span className="text-xs">Depositar</span>
            </Button>
          </div>
        </div>

        {/* Indicador de saldo baixo */}
        {balanceNum < 10 && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              <TrendingUp className="h-3 w-3 mr-1" />
              Saldo baixo
            </Badge>
          </div>
        )}
      </div>

      {/* Modal de Depósito */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        userProfile={userProfile}
        onDepositSuccess={handleDepositSuccess}
      />
    </>
  )
}
