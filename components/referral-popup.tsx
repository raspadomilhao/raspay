"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Users, Gift } from "lucide-react"
import { useRouter } from "next/navigation"

interface ReferralPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ReferralPopup({ isOpen, onClose }: ReferralPopupProps) {
  const router = useRouter()

  const handleBannerClick = () => {
    onClose()
    router.push("/perfil?tab=referrals")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-slate-900 border-slate-700 text-white p-6">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-3 top-3 text-gray-400 hover:text-white hover:bg-slate-800 w-6 h-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-3">
              <Gift className="h-6 w-6 text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">Indique amigos e ganhe</h3>
            <p className="text-gray-400 text-sm">
              Ganhe R$ 5 para cada amigo que se cadastrar e fizer o primeiro depósito
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleBannerClick}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Começar a Indicar
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white hover:bg-slate-800 text-sm"
            >
              Talvez mais tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
