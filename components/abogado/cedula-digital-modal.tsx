'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  Download,
  QrCode,
  CheckCircle2,
  Shield,
  ExternalLink,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react'
import { generateVCard } from '@/app/oficina-virtual/guestlawyer/actions'

interface CedulaDigitalModalProps {
  profile: {
    id: string
    full_name: string
    email: string
    phone?: string
    role: string
  }
  lawyerProfile?: {
    cedula_profesional?: string
    firm_name?: string
    photo_url?: string
    bio?: string
    status?: string
  } | null
  onClose: () => void
}

export function CedulaDigitalModal({ profile, lawyerProfile, onClose }: CedulaDigitalModalProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  const isVerified = profile.role === 'lawyer' && lawyerProfile?.status === 'verified'
  
  const handleCopyLink = async () => {
    const link = `https://mecorrieron.mx/abogado/${profile.id}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleDownloadVCard = async () => {
    setDownloading(true)
    const result = await generateVCard(profile.id)
    if (result.data) {
      const blob = new Blob([result.data], { type: 'text/vcard' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${profile.full_name.replace(/\s+/g, '_')}.vcf`
      a.click()
      URL.revokeObjectURL(url)
    }
    setDownloading(false)
  }
  
  const handleWhatsApp = () => {
    if (profile.phone) {
      const phone = profile.phone.replace(/\D/g, '')
      window.open(`https://wa.me/52${phone}`, '_blank')
    }
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${profile.full_name} - Abogado`,
        text: `Contacta a ${profile.full_name}, abogado verificado en mecorrieron.mx`,
        url: `https://mecorrieron.mx/abogado/${profile.id}`
      })
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
              {lawyerProfile?.photo_url ? (
                <img 
                  src={lawyerProfile.photo_url || "/placeholder.svg"} 
                  alt="" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <User className="w-10 h-10 text-white/70" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profile.full_name}</h2>
              {lawyerProfile?.firm_name && (
                <p className="text-white/70 text-sm">{lawyerProfile.firm_name}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {isVerified ? (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    En proceso
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Cedula Profesional */}
        <div className="p-4 bg-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Cedula Profesional</p>
              <p className="text-lg font-mono font-semibold text-slate-900">
                {lawyerProfile?.cedula_profesional || 'Pendiente de registro'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <QrCode className="w-8 h-8 text-slate-400" />
            </div>
          </div>
        </div>
        
        {/* Informacion de contacto */}
        <div className="p-4 space-y-3">
          {profile.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Telefono</p>
                <p className="text-sm font-medium text-slate-900">{profile.phone}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500">Correo</p>
              <p className="text-sm font-medium text-slate-900">{profile.email}</p>
            </div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="p-4 border-t space-y-2">
          {/* WhatsApp - Call to action principal */}
          {profile.phone && (
            <Button 
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar por WhatsApp
            </Button>
          )}
          
          {/* Acciones secundarias */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadVCard}
              disabled={downloading}
              className="flex-col h-auto py-3 bg-transparent"
            >
              <Download className="w-4 h-4 mb-1" />
              <span className="text-xs">Guardar</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="flex-col h-auto py-3 bg-transparent"
            >
              <Share2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Compartir</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="flex-col h-auto py-3 bg-transparent"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mb-1 text-green-600" />
                  <span className="text-xs text-green-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mb-1" />
                  <span className="text-xs">Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 text-center">
          <p className="text-xs text-slate-400">
            Cedula digital verificada en mecorrieron.mx
          </p>
        </div>
      </div>
    </div>
  )
}
