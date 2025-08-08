"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, Gamepad2, User, CreditCard, TrendingUp } from 'lucide-react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)

  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleDepositSuccess = () => {
    fetchUserProfile()
  }

  const handleDepositClick = () => {
    if (!AuthClient.isLoggedIn()) {
      router.push("/auth")
      return
    }
    setShowDepositModal(true)
  }

  const handleProfileClick = () => {
    if (!AuthClient.isLoggedIn()) {
      router.push("/auth")
      return
    }
    router.push("/perfil")
  }

  const handleSaqueClick = () => {
    if (!AuthClient.isLoggedIn()) {
      router.push("/auth")
      return
    }
    router.push("/saque")
  }

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      active: pathname === "/" || pathname === "/home",
      requiresAuth: false
    },
    {
      href: "/jogos",
      icon: Gamepad2,
      label: "Jogos",
      active: pathname === "/jogos",
      requiresAuth: false
    },
    {
      href: "#",
      icon: CreditCard,
      label: "",
      active: false,
      isDeposit: true,
      requiresAuth: true
    },
    {
      href: "/saque",
      icon: TrendingUp,
      label: "Sacar",
      active: pathname === "/saque",
      requiresAuth: true,
      onClick: handleSaqueClick
    },
    {
      href: "/perfil",
      icon: User,
      label: "Perfil",
      active: pathname === "/perfil",
      requiresAuth: true,
      onClick: handleProfileClick
    }
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-black/85 backdrop-blur-sm border-t border-white/10 z-50 md:hidden">
        <div className="flex items-end justify-around px-2 py-1 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon
            
            if (item.isDeposit) {
              return (
                <div key="deposit" className="relative -top-3">
                  <Button
                    onClick={handleDepositClick}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center p-0 shadow-2xl border-3 border-black/85 transition-all duration-200 hover:scale-105"
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </div>
              )
            }

            if (item.onClick) {
              return (
                <Button
                  key={item.href}
                  onClick={item.onClick}
                  variant="ghost"
                  className={`flex flex-col items-center space-y-0.5 px-2 py-1 min-w-0 h-auto rounded-lg transition-all duration-200 ${
                    item.active 
                      ? "text-white bg-white/10" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-medium leading-tight">{item.label}</span>
                </Button>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center space-y-0.5 px-2 py-1 min-w-0 h-auto rounded-lg transition-all duration-200 ${
                    item.active 
                      ? "text-white bg-white/10" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-medium leading-tight">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
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
