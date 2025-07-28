"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Gift, Sparkles, MapPin, Phone, User, Mail } from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { toast } from "sonner"

interface PhysicalPrize {
  id: number
  name: string
  description: string | null
  image_url: string | null
  estimated_value: number
}

interface PhysicalPrizeModalProps {
  isOpen: boolean
  onClose: () => void
  prize: PhysicalPrize
  winnerId: number
}

const brazilianStates = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
]

export function PhysicalPrizeModal({ isOpen, onClose, prize, winnerId }: PhysicalPrizeModalProps) {
  const [step, setStep] = useState<"celebration" | "form">("celebration")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    winner_name: "",
    winner_phone: "",
    winner_email: "",
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zipcode: "",
    delivery_notes: "",
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleSubmitDeliveryInfo = async () => {
    setLoading(true)
    try {
      // Validações básicas
      if (
        !formData.winner_name ||
        !formData.winner_phone ||
        !formData.delivery_address ||
        !formData.delivery_city ||
        !formData.delivery_state
      ) {
        toast.error("Por favor, preencha todos os campos obrigatórios")
        return
      }

      const response = await AuthClient.makeAuthenticatedRequest(
        `/api/user/physical-prizes/${winnerId}/delivery-info`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      )

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar dados de entrega")
      }
    } catch (error) {
      console.error("Erro ao salvar dados de entrega:", error)
      toast.error("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
        {step === "celebration" ? (
          // Tela de celebração
          <div className="text-center py-6">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Gift className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-pulse">
                <Sparkles className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
              🎉 PARABÉNS! 🎉
            </h2>

            <p className="text-xl text-white mb-4">Você ganhou um prêmio físico!</p>

            <Card className="bg-slate-800/50 border-slate-600 mb-6">
              <CardContent className="p-4">
                {prize.image_url && (
                  <div className="mb-4">
                    <img
                      src={prize.image_url || "/placeholder.svg"}
                      alt={prize.name}
                      className="w-full h-32 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `/placeholder.svg?height=128&width=200&text=${encodeURIComponent(prize.name)}`
                      }}
                    />
                  </div>
                )}

                <h3 className="text-xl font-bold text-yellow-400 mb-2">{prize.name}</h3>

                {prize.description && <p className="text-gray-300 text-sm mb-3">{prize.description}</p>}

                <div className="text-lg font-semibold text-green-400">
                  Valor estimado: {formatCurrency(prize.estimated_value)}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm">
                <strong>🎁 Seu prêmio será entregue gratuitamente!</strong>
                <br />
                Precisamos dos seus dados para organizar a entrega.
              </p>
            </div>

            <Button
              onClick={() => setStep("form")}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 text-lg"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Informar Dados de Entrega
            </Button>
          </div>
        ) : (
          // Formulário de dados de entrega
          <div>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-white text-xl text-center">📦 Dados para Entrega</DialogTitle>
              <p className="text-gray-400 text-sm text-center">
                Preencha seus dados para recebermos seu prêmio:{" "}
                <strong className="text-yellow-400">{prize.name}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="winner_name" className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="winner_name"
                    value={formData.winner_name}
                    onChange={(e) => handleInputChange("winner_name", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="winner_phone" className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone/WhatsApp *
                  </Label>
                  <Input
                    id="winner_phone"
                    value={formData.winner_phone}
                    onChange={(e) => handleInputChange("winner_phone", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="winner_email" className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id="winner_email"
                    type="email"
                    value={formData.winner_email}
                    onChange={(e) => handleInputChange("winner_email", e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="delivery_address" className="text-white">
                      Endereço Completo *
                    </Label>
                    <Input
                      id="delivery_address"
                      value={formData.delivery_address}
                      onChange={(e) => handleInputChange("delivery_address", e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Rua, número, complemento"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="delivery_city" className="text-white">
                        Cidade *
                      </Label>
                      <Input
                        id="delivery_city"
                        value={formData.delivery_city}
                        onChange={(e) => handleInputChange("delivery_city", e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                        placeholder="Cidade"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="delivery_state" className="text-white">
                        Estado *
                      </Label>
                      <Select
                        value={formData.delivery_state}
                        onValueChange={(value) => handleInputChange("delivery_state", value)}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 text-white">
                          {brazilianStates.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.code} - {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="delivery_zipcode" className="text-white">
                      CEP
                    </Label>
                    <Input
                      id="delivery_zipcode"
                      value={formData.delivery_zipcode}
                      onChange={(e) => handleInputChange("delivery_zipcode", e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery_notes" className="text-white">
                      Observações
                    </Label>
                    <Textarea
                      id="delivery_notes"
                      value={formData.delivery_notes}
                      onChange={(e) => handleInputChange("delivery_notes", e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Ponto de referência, horário preferencial, etc."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Informações importantes */}
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  <strong>📋 Importante:</strong>
                  <br />• Entrega gratuita em todo o Brasil
                  <br />• Prazo de entrega: 5 a 15 dias úteis
                  <br />• Você receberá código de rastreamento
                  <br />• Entraremos em contato pelo WhatsApp
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep("celebration")}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmitDeliveryInfo}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Confirmar Dados"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
