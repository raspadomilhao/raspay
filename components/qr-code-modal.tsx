"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Clock, CheckCircle, QrCode } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"

interface PaymentOrder {
  copy_past: string
  external_id: number
  payer_name: string
  payment: string
  status: number
}

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  paymentOrder: PaymentOrder | null
  onPaymentDetected: () => void
}

export function QRCodeModal({ isOpen, onClose, paymentOrder, onPaymentDetected }: QRCodeModalProps) {
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutos
  const [isChecking, setIsChecking] = useState(false)
  const [paymentDetected, setPaymentDetected] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const paymentCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Reset states when modal opens with new payment order
  useEffect(() => {
    if (isOpen && paymentOrder) {
      console.log(`🔄 Modal aberto para external_id: ${paymentOrder.external_id}`)
      setTimeLeft(600)
      setPaymentDetected(false)
      setCheckCount(0)
      setIsChecking(false)
    }

    // Cleanup function to clear intervals when component unmounts or modal closes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
    }
  }, [isOpen, paymentOrder]) // Only depend on external_id to prevent unnecessary reruns

  // Timer countdown
  useEffect(() => {
    if (!isOpen || paymentDetected || !paymentOrder) return

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
  }, [isOpen, paymentDetected, paymentOrder])

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

  // Setup payment checking interval - ALTERADO PARA 5 SEGUNDOS
  useEffect(() => {
    if (!isOpen || !paymentOrder || paymentDetected) {
      // Clear any existing intervals
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
      return
    }

    // Initial check
    checkPayment()

    // Setup interval for subsequent checks - ALTERADO DE 2000 PARA 5000ms (5 segundos)
    if (!paymentCheckRef.current) {
      paymentCheckRef.current = setInterval(checkPayment, 5000)
    }

    return () => {
      if (paymentCheckRef.current) {
        clearInterval(paymentCheckRef.current)
        paymentCheckRef.current = null
      }
    }
  }, [isOpen, paymentOrder, paymentDetected])

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
    toast({
      title: "🎉 Pagamento Detectado!",
      description: "Seu depósito foi processado com sucesso!",
    })

    setTimeout(() => {
      console.log("🔄 Chamando onPaymentDetected e fechando modal")
      onPaymentDetected()
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    console.log("🚪 Fechando modal")
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (paymentCheckRef.current) {
      clearInterval(paymentCheckRef.current)
      paymentCheckRef.current = null
    }
    setPaymentDetected(false)
    onClose()
  }

  if (!paymentOrder) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm mx-auto p-4 max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center space-x-2">
            {paymentDetected ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="text-green-400">Pagamento Confirmado!</span>
              </>
            ) : (
              <>
                <QrCode className="h-6 w-6 text-purple-400" />
                <span className="text-white">Escaneie o QR Code</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!paymentDetected ? (
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
          ) : (
            /* Tela de sucesso */
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-400">Pagamento Confirmado!</h3>
                <p className="text-gray-300">Seu saldo foi atualizado automaticamente.</p>
              </div>
              <div className="bg-green-500/10 border border-green-400/30 p-4 rounded-lg">
                <p className="text-sm text-green-300">
                  <strong>ID da Transação:</strong> {paymentOrder.external_id}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
