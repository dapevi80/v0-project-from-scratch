'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle, Shield, FileX, Video, Users, MessageCircle, Bell } from 'lucide-react'

const WHATSAPP_NUMBER = '9985933232'
const WHATSAPP_MESSAGE = encodeURIComponent('Hola, necesito ayuda urgente con mi caso de despido')

export function AyudaUrgenteButton({ className }: { className?: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0)

  const handleOpenPopups = () => {
    setStep(1)
  }

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(0)
      window.open(`https://wa.me/52${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`, '_blank')
    }
  }

  const handleClose = () => {
    if (step === 2) {
      window.open(`https://wa.me/52${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`, '_blank')
    }
    setStep(0)
  }

  return (
    <>
      <Button 
        size="sm" 
        variant="destructive" 
        className={className}
        onClick={handleOpenPopups}
      >
        <span className="sm:hidden">!Ayuda!</span>
        <span className="hidden sm:inline">!Ayuda urgente!</span>
      </Button>

      {/* Primer Popup - No firmes nada */}
      <Dialog open={step === 1} onOpenChange={() => handleClose()}>
        <DialogContent className="w-[92vw] max-w-sm mx-auto border-destructive border-2 bg-white">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive flex items-center justify-center">
              <FileX className="w-7 h-7 text-white" />
            </div>
            <DialogTitle className="text-lg sm:text-xl text-center text-destructive font-bold leading-tight">
              Te están despidiendo?
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-2 py-3">
            <AlertTriangle className="w-6 h-6 text-destructive animate-pulse" />
            <span className="text-xl sm:text-2xl font-black text-destructive">
              NO FIRMES NADA!
            </span>
            <AlertTriangle className="w-6 h-6 text-destructive animate-pulse" />
          </div>
          
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Puedes llevarte el documento y revisarlo.
          </DialogDescription>

          <Button 
            onClick={handleNextStep}
            className="w-full mt-2"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      {/* Segundo Popup - Consejos */}
      <Dialog open={step === 2} onOpenChange={() => handleClose()}>
        <DialogContent className="w-[92vw] max-w-sm mx-auto border-primary border-2 bg-white">
          <DialogHeader className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <DialogTitle className="text-lg text-center text-primary font-bold">
              Protege tus derechos
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2 py-2">
            <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <Video className="w-6 h-6 text-destructive mb-1" />
              <span className="text-xs font-semibold text-destructive text-center">Graba</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <FileX className="w-6 h-6 text-destructive mb-1" />
              <span className="text-xs font-semibold text-destructive text-center">No firmes</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
              <Users className="w-6 h-6 text-primary mb-1" />
              <span className="text-xs font-semibold text-primary text-center">Testigos</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
              <MessageCircle className="w-6 h-6 text-primary mb-1" />
              <span className="text-xs font-semibold text-primary text-center">Asesorate</span>
            </div>
          </div>

          {/* Alerta de 2 meses */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/40">
            <Bell className="w-5 h-5 text-destructive animate-[pulse_1s_ease-in-out_infinite]" />
            <span className="text-xs font-bold text-destructive">
              Solo tienes 2 meses para reclamar!
            </span>
          </div>

          <Button 
            onClick={handleNextStep}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp Urgente
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
