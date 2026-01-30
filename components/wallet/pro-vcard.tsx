'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard,
  QrCode,
  Share2,
  Download,
  Copy,
  Check,
  Shield,
  Award,
  KeyRound,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  MessageCircle,
  User,
  Fingerprint,
  FileSignature,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface ProVCardProps {
  profile: {
    id: string
    full_name: string
    email?: string
    phone?: string
    role: string
    codigo_usuario?: string
  }
  lawyerProfile?: {
    cedula_profesional?: string
    firma_digital?: boolean
    firma_url?: string
    firm_name?: string
    photo_url?: string
    bio?: string
    status?: string
    universidad?: string
    especialidad?: string
    direccion_oficina?: string
    horario_atencion?: string
  } | null
  onClose?: () => void
}

type VCardView = 'card' | 'qr' | 'share'

export function ProVCard({ profile, lawyerProfile, onClose }: ProVCardProps) {
  const [currentView, setCurrentView] = useState<VCardView>('card')
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isVerified = (profile.role === 'lawyer' || profile.role === 'admin' || profile.role === 'superadmin') 
    && lawyerProfile?.status === 'verified'
  const hasDigitalSignature = lawyerProfile?.firma_digital || lawyerProfile?.firma_url
  const profileUrl = `https://mecorrieron.mx/abogado/${profile.id}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCode = async () => {
    if (!profile.codigo_usuario) return
    await navigator.clipboard.writeText(profile.codigo_usuario)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleDownloadVCard = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/abogado/vcard/${profile.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${profile.full_name.replace(/\s+/g, '_')}.vcf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading vCard:', error)
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
        title: `${profile.full_name} - Abogado Verificado`,
        text: `Contacta a ${profile.full_name}, abogado verificado en MeCorrieron.mx`,
        url: profileUrl
      })
    } else {
      handleCopyLink()
    }
  }

  // QR View
  if (currentView === 'qr') {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-white text-base">Codigo QR</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('card')} className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-slate-400 text-xs">Escanea para guardar contacto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <QRCodeSVG 
                value={profileUrl}
                size={180}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/icon.svg",
                  height: 30,
                  width: 30,
                  excavate: true
                }}
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-slate-400">Abogado Verificado</p>
          </div>
          <Button 
            onClick={handleDownloadVCard}
            disabled={downloading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Descargando...' : 'Descargar vCard'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Share View
  if (currentView === 'share') {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-white text-base">Compartir</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('card')} className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
            <p className="text-[10px] text-slate-400 mb-1.5">Tu perfil publico</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-emerald-400 truncate">
                {profileUrl}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyLink} 
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleShare}
              className="bg-slate-700 hover:bg-slate-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            <Button 
              onClick={handleDownloadVCard}
              disabled={downloading}
              variant="outline"
              className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              vCard
            </Button>
          </div>

          {/* WhatsApp */}
          {profile.phone && (
            <Button 
              onClick={handleWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Abrir en WhatsApp
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Main Card View - Premium Design
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {lawyerProfile?.photo_url ? (
                  <img 
                    src={lawyerProfile.photo_url || "/placeholder.svg"} 
                    alt={profile.full_name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white text-lg truncate">{profile.full_name}</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                {lawyerProfile?.firm_name || 'Abogado Independiente'}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Verification Badges */}
        <div className="flex flex-wrap gap-2">
          {isVerified && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-2">
              <Shield className="w-3 h-3 mr-1" />
              Verificado
            </Badge>
          )}
          {hasDigitalSignature && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-2">
              <FileSignature className="w-3 h-3 mr-1" />
              Firma Digital
            </Badge>
          )}
          {lawyerProfile?.cedula_profesional && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-2">
              <Award className="w-3 h-3 mr-1" />
              Cedula
            </Badge>
          )}
        </div>

        {/* Cedula Professional Card */}
        {lawyerProfile?.cedula_profesional && (
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cedula Profesional</p>
                <p className="font-mono text-lg font-bold text-white tracking-wider mt-0.5">
                  {lawyerProfile.cedula_profesional}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            {lawyerProfile.universidad && (
              <p className="text-[10px] text-slate-500 mt-1.5">{lawyerProfile.universidad}</p>
            )}
          </div>
        )}

        {/* Codigo de referido */}
        {profile.codigo_usuario && (
          <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-xl p-3 border border-emerald-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Codigo de referido</p>
                <p className="font-mono text-lg font-bold text-white tracking-wider mt-0.5">
                  {profile.codigo_usuario}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Digital Signature Status */}
        {hasDigitalSignature && (
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-3 border border-blue-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Firma Digital Activa</p>
                <p className="text-[10px] text-blue-400">e.firma SAT registrada</p>
              </div>
              <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          {profile.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-slate-300">{profile.phone}</span>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-slate-300 truncate">{profile.email}</span>
            </div>
          )}
          {lawyerProfile?.firm_name && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-slate-300 truncate">{lawyerProfile.firm_name}</span>
            </div>
          )}
          {lawyerProfile?.direccion_oficina && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-slate-300 truncate">{lawyerProfile.direccion_oficina}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button 
            onClick={() => setCurrentView('qr')}
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-col h-auto py-2.5"
          >
            <QrCode className="w-4 h-4 mb-1" />
            <span className="text-[10px]">QR</span>
          </Button>
          <Button 
            onClick={() => setCurrentView('share')}
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-col h-auto py-2.5"
          >
            <Share2 className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Compartir</span>
          </Button>
          <Button 
            onClick={handleDownloadVCard}
            disabled={downloading}
            variant="outline"
            size="sm"
            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-col h-auto py-2.5"
          >
            <Download className="w-4 h-4 mb-1" />
            <span className="text-[10px]">vCard</span>
          </Button>
        </div>

        {/* WhatsApp CTA */}
        {profile.phone && (
          <Button 
            onClick={handleWhatsApp}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/20"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contactar por WhatsApp
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <p className="text-[10px] text-slate-500">
            Tarjeta digital verificada por MeCorrieron.mx
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for embedding in wallet
export function ProVCardMini({ 
  profile, 
  lawyerProfile, 
  onExpand 
}: ProVCardProps & { onExpand?: () => void }) {
  const isVerified = (profile.role === 'lawyer' || profile.role === 'admin' || profile.role === 'superadmin') 
    && lawyerProfile?.status === 'verified'
  const hasDigitalSignature = lawyerProfile?.firma_digital || lawyerProfile?.firma_url

  return (
    <div 
      onClick={onExpand}
      className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600/50 cursor-pointer hover:border-emerald-500/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
          <CreditCard className="w-6 h-6 text-emerald-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">VCard Profesional</h3>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1.5 py-0">
              GRATIS
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isVerified ? 'Cedula' : '-'} 
            {hasDigitalSignature ? ' + Firma Digital' : ''} 
            {' + Contacto'}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {isVerified && <Shield className="w-3 h-3 text-emerald-400" />}
            {hasDigitalSignature && <FileSignature className="w-3 h-3 text-blue-400" />}
            {lawyerProfile?.cedula_profesional && <Award className="w-3 h-3 text-amber-400" />}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
      </div>
    </div>
  )
}
