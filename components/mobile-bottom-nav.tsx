"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Gamepad2, CreditCard, TrendingUp, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { AuthClient } from "@/lib/auth-client"
import { useAuthModal } from "@/hooks/use-auth-modal"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { openModal } = useAuthModal()

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(AuthClient.isLoggedIn())
    checkAuth()
    window.addEventListener("storage", checkAuth)
    return () => window.removeEventListener("storage", checkAuth)
  }, [])

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/jogos", icon: Gamepad2, label: "Jogos" },
    { href: "/deposito", icon: CreditCard, label: "Depositar", special: true },
    { href: "/saque", icon: TrendingUp, label: "Sacar" },
    {
      href: isLoggedIn ? "/perfil" : "#",
      icon: User,
      label: "Perfil",
      onClick: !isLoggedIn ? openModal : undefined,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            (item.href === "/home" && pathname === "/") ||
            pathname === item.href ||
            (item.href === "/jogos" && pathname.startsWith("/jogo/"))

          if (item.onClick) {
            return (
              <button
                key={item.href}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  item.special && "transform scale-110",
                )}
              >
                <div
                  className={cn(
                    "relative rounded-full p-3 transition-all",
                    item.special &&
                      "bg-gradient-to-br from-primary to-blue-500 text-white -translate-y-3 shadow-lg shadow-primary/30",
                    isActive && !item.special && "bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("transition-opacity", item.special && "opacity-0")}>{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                item.special && "transform scale-110",
              )}
            >
              <div
                className={cn(
                  "relative rounded-full p-3 transition-all",
                  item.special &&
                    "bg-gradient-to-br from-primary to-blue-500 text-white -translate-y-3 shadow-lg shadow-primary/30",
                  isActive && !item.special && "bg-accent",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn("transition-opacity", item.special && "opacity-0")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
