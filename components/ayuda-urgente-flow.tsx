'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, 
  MessageCircle, 
  Phone, 
  User,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react'

// Numero de emergencia de MeCorrieron.mx
const WHATSAPP_EMERGENCIA = '529985933232'

interface AyudaUrgenteFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datosCalculo?: {
    nombreEmpresa?: string
    montoEstimado?: number
    folio?: string
  }
  nombreUsuario?: string
}

type Step = 'confirm' | 'datos' | 'enviando'

export function AyudaUrgenteFlow({ 
  open, 
  onOpenChange, 
  datosCalculo,
  nombreUsuario 
}: AyudaUrgenteFlowProps) {
  const [step, setStep] = useState<Step>('confirm')
  const [nombre, setNombre] = useState(nombreUsuario || '')
  const [telefono, setTelefono] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleConfirm = () => {
    setStep('datos')
  }

  const handleEnviar = () => {
    setStep('enviando')
    
    // Construir mensaje de WhatsApp
    const mensaje = construirMensaje()
    
    // Abrir WhatsApp despues de un breve delay para mostrar animacion
    setTimeout(() => {
      const url = `https://wa.me/${WHATSAPP_EMERGENCIA}?text=${encodeURIComponent(mensaje)}`
      window.open(url, '_blank')
      
      // Cerrar modal despues de abrir WhatsApp
      setTimeout(() => {
        onOpenChange(false)
        setStep('confirm')
        setNombre(nombreUsuario || '')
        setTelefono('')
        setDescripcion('')
      }, 1500)
    }, 1000)
  }

  const construirMensaje = () => {
    let mensaje = `*AYUDA URGENTE - MeCorrieron.mx*\n\n`
    mensaje += `Nombre: ${nombre}\n`
    mensaje += `Telefono: ${telefono}\n`
    
    if (datosCalculo?.nombreEmpresa) {
      mensaje += `Empresa: ${datosCalculo.nombreEmpresa}\n`
    }
    if (datosCalculo?.montoEstimado) {
      mensaje += `Monto estimado: $${datosCalculo.montoEstimado.toLocaleString('es-MX')}\n`
    }
    if (datosCalculo?.folio) {
      mensaje += `Folio: ${datosCalculo.folio}\n`
    }
    
    mensaje += `\n*Situacion:*\n${descripcion || 'Necesito ayuda urgente con mi caso laboral.'}`
    
    return mensaje
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after close animation
    setTimeout(() => {
      setStep('confirm')
      setNombre(nombreUsuario || '')
      setTelefono('')
      setDescripcion('')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Confirmacion */}
        {step === 'confirm' && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Necesitas ayuda urgente?</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Te conectaremos inmediatamente con un asesor legal de MeCorrieron.mx por WhatsApp.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">Respuesta en menos de 5 minutos</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Asesoria confidencial y gratuita</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                Si, necesito ayuda
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Datos de contacto */}
        {step === 'datos' && (
          <>
            <DialogHeader>
              <DialogTitle>Tus datos de contacto</DialogTitle>
              <DialogDescription>
                Para poder ayudarte mejor, necesitamos algunos datos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Tu nombre *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="nombre"
                    placeholder="Ej: Juan Perez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono / WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="telefono"
                    placeholder="Ej: 55 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Describe brevemente tu situacion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Ej: Me despidieron sin liquidacion, necesito saber mis derechos..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                />
              </div>

              {datosCalculo?.nombreEmpresa && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-500">Datos del calculo:</p>
                  <p className="font-medium">{datosCalculo.nombreEmpresa}</p>
                  {datosCalculo.montoEstimado && (
                    <p className="text-green-600">${datosCalculo.montoEstimado.toLocaleString('es-MX')}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('confirm')}
                className="flex-1 bg-transparent"
              >
                Atras
              </Button>
              <Button 
                onClick={handleEnviar}
                disabled={!nombre.trim() || !telefono.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar por WhatsApp
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Enviando */}
        {step === 'enviando' && (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Conectando con asesor...</h3>
            <p className="text-gray-500">Abriendo WhatsApp</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
