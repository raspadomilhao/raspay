"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Package, Truck, CheckCircle, Clock, Phone, MapPin, ArrowLeft, Calendar, DollarSign } from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { PhysicalPrizeModal } from "@/components/physical-prize-modal"
import { toast } from "sonner"

interface PhysicalPrizeWinner {
  id: number
  physical_prize_id: number
  game_name: string
  winner_name: string | null
  winner_phone: string | null
  winner_email: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_zipcode: string | null
  delivery_notes: string | null
  status: string
  admin_notes: string | null
  contacted_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_code: string | null
  created_at: string
  updated_at: string
  prize_name: string
  prize_image_url: string | null
  prize_estimated_value: number
}

const statusConfig = {
  pending_contact: {
    label: "Aguardando Contato",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
    icon: Clock,
    description: "Entraremos em contato em breve",
  },
  contacted: {
    label: "Contatado",
    color: "bg-blue-500/20 text-blue-400 border-blue-400/30",
    icon: Phone,
    description: "Já entramos em contato",
  },
  address_collected: {
    label: "Dados Coletados",
    color: "bg-purple-500/20 text-purple-400 border-purple-400/30",
    icon: MapPin,
    description: "Dados de entrega confirmados",
  },
  shipped: {
    label: "Enviado",
    color: "bg-orange-500/20 text-orange-400 border-orange-400/30",
    icon: Truck,
    description: "Prêmio a caminho",
  },
  delivered: {
    label: "Entregue",
    color: "bg-green-500/20 text-green-400 border-green-400/30",
    icon: CheckCircle,
    description: "Prêmio entregue com sucesso",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500/20 text-red-400 border-red-400/30",
    icon: Clock,
    description: "Entrega cancelada",
  },
}

export default function MeusPremiosPage() {
  const [loading, setLoading] = useState(true)
  const [prizes, setPrizes] = useState<PhysicalPrizeWinner[]>([])
  const [selectedPrize, setSelectedPrize] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = AuthClient.getToken()
    if (!token) {
      router.push("/auth")
      return
    }
    fetchPrizes()
  }, [router])

  const fetchPrizes = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/physical-prizes")
      if (response.ok) {
        const data = await response.json()
        setPrizes(data.prizes || [])
      } else if (response.status === 401) {
        router.push("/auth")
      } else {
        toast.error("Erro ao carregar prêmios")
      }
    } catch (error) {
      console.error("Erro ao buscar prêmios:", error)
      toast.error("Erro ao carregar prêmios")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_contact
  }

  const handleUpdateDeliveryInfo = (prize: PhysicalPrizeWinner) => {
    setSelectedPrize({
      id: prize.physical_prize_id,
      name: prize.prize_name,
      description: null,
      image_url: prize.prize_image_url,
      estimated_value: prize.prize_estimated_value,
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400">Carregando seus prêmios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Gift className="h-8 w-8 text-yellow-400" />
                Meus Prêmios Físicos
              </h1>
              <p className="text-gray-400 mt-1">Acompanhe seus prêmios físicos ganhos</p>
            </div>
          </div>
        </div>

        {/* Lista de Prêmios */}
        {prizes.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-300 mb-2">Nenhum prêmio físico ainda</h3>
              <p className="text-gray-400 mb-6">Continue jogando para ter a chance de ganhar prêmios incríveis!</p>
              <Button
                onClick={() => router.push("/jogos")}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Gift className="h-5 w-5 mr-2" />
                Jogar Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {prizes.map((prize) => {
              const statusInfo = getStatusInfo(prize.status)
              const StatusIcon = statusInfo.icon

              return (
                <Card
                  key={prize.id}
                  className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Imagem do Prêmio */}
                      <div className="flex-shrink-0">
                        {prize.prize_image_url ? (
                          <img
                            src={prize.prize_image_url || "/placeholder.svg"}
                            alt={prize.prize_name}
                            className="w-32 h-32 object-contain rounded-lg bg-slate-800"
                            onError={(e) => {
                              e.currentTarget.src = `/placeholder.svg?height=128&width=128&text=${encodeURIComponent(prize.prize_name)}`
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center">
                            <Gift className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações do Prêmio */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{prize.prize_name}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>Valor: {formatCurrency(prize.prize_estimated_value)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Ganho em: {formatDate(prize.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>Jogo: {prize.game_name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
                          <Badge className={`${statusInfo.color} border flex items-center gap-2 px-3 py-1`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-sm text-gray-400">{statusInfo.description}</span>
                        </div>

                        {/* Informações de Entrega */}
                        {prize.winner_name && (
                          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-white mb-2">Dados de Entrega:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <strong>Nome:</strong> {prize.winner_name}
                              </div>
                              <div>
                                <strong>Telefone:</strong> {prize.winner_phone}
                              </div>
                              {prize.delivery_address && (
                                <div className="md:col-span-2">
                                  <strong>Endereço:</strong> {prize.delivery_address}, {prize.delivery_city} -{" "}
                                  {prize.delivery_state}
                                  {prize.delivery_zipcode && ` - ${prize.delivery_zipcode}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Código de Rastreamento */}
                        {prize.tracking_code && (
                          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Código de Rastreamento:
                            </h4>
                            <code className="text-blue-300 font-mono text-lg">{prize.tracking_code}</code>
                          </div>
                        )}

                        {/* Notas do Admin */}
                        {prize.admin_notes && (
                          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-400 mb-2">Observações:</h4>
                            <p className="text-yellow-200 text-sm">{prize.admin_notes}</p>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex gap-3">
                          {(prize.status === "pending_contact" || prize.status === "contacted") && (
                            <Button
                              onClick={() => handleUpdateDeliveryInfo(prize)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              {prize.winner_name ? "Atualizar Dados" : "Informar Dados de Entrega"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Dados de Entrega */}
      {showModal && selectedPrize && (
        <PhysicalPrizeModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedPrize(null)
            fetchPrizes() // Recarregar dados após fechar modal
          }}
          prize={selectedPrize}
          winnerId={prizes.find((p) => p.physical_prize_id === selectedPrize.id)?.id || 0}
        />
      )}
    </div>
  )
}
