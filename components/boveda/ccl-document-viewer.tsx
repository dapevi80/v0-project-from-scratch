'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  FileText, 
  Eye, 
  Download, 
  Loader2, 
  Share2, 
  Printer,
  ExternalLink,
  CheckCircle,
  Building2,
  Calendar,
  Copy,
  Mail,
  Smartphone
} from 'lucide-react'

interface CCLDocumentViewerProps {
  documentUrl: string
  folio: string
  estado: string
  fechaSolicitud: string
  tipo: 'solicitud' | 'acuse' | 'constancia'
  nombreTrabajador?: string
  onClose?: () => void
  isOpen?: boolean
}

export function CCLDocumentViewer({
  documentUrl,
  folio,
  estado,
  fechaSolicitud,
  tipo,
  nombreTrabajador,
  onClose,
  isOpen = true
}: CCLDocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const tipoLabels = {
    solicitud: 'Solicitud de Conciliación',
    acuse: 'Acuse de Recibo',
    constancia: 'Constancia de No Conciliación'
  }

  const tipoColors = {
    solicitud: 'bg-sky-100 text-sky-700 border-sky-200',
    acuse: 'bg-teal-100 text-teal-700 border-teal-200',
    constancia: 'bg-amber-100 text-amber-700 border-amber-200'
  }

  useEffect(() => {
    if (documentUrl) {
      setLoading(false)
    }
  }, [documentUrl])

  const handleDownload = async () => {
    if (!documentUrl) return
    setDownloading(true)
    try {
      const response = await fetch(documentUrl)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `CCL-${estado}-${folio}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      window.open(documentUrl, '_blank')
    }
    setDownloading(false)
  }

  const handlePrint = async () => {
    if (!documentUrl) return
    setPrinting(true)
    try {
      // Abrir en nueva ventana para imprimir
      const printWindow = window.open(documentUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch {
      window.open(documentUrl, '_blank')
    }
    setPrinting(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin soporte
      const textArea = document.createElement('textarea')
      textArea.value = documentUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    const mensaje = `Documento oficial CCL - ${tipoLabels[tipo]}\nFolio: ${folio}\nEstado: ${estado}\n\nVer documento: ${documentUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const handleEmail = () => {
    const subject = `Documento CCL - Folio ${folio}`
    const body = `Adjunto el documento oficial del Centro de Conciliación Laboral:\n\nTipo: ${tipoLabels[tipo]}\nFolio: ${folio}\nEstado: ${estado}\nFecha: ${new Date(fechaSolicitud).toLocaleDateString('es-MX')}\n\nVer documento: ${documentUrl}`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const content = (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Centro de Conciliación Laboral</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{new Date(fechaSolicitud).toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={tipoColors[tipo]}>
            {tipoLabels[tipo]}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            {folio}
          </Badge>
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
        <CheckCircle className="w-4 h-4 text-primary" />
        <span className="text-sm">
          <span className="text-muted-foreground">Estado:</span>{' '}
          <span className="font-medium">{estado}</span>
        </span>
        {nombreTrabajador && (
          <>
            <span className="text-muted-foreground mx-1">|</span>
            <span className="text-sm">
              <span className="text-muted-foreground">Trabajador:</span>{' '}
              <span className="font-medium">{nombreTrabajador}</span>
            </span>
          </>
        )}
      </div>

      {/* Document preview */}
      <div className="relative rounded-lg overflow-hidden border bg-white" style={{ height: '50vh', minHeight: '300px' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando documento oficial...</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`${documentUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full"
            title="Documento CCL Oficial"
          />
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          className="h-12 sm:h-14 flex-col gap-1 bg-transparent text-xs sm:text-sm"
          onClick={() => window.open(documentUrl, '_blank')}
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Ver completo</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 sm:h-14 flex-col gap-1 bg-transparent text-xs sm:text-sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span>Descargar</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 sm:h-14 flex-col gap-1 bg-transparent text-xs sm:text-sm"
          onClick={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span>Imprimir</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-12 sm:h-14 flex-col gap-1 bg-transparent text-xs sm:text-sm"
          onClick={() => setShowShareOptions(true)}
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Compartir</span>
        </Button>
      </div>

      {/* Share options modal */}
      <Dialog open={showShareOptions} onOpenChange={setShowShareOptions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Compartir documento
            </DialogTitle>
            <DialogDescription>
              Elige cómo compartir el documento oficial
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-12 bg-transparent"
              onClick={handleWhatsApp}
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-green-600" />
              </div>
              <span>WhatsApp</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-12 bg-transparent"
              onClick={handleEmail}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <span>Correo electrónico</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-12 bg-transparent"
              onClick={handleCopyLink}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <span>{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer notice */}
      <div className="text-center text-xs text-muted-foreground p-2 bg-muted/30 rounded">
        Documento oficial emitido por el Centro de Conciliación Laboral de {estado}
      </div>
    </div>
  )

  // Si tiene onClose, renderizar como Dialog
  if (onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documento Oficial CCL
            </DialogTitle>
            <DialogDescription>
              {tipoLabels[tipo]} - Folio {folio}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  // Renderizar como Card standalone
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-primary" />
          Documento Oficial CCL
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

// Componente simplificado para lista de documentos CCL
export function CCLDocumentCard({
  documentUrl,
  folio,
  estado,
  fechaSolicitud,
  tipo,
  onView
}: {
  documentUrl: string
  folio: string
  estado: string
  fechaSolicitud: string
  tipo: 'solicitud' | 'acuse' | 'constancia'
  onView: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  const tipoLabels = {
    solicitud: 'Solicitud',
    acuse: 'Acuse',
    constancia: 'Constancia'
  }

  const tipoIcons = {
    solicitud: 'bg-sky-100 text-sky-600',
    acuse: 'bg-teal-100 text-teal-600',
    constancia: 'bg-amber-100 text-amber-600'
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(documentUrl)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `CCL-${estado}-${folio}.pdf`
      link.click()
    } catch {
      window.open(documentUrl, '_blank')
    }
    setDownloading(false)
  }

  return (
    <div className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tipoIcons[tipo]}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{tipoLabels[tipo]} CCL</p>
            <Badge variant="outline" className="text-[10px] font-mono">{folio}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {estado} - {new Date(fechaSolicitud).toLocaleDateString('es-MX')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 text-xs bg-transparent"
          onClick={onView}
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 text-xs bg-transparent"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
          Bajar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          onClick={() => {
            const msg = `Documento CCL - ${tipoLabels[tipo]}\nFolio: ${folio}\n${documentUrl}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
        >
          <Smartphone className="w-3 h-3 mr-1" />
          WA
        </Button>
      </div>
    </div>
  )
}
