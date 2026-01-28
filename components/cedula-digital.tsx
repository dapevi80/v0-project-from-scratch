'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  MapPin, 
  MessageCircle, 
  Shield, 
  Award,
  Building2,
  Clock,
  ExternalLink,
  User
} from 'lucide-react'

interface LawyerData {
  id: string
  display_name: string
  firm_name?: string
  photo_url?: string
  cedula_numero?: string
  direccion_oficina?: string
  whatsapp?: string
  horario_atencion?: string
  bio?: string
  status?: string
}

interface CedulaDigitalProps {
  lawyer: LawyerData
  open: boolean
  onOpenChange: (open: boolean) => void
  casoFolio?: string
}

export function CedulaDigital({ lawyer, open, onOpenChange, casoFolio }: CedulaDigitalProps) {
  const handleWhatsAppContact = () => {
    if (!lawyer.whatsapp) return
    
    // Formatear numero (quitar espacios, guiones, etc)
    const numero = lawyer.whatsapp.replace(/\D/g, '')
    const numeroConPais = numero.startsWith('52') ? numero : `52${numero}`
    
    // Mensaje predeterminado
    const mensaje = casoFolio 
      ? `Hola Lic. ${lawyer.display_name}, soy cliente de MeCorrieron.mx con el caso folio: ${casoFolio}. Me gustaría recibir asesoría sobre mi caso.`
      : `Hola Lic. ${lawyer.display_name}, soy cliente de MeCorrieron.mx y me gustaría recibir asesoría legal laboral.`
    
    const url = `https://wa.me/${numeroConPais}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-4">
            {/* Foto del abogado */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white/30 bg-white/20 flex-shrink-0">
              {lawyer.photo_url ? (
                <Image
                  src={lawyer.photo_url || "/placeholder.svg"}
                  alt={lawyer.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white/70" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">Lic. {lawyer.display_name}</h2>
              {lawyer.firm_name && (
                <p className="text-blue-100 text-sm truncate">{lawyer.firm_name}</p>
              )}
              <Badge className="mt-2 bg-white/20 text-white border-0">
                <Shield className="w-3 h-3 mr-1" />
                Abogado Verificado
              </Badge>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Cedula profesional */}
          {lawyer.cedula_numero && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium">Cedula Profesional</p>
                  <p className="font-mono font-bold text-amber-900">{lawyer.cedula_numero}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalles de contacto */}
          <div className="space-y-3">
            {lawyer.direccion_oficina && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Direccion de oficina</p>
                  <p className="text-sm text-gray-900">{lawyer.direccion_oficina}</p>
                </div>
              </div>
            )}

            {lawyer.horario_atencion && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Horario de atencion</p>
                  <p className="text-sm text-gray-900">{lawyer.horario_atencion}</p>
                </div>
              </div>
            )}

            {lawyer.whatsapp && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">WhatsApp</p>
                  <p className="text-sm text-gray-900">{lawyer.whatsapp}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bio del abogado */}
          {lawyer.bio && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">Acerca del abogado</p>
              <p className="text-sm text-gray-700">{lawyer.bio}</p>
            </div>
          )}

          {/* Boton de WhatsApp */}
          {lawyer.whatsapp && (
            <Button 
              onClick={handleWhatsAppContact}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle className="w-5 h-5" />
              Contactar por WhatsApp
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          )}

          {/* Footer de verificacion */}
          <p className="text-xs text-center text-gray-400 pt-2">
            Abogado verificado por MeCorrieron.mx
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
