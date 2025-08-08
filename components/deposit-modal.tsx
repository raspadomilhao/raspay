"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Wallet, Zap, Shield, Trophy, Crown, Star, TrendingUp, Users, Gift, Gamepad2, Home, User, LogOut, Menu, Play, ArrowRight, CheckCircle, Clock, DollarSign, X, Copy, QrCode, CreditCard, Smartphone, Plus, ArrowLeft } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"
import { FeeCalculator } from "@/components/fee-calculator"
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

interface PaymentOrder {
  copy_past: string
  external_id: number
  payer_name: string
  payment: string
  status: number
}

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: UserProfile | null
  onDepositSuccess?: () => void
}

interface SystemSettings {
  min_deposit_amount?: string
}

interface DepositProgress {
  total_deposited: number
  bonus_50_claimed: boolean
  bonus_100_claimed: boolean
}

type ModalState = 'form' | 'qrcode' | 'success'

export function DepositModal({ isOpen, onClose, userProfile: initialProfile, onDepositSuccess }: DepositModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)
  
  // Estados da API HorsePay
  const [accessToken, setAccessToken] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  // Estados do formulário de depósito
  const [amount, setAmount] = useState("")
  const [payerName, setPayerName] = useState("")

  // Estados do modal
  const [modalState, setModalState] = useState<ModalState>('form')
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos
  const [isChecking, setIsChecking] = useState(false)
  const [paymentDetected, setPaymentDetected] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const paymentCheckRef = useRef<NodeJS.Timeout | null>(null)

  const [isBlogger, setIsBlogger] = useState(false)

  // Estados das configurações do sistema
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({})
  const [minDepositAmount, setMinDepositAmount] = useState(20)

  // Estados do progresso de depósitos
  const [depositProgress, setDepositProgress] = useState<DepositProgress>({
    total_deposited: 0,
    bonus_50_claimed: false,
    bonus_100_claimed: false,
  })

  // Função utilitária para formatar valores monetários
  const formatCurrency = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Buscar configurações do sistema
  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data.settings)
        if (data.settings.min_deposit_amount) {
          setMinDepositAmount(Number.parseFloat(data.settings.min_deposit_amount))
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }

  // Buscar progresso de depósitos do usuário
  const fetchDepositProgress = async () => {
    try {
      console.log("🔄 Buscando progresso de depósitos...")
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/deposits")
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Dados recebidos:", data)

        setDepositProgress({
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })

        // Mostrar notificação se bônus foi concedido
        if (data.bonus_awarded) {
          toast({
            title: "🎉 Parabéns!",
            description: "Você ganhou um bônus de depósito!",
          })
        }

        console.log("✅ Progresso atualizado:", {
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })
      } else {
        console.error("❌ Erro na resposta:", response.status)
      }
    } catch (error) {
      console.error("❌ Erro ao buscar progresso de depósitos:", error)
    }
  }

  // Buscar perfil do usuário
  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)

        if (profile.user.name && !payerName) {
          setPayerName(profile.user.name)
        }

        if (profile.user.user_type === "blogger") {
          setIsBlogger(true)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  // Autenticar com a API HorsePay
  const authenticateHorsePay = async (): Promise<string> => {
    try {
      console.log("🔐 Iniciando autenticação HorsePay...")

      const response = await fetch("/api/horsepay/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success && data.access_token) {
        console.log("✅ Autenticação HorsePay bem-sucedida")
        setAccessToken(data.access_token)
        setIsAuthenticated(true)
        return data.access_token
      } else {
        throw new Error("Falha na autenticação HorsePay: " + (data.error || "Token não recebido"))
      }
    } catch (error) {
      console.error("❌ Erro na autenticação HorsePay:", error)
      throw error
    }
  }

  // Function to check payment status
  const checkPayment = async () => {
    if (!paymentOrder || paymentDetected || isChecking) return

    setIsChecking(true)
    const currentCheck = checkCount + 1
    setCheckCount(currentCheck)

    try {
      console.log(`🔍 Verificação ${currentCheck} para external_id: ${paymentOrder.external_id}`)

      // Obter token de autenticação
      const token = AuthClient.getToken()
      console.log(`🔑 Token disponível: ${token ? "Sim" : "Não"}`)

      // Adicionar token no header Authorization
      const headers: HeadersInit = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`/api/transactions/${paymentOrder.external_id}/status?t=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        headers,
      })

      console.log(`📡 Response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Dados recebidos:`, data)

        // USAR EXATAMENTE A MESMA CONDIÇÃO DO WEBHOOK
        if (data.processed === true && data.status === "success") {
          console.log(`✅ PAGAMENTO DETECTADO! external_id: ${paymentOrder.external_id}`)
          handlePaymentDetected()
          return
        } else {
          console.log(`⏳ Ainda não processado: processed=${data.processed}, status=${data.status}`)
        }
      } else {
        const errorData = await response.text()
        console.log(`❌ Erro na resposta: ${response.status} - ${errorData}`)
      }
    } catch (error) {
      console.error("❌ Erro ao verificar pagamento:", error)
    } finally {
      setIsChecking(false)
    }
  }

  // Gerar PIX
  const generatePix = async () => {
    const amountNum = Number.parseFloat(amount)

    if (amountNum < minDepositAmount) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para depósito é R$ ${minDepositAmount.toFixed(2)}.`,
        variant: "destructive",
      })
      return
    }

    if (!payerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("🚀 Iniciando geração de PIX...")

      // Sempre autenticar antes de gerar PIX para garantir token válido
      const currentToken = await authenticateHorsePay()

      console.log("💰 Gerando PIX com token válido...")

      const body = {
        payer_name: payerName,
        amount: amountNum,
        callback_url: "https://v0-raspay.vercel.app/api/webhook/horsepay",
      }

      console.log("📤 Enviando requisição para HorsePay:", body)

      const horsePayResponse = await fetch("https://api.horsepay.io/transaction/neworder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      console.log("📥 Resposta HorsePay status:", horsePayResponse.status)

      if (horsePayResponse.ok) {
        const data: PaymentOrder = await horsePayResponse.json()
        console.log("✅ PIX gerado com sucesso:", data.external_id)

        setPaymentOrder(data)

        // Salvar transação no banco
        await AuthClient.makeAuthenticatedRequest("/api/transactions", {
          method: "POST",
          body: JSON.stringify({
            type: "deposit",
            amount: amountNum,
            external_id: data.external_id,
            payer_name: payerName,
            callback_url: "https://v0-raspay.vercel.app/api/webhook/horsepay",
            qr_code: data.payment,
            copy_paste_code: data.copy_past,
          }),
        })

        // Mudar para tela do QR code
        setModalState('qrcode')
        setTimeLeft(600) // Reset timer
        setPaymentDetected(false)
        setCheckCount(0)

        // Se for blogger, simular pagamento após 7 segundos
        if (isBlogger) {
          console.log("🎭 Blogger detectado - simulação será executada em 7 segundos")
          setTimeout(async () => {
            try {
              const simulateResponse = await AuthClient.makeAuthenticatedRequest("/api/simulate-deposit", {
                method: "POST",
                body: JSON.stringify({
                  external_id: data.external_id,
                }),
              })

              if (simulateResponse.ok) {
                const simulateData = await simulateResponse.json()
                console.log("🎭 Depósito simulado:", simulateData)

                // Atualizar perfil e progresso
                await fetchUserProfile()
                await fetchDepositProgress()
                setModalState('success')
                setAmount("")
                setPaymentOrder(null)

                toast({
                  title: "Depósito realizado com sucesso!",
                  description: `R$ ${simulateData.amount.toFixed(2)} creditado na sua conta.`,
                })

                if (onDepositSuccess) {
                  onDepositSuccess()
                }
              }
            } catch (error) {
              console.error("Erro na simulação:", error)
            }
          }, 7000) // 7 segundos
        }

        toast({
          title: "PIX gerado com sucesso!",
          description: `ID do pedido: ${data.external_id}`,
        })
      } else {
        const errorText = await horsePayResponse.text()
        console.error("❌ Erro HorsePay:", errorText)
        throw new Error(`Falha ao gerar PIX: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Erro ao gerar PIX:", error)
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentDetected = () => {
    console.log("🎉 Processando detecção de pagamento...")

    // Clear all intervals
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setPaymentDetected(true)
    setModalState('success')
    
    toast({
      title: "🎉 Pagamento Detectado!",
      description: "Seu depósito foi processado com sucesso!",
    })

    // Atualizar dados
    fetchUserProfile()
    fetchDepositProgress()
    setAmount("")
    setPaymentOrder(null)

    if (onDepositSuccess) {
      onDepositSuccess()
    }

    // Fechar modal após 3 segundos
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  // Timer countdown
  useEffect(() => {
    if (modalState !== 'qrcode' || paymentDetected || !paymentOrder) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [modalState, paymentDetected, paymentOrder])

  // Setup payment checking interval
  useEffect(() => {
    if (modalState !== 'qrcode' || !paymentOrder || paymentDetected) {
      // Clear any existing intervals
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
      return
    }

    // Initial check
    checkPayment()

    // Setup interval for subsequent checks
    if (!paymentCheckRef.current) {
      paymentCheckRef.current = setInterval(checkPayment, 5000)
    }

    return () => {
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
    }
  }, [modalState, paymentOrder, paymentDetected])

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      fetchSystemSettings()
      if (initialProfile) {
        setUserProfile(initialProfile)
        if (initialProfile.user.name && !payerName) {
          setPayerName(initialProfile.user.name)
        }
        if (initialProfile.user.user_type === "blogger") {
          setIsBlogger(true)
        }
      } else {
        fetchUserProfile()
      }
      fetchDepositProgress()
    }
  }, [isOpen, initialProfile])

  // Calcular progresso
  const getProgressPercentage = (target: number) => {
    return Math.min((depositProgress.total_deposited / target) * 100, 100)
  }

  const getNextBonus = () => {
    if (!depositProgress.bonus_50_claimed && depositProgress.total_deposited < 50) {
      return { target: 50, bonus: 5, remaining: 50 - depositProgress.total_deposited }
    }
    if (!depositProgress.bonus_100_claimed && depositProgress.total_deposited < 100) {
      return { target: 100, bonus: 10, remaining: 100 - depositProgress.total_deposited }
    }
    return null
  }

  const nextBonus = getNextBonus()

  const handleClose = () => {
    // Clear all intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    
    setModalState('form')
    setPaymentOrder(null)
    setAmount("")
    setPayerName("")
    setPaymentDetected(false)
    onClose()
  }

  const handleBackToForm = () => {
    // Clear intervals when going back
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    
    setModalState('form')
    setPaymentOrder(null)
    setPaymentDetected(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência.",
    })
  }

  // Valores sugeridos atualizados conforme solicitado
  const suggestedAmounts = [
    { value: 20, label: "R$ 20", badge: "Popular", badgeColor: "bg-orange-500" },
    { value: 40, label: "R$ 40", badge: "+Querido", badgeColor: "bg-orange-500" },
    { value: 60, label: "R$ 60", badge: "Recomendado", badgeColor: "bg-orange-500" },
    { value: 120, label: "R$ 120", badge: "+Chances", badgeColor: "bg-orange-500" },
    { value: 150, label: "R$ 150", badge: "+Chances", badgeColor: "bg-orange-500" },
    { value: 300, label: "R$ 300", badge: "+Chances", badgeColor: "bg-orange-500" },
    { value: 1000, label: "R$ 1.000", badge: "Ultra Chances", badgeColor: "bg-purple-600" },
    { value: 2000, label: "R$ 2.000", badge: "Chuva de Prêmios", badgeColor: "bg-blue-600" },
    { value: 5000, label: "R$ 5.000", badge: "Lendário", badgeColor: "bg-yellow-600" },
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          {/* Header - Dinâmico baseado no estado */}
          <div className="flex items-center justify-between p-4 pb-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={modalState === 'form' ? handleClose : handleBackToForm}
                className="text-white hover:bg-slate-800 rounded-full w-8 h-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-white">
                {modalState === 'form' && 'Depositar'}
                {modalState === 'qrcode' && 'Escaneie o QR Code'}
                {modalState === 'success' && 'Pagamento Confirmado!'}
              </h1>
            </div>
          </div>

          {/* Content - Baseado no estado do modal */}
          <div className="px-4 pb-6 space-y-4">
            {modalState === 'form' && (
              <>
                {/* Security Banner - Compacto para mobile */}
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 font-medium text-sm">Pagamento seguro e verificado.</span>
                  </div>
                </div>

                {/* Suggested Amounts Grid - 3x3 layout */}
                <div className="grid grid-cols-3 gap-1.5">
                  {suggestedAmounts.map((suggested) => (
                    <div key={suggested.value} className="relative">
                      <Button
                        variant="outline"
                        onClick={() => setAmount(suggested.value.toString())}
                        className={`w-full h-10 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-md flex items-center justify-center transition-all p-1 ${
                          amount === suggested.value.toString() ? 'border-green-500 bg-green-500/10' : ''
                        }`}
                      >
                        <span className="text-white font-medium text-xs leading-tight">{suggested.label}</span>
                      </Button>
                      <Badge 
                        className={`absolute -top-1 left-1/2 transform -translate-x-1/2 ${suggested.badgeColor} text-white border-0 text-[10px] px-1 py-0.5 rounded-full whitespace-nowrap`}
                      >
                        {suggested.badge}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Custom Amount Input - Compacto para mobile */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-white font-medium text-sm">
                      Valor do depósito <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Mínimo R$ {minDepositAmount.toFixed(2)} / Máximo R$ 50.000,00
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    className="bg-slate-800 border-slate-700 text-white text-base h-12 rounded-lg focus:border-green-500 focus:ring-green-500"
                    min={minDepositAmount}
                    step="0.01"
                  />
                </div>

                {/* Hidden Name Input (auto-filled) */}
                <input
                  type="hidden"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />

                {/* Create Deposit Button - Otimizado para mobile */}
                <Button
                  onClick={generatePix}
                  disabled={loading || !amount || Number.parseFloat(amount) < minDepositAmount}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-base h-12 rounded-lg transition-all"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    "Criar depósito"
                  )}
                </Button>

                {/* Bonus Section - Corrigido para estar de acordo com o sistema */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-white" />
                    <span className="text-white font-semibold text-base">Bônus de Depósito</span>
                  </div>
                  
                  {nextBonus ? (
                    <div className="text-slate-300 text-sm">
                      <span>Deposite </span>
                      <span className="text-green-400 font-semibold">R$ {nextBonus.target.toFixed(2)}</span>
                      <span> hoje para ganhar </span>
                      <span className="text-green-400 font-semibold">+R$ {nextBonus.bonus.toFixed(2)}</span>
                      <span> de bônus!</span>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-sm">
                      Todos os bônus de hoje foram conquistados! 🎉
                    </div>
                  )}

                  {/* Progress Indicators - Compacto para mobile */}
                  {nextBonus && (
                    <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Progresso atual</span>
                        <span className="text-white font-semibold text-sm">R$ {depositProgress.total_deposited.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <Progress 
                          value={getProgressPercentage(nextBonus.target)} 
                          className="h-1.5 bg-slate-700"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>R$ 0</span>
                          <span>R$ {nextBonus.target}</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <span className="text-slate-400 text-xs">Faltam </span>
                        <span className="text-green-400 font-semibold text-xs">R$ {nextBonus.remaining.toFixed(2)}</span>
                        <span className="text-slate-400 text-xs"> para +R$ {nextBonus.bonus}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {modalState === 'qrcode' && paymentOrder && (
              <>
                {/* Timer */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-300">Tempo restante:</span>
                  </div>
                  <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
                    {formatTime(timeLeft)}
                  </Badge>
                </div>

                {/* QR Code */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <div className="mb-4">
                      <img
                        src={paymentOrder.payment || "/placeholder.svg"}
                        alt="QR Code PIX"
                        className="mx-auto max-w-full h-auto border rounded-lg border-slate-600"
                        style={{ maxWidth: "200px" }}
                      />
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                      Escaneie com o app do seu banco ou use o código PIX abaixo
                    </p>
                  </CardContent>
                </Card>

                {/* Código PIX */}
                <Card className="bg-slate-800 border-slate-600">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => copyToClipboard(paymentOrder.copy_past)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      variant="default"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Código PIX
                    </Button>
                  </CardContent>
                </Card>

                {/* Instruções */}
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
                  <div className="text-center text-sm text-gray-300 space-y-2">
                    <p className="text-purple-400 font-semibold flex items-center justify-center space-x-1">
                      <span>💡</span>
                      <span>Como pagar:</span>
                    </p>
                    <div className="space-y-1 text-gray-300">
                      <p>1. Abra o app do seu banco</p>
                      <p>2. Escolha PIX → Ler QR Code ou Colar Código</p>
                      <p>3. Confirme o pagamento</p>
                      <p className="text-purple-300 font-medium">4. Aguarde - verificamos a cada 5 segundos!</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {modalState === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Pagamento Confirmado!</h3>
                  <p className="text-gray-300">Seu saldo foi atualizado automaticamente.</p>
                </div>
                {paymentOrder && (
                  <div className="bg-green-500/10 border border-green-400/30 p-4 rounded-lg">
                    <p className="text-sm text-green-300">
                      <strong>ID da Transação:</strong> {paymentOrder.external_id}
                    </p>
                  </div>
                )}
                <p className="text-slate-400 text-sm">Fechando automaticamente...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
