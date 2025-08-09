"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Gift, Clock, CheckCircle, ArrowLeft, X, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"

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
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  onOpenChange?: (open: boolean) => void
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

type ModalState = "form" | "qrcode" | "success"

export function DepositModal({
  isOpen: isOpenProp,
  open: openProp,
  onClose,
  onOpenChange,
  userProfile: initialProfile,
  onDepositSuccess,
}: DepositModalProps) {
  // Controlled/Uncontrolled compatibility
  const isOpen = Boolean(isOpenProp ?? openProp ?? false)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null)

  // API HorsePay
  const [accessToken, setAccessToken] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  // Depósito
  const [amount, setAmount] = useState("")
  const [payerName, setPayerName] = useState("")

  // Modal state
  const [modalState, setModalState] = useState<ModalState>("form")
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 min
  const [isChecking, setIsChecking] = useState(false)
  const [paymentDetected, setPaymentDetected] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const paymentCheckRef = useRef<NodeJS.Timeout | null>(null)

  const [isBlogger, setIsBlogger] = useState(false)

  // Configs do sistema
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({})
  const [minDepositAmount, setMinDepositAmount] = useState(20)

  // Progresso dos depósitos
  const [depositProgress, setDepositProgress] = useState<DepositProgress>({
    total_deposited: 0,
    bonus_50_claimed: false,
    bonus_100_claimed: false,
  })

  // Util: moeda
  const formatCurrency = (value: string | number | undefined | null): string => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
  }

  // Buscar configs
  const fetchSystemSettings = useCallback(async () => {
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
  }, [])

  // Progresso de depósitos
  const fetchDepositProgress = useCallback(async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/deposits")
      if (response.ok) {
        const data = await response.json()
        setDepositProgress({
          total_deposited: data.total_deposited || 0,
          bonus_50_claimed: data.bonus_50_claimed || false,
          bonus_100_claimed: data.bonus_100_claimed || false,
        })
        if (data.bonus_awarded) {
          toast({
            title: "🎉 Parabéns!",
            description: "Você ganhou um bônus de depósito!",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao buscar progresso de depósitos:", error)
    }
  }, [])

  // Perfil
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        if (profile.user.name && !payerName) setPayerName(profile.user.name)
        if (profile.user.user_type === "blogger") setIsBlogger(true)
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }, [payerName])

  // HorsePay auth
  const authenticateHorsePay = async (): Promise<string> => {
    try {
      const response = await fetch("/api/horsepay/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success && data.access_token) {
        setAccessToken(data.access_token)
        setIsAuthenticated(true)
        return data.access_token
      } else {
        throw new Error("Falha na autenticação HorsePay: " + (data.error || "Token não recebido"))
      }
    } catch (error) {
      console.error("Erro na autenticação HorsePay:", error)
      throw error
    }
  }

  // Checar pagamento
  const checkPayment = useCallback(async () => {
    if (!paymentOrder || paymentDetected || isChecking) return
    setIsChecking(true)
    const currentCheck = checkCount + 1
    setCheckCount(currentCheck)

    try {
      const token = AuthClient.getToken()
      const headers: HeadersInit = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch(`/api/transactions/${paymentOrder.external_id}/status?t=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.processed === true && data.status === "success") {
          handlePaymentDetected()
          return
        }
      } else {
        // optional: log text
        await response.text()
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
    } finally {
      setIsChecking(false)
    }
  }, [paymentOrder, paymentDetected, isChecking, checkCount])

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
      const currentToken = await authenticateHorsePay()

      const body = {
        payer_name: payerName,
        amount: amountNum,
        callback_url: "https://v0-raspay.vercel.app/api/webhook/horsepay",
      }

      const horsePayResponse = await fetch("https://api.horsepay.io/transaction/neworder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (horsePayResponse.ok) {
        const data: PaymentOrder = await horsePayResponse.json()
        setPaymentOrder(data)

        // Persistir transação
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

        // Alterar tela
        setModalState("qrcode")
        setTimeLeft(600)
        setPaymentDetected(false)
        setCheckCount(0)

        // Simulação p/ blogger
        if (isBlogger) {
          setTimeout(async () => {
            try {
              const simulateResponse = await AuthClient.makeAuthenticatedRequest("/api/simulate-deposit", {
                method: "POST",
                body: JSON.stringify({ external_id: data.external_id }),
              })
              if (simulateResponse.ok) {
                const simulateData = await simulateResponse.json()
                await fetchUserProfile()
                await fetchDepositProgress()
                setModalState("success")
                setAmount("")
                setPaymentOrder(null)
                toast({
                  title: "Depósito realizado com sucesso!",
                  description: `R$ ${simulateData.amount.toFixed(2)} creditado na sua conta.`,
                })
                onDepositSuccess?.()
              }
            } catch (error) {
              console.error("Erro na simulação:", error)
            }
          }, 7000)
        }

        toast({
          title: "PIX gerado com sucesso!",
          description: `ID do pedido: ${data.external_id}`,
        })
      } else {
        const errorText = await horsePayResponse.text()
        throw new Error(`Falha ao gerar PIX: ${errorText}`)
      }
    } catch (error) {
      console.error("Erro ao gerar PIX:", error)
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
    // Limpar intervals
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setPaymentDetected(true)
    setModalState("success")

    toast({
      title: "🎉 Pagamento Detectado!",
      description: "Seu depósito foi processado com sucesso!",
    })

    // Atualizar dados
    fetchUserProfile()
    fetchDepositProgress()
    setAmount("")
    setPaymentOrder(null)
    onDepositSuccess?.()

    // Fechar após 3s
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  // Timer
  useEffect(() => {
    if (modalState !== "qrcode" || paymentDetected || !paymentOrder) return
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

  // Interval de verificação
  useEffect(() => {
    if (modalState !== "qrcode" || !paymentOrder || paymentDetected) {
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
      return
    }

    checkPayment() // primeira
    if (!paymentCheckRef.current) paymentCheckRef.current = setInterval(checkPayment, 5000)

    return () => {
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
    }
  }, [modalState, paymentOrder, paymentDetected, checkPayment])

  // Init quando abrir
  useEffect(() => {
    if (isOpen) {
      fetchSystemSettings()
      if (initialProfile) {
        setUserProfile(initialProfile)
        if (initialProfile.user.name && !payerName) setPayerName(initialProfile.user.name)
        if (initialProfile.user.user_type === "blogger") setIsBlogger(true)
      } else {
        fetchUserProfile()
      }
      fetchDepositProgress()
    } else {
      // Reset ao fechar
      cleanupState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialProfile])

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen])

  const cleanupState = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    setModalState("form")
    setPaymentOrder(null)
    setAmount("")
    setPaymentDetected(false)
  }

  const handleClose = () => {
    cleanupState()
    onOpenChange?.(false)
    onClose()
  }

  const handleBackToForm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    setModalState("form")
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

  // Valores sugeridos
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

  // Responsivo: um único contêiner com comportamento de bottom-sheet no mobile e central no desktop
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100] data-[state=open]:animate-in"
        onClick={handleClose}
        role="presentation"
        aria-hidden="true"
      />
      {/* Container responsivo: bottom no mobile; central no desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
        className="
          fixed z-[101] bg-slate-900 text-white
          w-full max-h-[90vh] overflow-y-auto
          bottom-0 left-0 right-0 rounded-t-3xl
          shadow-2xl
          md:bottom-auto md:left-1/2 md:top-1/2 md:right-auto
          md:-translate-x-1/2 md:-translate-y-1/2
          md:rounded-2xl md:w-[720px] md:max-h-[85vh]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={modalState === "form" ? handleClose : handleBackToForm}
              className="text-white hover:bg-slate-800 rounded-full w-8 h-8"
              aria-label={modalState === "form" ? "Fechar" : "Voltar"}
            >
              {modalState === "form" ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
            <h1 id="deposit-modal-title" className="text-base md:text-lg font-semibold">
              {modalState === "form" && "Depositar"}
              {modalState === "qrcode" && "Escaneie o QR Code"}
              {modalState === "success" && "Pagamento Confirmado!"}
            </h1>
          </div>

          {/* Extra close on desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hidden md:inline-flex text-slate-300 hover:text-white hover:bg-slate-800 rounded-full w-8 h-8"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 py-4 md:py-6">
          {modalState === "form" && (
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6 gap-4">
              {/* Coluna esquerda: formulário */}
              <div className="space-y-4">
                {/* Segurança */}
                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 font-medium text-sm md:text-base">
                      Pagamento seguro e verificado.
                    </span>
                  </div>
                </div>

                {/* Valores sugeridos */}
                <div>
                  <Label className="text-white font-medium text-sm md:text-base">Valores sugeridos</Label>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 md:gap-2">
                    {suggestedAmounts.map((s) => (
                      <div key={s.value} className="relative">
                        <Button
                          variant="outline"
                          onClick={() => setAmount(s.value.toString())}
                          className={`w-full h-10 md:h-11 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-md flex items-center justify-center transition-all p-1 ${
                            amount === s.value.toString() ? "border-green-500 bg-green-500/10" : ""
                          }`}
                        >
                          <span className="text-white font-medium text-xs md:text-sm leading-tight">{s.label}</span>
                        </Button>
                        <Badge
                          className={`absolute -top-1 left-1/2 -translate-x-1/2 ${s.badgeColor} text-white border-0 text-[10px] md:text-[11px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}
                        >
                          {s.badge}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Valor */}
                <div className="space-y-1.5">
                  <div>
                    <Label className="text-white font-medium text-sm md:text-base">
                      Valor do depósito <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-slate-400 text-xs md:text-sm mt-0.5">
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
                  {/* Nome oculto (já preenchido) */}
                  <input type="hidden" value={payerName} onChange={(e) => setPayerName(e.target.value)} />
                </div>

                {/* CTA */}
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
              </div>

              {/* Coluna direita: bônus e progresso (mostrado abaixo no mobile) */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-2">
                  <Gift className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  <span className="text-white font-semibold text-base md:text-lg">Bônus de Depósito</span>
                </div>

                {getNextBonus(depositProgress) ? (
                  <div className="text-slate-300 text-sm md:text-base">
                    <span>Deposite </span>
                    <span className="text-green-400 font-semibold">
                      R$ {getNextBonus(depositProgress)!.target.toFixed(2)}
                    </span>
                    <span> hoje para ganhar </span>
                    <span className="text-green-400 font-semibold">
                      +R$ {getNextBonus(depositProgress)!.bonus.toFixed(2)}
                    </span>
                    <span> de bônus!</span>
                  </div>
                ) : (
                  <div className="text-slate-300 text-sm md:text-base">
                    Todos os bônus de hoje foram conquistados! 🎉
                  </div>
                )}

                {getNextBonus(depositProgress) && (
                  <div className="bg-slate-800 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs md:text-sm">Progresso atual</span>
                      <span className="text-white font-semibold text-sm md:text-base">
                        R$ {depositProgress.total_deposited.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Progress
                        value={getProgressPercentage(depositProgress, getNextBonus(depositProgress)!.target)}
                        className="h-1.5 bg-slate-700"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>R$ 0</span>
                        <span>R$ {getNextBonus(depositProgress)!.target}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-slate-400 text-xs md:text-sm">Faltam </span>
                      <span className="text-green-400 font-semibold text-xs md:text-sm">
                        R$ {getNextBonus(depositProgress)!.remaining.toFixed(2)}
                      </span>
                      <span className="text-slate-400 text-xs md:text-sm">
                        {" "}
                        para +R$ {getNextBonus(depositProgress)!.bonus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {modalState === "qrcode" && paymentOrder && (
            <div className="space-y-4 md:space-y-6">
              {/* Timer */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                  <span className="text-sm md:text-base text-gray-300">Tempo restante:</span>
                </div>
                <Badge variant={timeLeft < 60 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
                  {formatTime(timeLeft)}
                </Badge>
              </div>

              {/* QR Code + Código lado a lado em desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
                <Card className="bg-slate-800 border-slate-600">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="mb-4">
                      <img
                        src={paymentOrder.payment || "/placeholder.svg?height=200&width=200&query=qr-code"}
                        alt="QR Code PIX"
                        className="mx-auto max-w-full h-auto border rounded-lg border-slate-600"
                        style={{ maxWidth: "220px" }}
                      />
                    </div>
                    <p className="text-sm md:text-base text-gray-300">
                      Escaneie com o app do seu banco ou use o código PIX.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="bg-slate-800 border-slate-600">
                    <CardContent className="p-4 md:p-6">
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

                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 md:p-6">
                    <div className="text-center text-sm md:text-base text-gray-300 space-y-2">
                      <p className="text-purple-400 font-semibold flex items-center justify-center gap-1">
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
                </div>
              </div>
            </div>
          )}

          {modalState === "success" && (
            <div className="text-center space-y-4 md:space-y-6">
              <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-green-400">Pagamento Confirmado!</h3>
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
    </>
  )
}

// Helpers
function getNextBonus(progress: DepositProgress) {
  if (!progress.bonus_50_claimed && progress.total_deposited < 50) {
    return { target: 50, bonus: 5, remaining: 50 - progress.total_deposited }
  }
  if (!progress.bonus_100_claimed && progress.total_deposited < 100) {
    return { target: 100, bonus: 10, remaining: 100 - progress.total_deposited }
  }
  return null
}

function getProgressPercentage(progress: DepositProgress, target: number) {
  return Math.min((progress.total_deposited / target) * 100, 100)
}
