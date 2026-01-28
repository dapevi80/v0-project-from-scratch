'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { 
  Vault, 
  Calculator, 
  FileText, 
  ImageIcon, 
  Video, 
  Music2, 
  Mic,
  Upload,
  CreditCard,
  MapPin,
  Eye,
  Download,
  RefreshCw,
  Plus,
  FolderOpen,
  Clock,
  Shield,
  Loader2,
  Building2,
  Calendar,
  Camera,
  Trash2,
  CheckCircle,
  ExternalLink,
  ScanLine
} from 'lucide-react'
import { AudioRecorder } from '@/components/boveda/audio-recorder'
import { DocumentUploader } from '@/components/boveda/document-uploader'
import { CalculoPDFViewer } from '@/components/boveda/calculo-pdf-viewer'
import { DocumentoCard } from '@/components/boveda/documento-card'
import { OCRScanner } from '@/components/boveda/ocr-scanner'
import { INEScanner } from '@/components/boveda/ine-scanner'
import {
  obtenerDocumentos,
  obtenerCalculos,
  eliminarDocumento,
  obtenerEstadisticas,
  obtenerUrlDocumento,
  obtenerUrlPorPath,
  actualizarPerfilConINE,
  type DatosINEExtraidos
} from './actions'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { CedulaDigital } from '@/components/cedula-digital'
import { AyudaUrgenteFlow } from '@/components/ayuda-urgente-flow'
import { LogoutButton } from '@/app/dashboard/logout-button'

// Declare types
type CategoriaDocumento = 'calculo_liquidacion' | 'propuesta_empresa' | 'evidencia_foto' | 'evidencia_video' | 'evidencia_audio' | 'grabacion_audio' | 'contrato_laboral' | 'hoja_renuncia' | 'ine_frente' | 'ine_reverso' | 'pasaporte' | 'comprobante_domicilio' | 'cedula_profesional' | 'credencial_elector' | 'otro'
type DocumentoBoveda = {
  id: string
  nombre: string
  categoria: CategoriaDocumento
  created_at: string
  tamanio_bytes?: number
  mime_type?: string
  file_url?: string
}
type CalculoLiquidacion = {
  id: string
  nombre?: string
  fecha_salida?: string
  antiguedad_anios: number
  antiguedad_meses?: number
  salario_diario?: number
  total_conciliacion?: number
  archivo_path?: string
  archivo_propuesta_path?: string
  created_at: string
}

// Configuración de categorías - incluye todas las categorías de documentos
const CATEGORIAS_CONFIG: Record<CategoriaDocumento, { label: string; icon: typeof FileText; color: string }> = {
  // Documentos principales
  calculo_liquidacion: { label: 'Cálculos de Liquidación', icon: Calculator, color: 'text-primary' },
  propuesta_empresa: { label: 'Propuestas para Empresa', icon: FileText, color: 'text-blue-600' },
  contrato_laboral: { label: 'Contrato Laboral', icon: FileText, color: 'text-blue-600' },
  hoja_renuncia: { label: 'Hoja de Renuncia', icon: FileText, color: 'text-amber-600' },
  hojas_firmadas: { label: 'Hojas en blanco firmadas', icon: FileText, color: 'text-amber-600' },
  recibo_nomina: { label: 'Recibos de Nómina', icon: FileText, color: 'text-green-600' },
  recibo_dinero: { label: 'Recibos de Dinero', icon: FileText, color: 'text-emerald-600' },
  // Evidencias multimedia
  evidencia_foto: { label: 'Fotos / Capturas', icon: ImageIcon, color: 'text-green-600' },
  evidencia_video: { label: 'Videos', icon: Video, color: 'text-purple-600' },
  video_despido: { label: 'Video del Despido', icon: Video, color: 'text-red-600' },
  evidencia_audio: { label: 'Audios', icon: Music2, color: 'text-orange-600' },
  grabacion_audio: { label: 'Grabaciones', icon: Mic, color: 'text-destructive' },
  grabacion_llamada: { label: 'Grabación de Llamada', icon: Mic, color: 'text-cyan-600' },
  // Identificaciones
  ine_frente: { label: 'INE Frente', icon: CreditCard, color: 'text-slate-600' },
  ine_reverso: { label: 'INE Reverso', icon: CreditCard, color: 'text-slate-600' },
  pasaporte: { label: 'Pasaporte', icon: CreditCard, color: 'text-slate-600' },
  credencial_elector: { label: 'Credencial de Elector', icon: CreditCard, color: 'text-slate-600' },
  cedula_profesional: { label: 'Cédula Profesional', icon: CreditCard, color: 'text-blue-600' },
  // Proceso legal
  solicitud_conciliacion: { label: 'Solicitud de Conciliación', icon: FileText, color: 'text-sky-600' },
  notificacion: { label: 'Notificación Oficial', icon: FileText, color: 'text-violet-600' },
  acuse: { label: 'Acuse de Recibo', icon: FileText, color: 'text-teal-600' },
  expediente: { label: 'Expediente del Caso', icon: FileText, color: 'text-gray-600' },
  // Audiencia y conciliación
  foto_lugar: { label: 'Ubicación del Trabajo', icon: MapPin, color: 'text-orange-600' },
  acta_audiencia: { label: 'Acta de Audiencia', icon: FileText, color: 'text-amber-700' },
  acta_conciliacion: { label: 'Acta de Conciliación', icon: FileText, color: 'text-green-700' },
  constancia_no_conciliacion: { label: 'Constancia No Conciliación', icon: FileText, color: 'text-red-700' },
  // Resolución
  convenio: { label: 'Convenio', icon: FileText, color: 'text-emerald-700' },
  sentencia: { label: 'Sentencia', icon: FileText, color: 'text-purple-700' },
  // Domicilio y testigos
  comprobante_domicilio: { label: 'Comprobante Domicilio', icon: MapPin, color: 'text-teal-600' },
  testigos: { label: 'Datos de Testigos', icon: FileText, color: 'text-blue-700' },
  // Documentos escaneados
  documento_escaneado: { label: 'Documentos Escaneados', icon: ScanLine, color: 'text-purple-600' },
  // Otro
  otro: { label: 'Otros', icon: FileText, color: 'text-muted-foreground' },
}

// Formatear moneda
const formatMXN = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Formatear tamaño
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BovedaPage() {
  const [activeTab, setActiveTab] = useState('documentos')
  const [documentos, setDocumentos] = useState<DocumentoBoveda[]>([])
  const [calculos, setCalculos] = useState<CalculoLiquidacion[]>([])
  const [estadisticas, setEstadisticas] = useState<{
    totalDocumentos: number
    tamanioTotal: number
    porCategoria: Record<string, number>
    totalCalculos: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  
  // Estados para modales
  const [showRecorder, setShowRecorder] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showINEScanner, setShowINEScanner] = useState<'frente' | 'reverso' | null>(null)
  const [ineDataExtraido, setIneDataExtraido] = useState<DatosINEExtraidos | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; casoId: string | null }>({ open: false, casoId: null })
  const [uploaderCategoria, setUploaderCategoria] = useState<string | undefined>(undefined)
  const [loadingDocUrl, setLoadingDocUrl] = useState<string | null>(null)
  
  // Estado para confirmacion de eliminacion
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; docId: string | null; docName?: string }>({ open: false, docId: null })
  const [deleting, setDeleting] = useState(false)
  
  // Función para ver documento (obtiene URL firmada)
  const verDocumento = async (documentoId: string) => {
    setLoadingDocUrl(documentoId)
    try {
      const result = await obtenerUrlDocumento(documentoId)
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        // Error silencioso, ya mostramos alert al usuario
        alert('No se pudo obtener el documento. Por favor intenta de nuevo.')
      }
    } catch {
      // Error manejado silenciosamente
    } finally {
      setLoadingDocUrl(null)
    }
  }
  const [visorUrl, setVisorUrl] = useState<string | null>(null)
  const [visorTipo, setVisorTipo] = useState<string | null>(null)
  const [visorOpen, setVisorOpen] = useState(false)
  const [calculoSeleccionado, setCalculoSeleccionado] = useState<CalculoLiquidacion | null>(null) // Declare setCalculoSeleccionado
  const [visorCalculoOpen, setVisorCalculoOpen] = useState(false) // Declare setVisorCalculoOpen
  
  // Cargar datos optimizado
  const loadData = useCallback(async (isMounted = true) => {
    if (isMounted) setLoading(true)
    setError(null)
    
    try {
      const [docsResult, calcsResult, statsResult] = await Promise.all([
        obtenerDocumentos(),
        obtenerCalculos(),
        obtenerEstadisticas()
      ])
      
      if (!isMounted) return
      
      if (docsResult.requiresAuth || calcsResult.requiresAuth || statsResult.requiresAuth) {
        setRequiresAuth(true)
        return
      }
      
      if (docsResult.success) setDocumentos(docsResult.documentos || [])
      if (calcsResult.success) setCalculos(calcsResult.calculos || [])
      if (statsResult.success) setEstadisticas(statsResult.estadisticas || null)
      
    } catch (err) {
      if (isMounted) setError('Error al cargar los datos')
      console.error(err)
    } finally {
      if (isMounted) setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    let isMounted = true
    loadData(isMounted)
    return () => { isMounted = false }
  }, [loadData])
  
  // Ver documento
  const handleVerDocumento = async (doc: DocumentoBoveda) => {
    const result = await obtenerUrlDocumento(doc.id)
    if (result.success && result.url) {
      setVisorUrl(result.url)
      setVisorTipo(doc.mime_type || 'application/pdf')
      setVisorOpen(true)
    }
  }
  
  // Eliminar documento - mostrar dialogo de confirmacion
  const handleEliminar = (docId: string, docName?: string) => {
    setDeleteConfirm({ open: true, docId, docName })
  }
  
  // Confirmar eliminacion
  const confirmarEliminacion = async () => {
    if (!deleteConfirm.docId) return
    
    setDeleting(true)
    const result = await eliminarDocumento(deleteConfirm.docId)
    setDeleting(false)
    
    if (result.success) {
      loadData()
    }
    setDeleteConfirm({ open: false, docId: null })
  }
  
  // Agrupar documentos por categoría
  const documentosPorCategoria = documentos.reduce((acc, doc) => {
    if (!acc[doc.categoria]) acc[doc.categoria] = []
    acc[doc.categoria].push(doc)
    return acc
  }, {} as Record<string, DocumentoBoveda[]>)
  
  // Si requiere autenticación
  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Vault className="w-7 h-7 text-primary" />
                Mi Bóveda Digital
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Tus documentos, evidencias y cálculos seguros
              </p>
              <Button 
                onClick={() => window.location.href = '/acceso?redirect=/boveda'}
                size="lg"
                className="mt-4"
              >
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header principal con logo, ayuda y cerrar sesion */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          {/* Logo - lleva al dashboard */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-destructive font-bold text-sm">!m!</span>
            </div>
            <span className="text-base sm:text-lg font-semibold hidden xs:inline">mecorrieron.mx</span>
          </Link>
          
          {/* Acciones: ayuda urgente y cerrar sesion */}
          <div className="flex items-center gap-2">
            <AyudaUrgenteButton />
            <LogoutButton />
          </div>
        </div>
      </header>
      
      <div className="container max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Título de sección */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Vault className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              Mi Bóveda Digital
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Tus documentos, evidencias y cálculos seguros
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        
        {/* Acciones rápidas - PRIMERO */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
          <Button
            onClick={() => setShowRecorder(true)}
            variant="outline"
            className="h-auto py-2.5 sm:py-3 flex-col gap-1 bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
            <span className="text-[10px] sm:text-xs font-medium">Grabar</span>
          </Button>
          <Button
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="h-auto py-2.5 sm:py-3 flex-col gap-1 bg-purple-50 border-purple-200 hover:bg-purple-100"
          >
            <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-[10px] sm:text-xs font-medium">Escanear</span>
          </Button>
          <Button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.capture = 'environment'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  setShowUploader(true)
                }
              }
              input.click()
            }}
            variant="outline"
            className="h-auto py-2.5 sm:py-3 flex-col gap-1 bg-green-50 border-green-200 hover:bg-green-100"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-[10px] sm:text-xs font-medium">Foto</span>
          </Button>
          <Button
            onClick={() => setShowUploader(true)}
            variant="outline"
            className="h-auto py-2.5 sm:py-3 flex-col gap-1 bg-primary/5 border-primary/20 hover:bg-primary/10"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-[10px] sm:text-xs font-medium">Subir</span>
          </Button>
        </div>
        
        {/* Estadísticas rápidas - DESPUÉS */}
        {estadisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{estadisticas.totalCalculos}</p>
                  <p className="text-xs text-muted-foreground truncate">Cálculos</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{estadisticas.totalDocumentos}</p>
                  <p className="text-xs text-muted-foreground truncate">Docs</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{estadisticas.porCategoria?.grabacion_audio || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">Audios</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{formatFileSize(estadisticas.tamanioTotal)}</p>
                  <p className="text-xs text-muted-foreground truncate">Usado</p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Contenido principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="documentos" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="calculos" className="gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Cálculos</span>
            </TabsTrigger>
            <TabsTrigger value="identificacion" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Identificación</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Documentos y Evidencias */}
          <TabsContent value="documentos" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </Card>
            ) : documentos.length === 0 ? (
              <Card className="p-8 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No tienes documentos aún</p>
                <Button 
                  onClick={() => setShowUploader(true)}
                  className="mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Subir primer documento
                </Button>
              </Card>
            ) : (
              Object.entries(documentosPorCategoria)
                .filter(([cat]) => !['ine_frente', 'ine_reverso', 'pasaporte', 'comprobante_domicilio', 'calculo_liquidacion', 'propuesta_empresa'].includes(cat))
                .map(([categoria, docs]) => (
                  <Card key={categoria}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {(() => {
                          const config = CATEGORIAS_CONFIG[categoria as CategoriaDocumento]
                          const Icon = config?.icon || ImageIcon
                          return <Icon className={`w-4 h-4 ${config?.color || ''}`} />
                        })()}
                        {CATEGORIAS_CONFIG[categoria as CategoriaDocumento]?.label || categoria}
                        <Badge variant="secondary" className="ml-auto">{docs.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {docs.map(doc => (
                          <div 
                            key={doc.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.nombre}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(doc.created_at).toLocaleDateString('es-MX')}
                                {doc.tamanio_bytes && (
                                  <>
                                    <span>•</span>
                                    {formatFileSize(doc.tamanio_bytes)}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleVerDocumento(doc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleEliminar(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
          
          {/* Tab: Cálculos de Liquidación */}
          <TabsContent value="calculos" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </Card>
            ) : calculos.length === 0 ? (
              <Card className="p-8 text-center">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No has realizado cálculos aún</p>
                <Button 
                  onClick={() => window.location.href = '/calculadora'}
                  className="mt-4 gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Ir a la Calculadora
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {calculos.map(calc => {
                  // Calcular días de salarios caídos dinámicamente
                  const fechaDespido = calc.fecha_salida ? new Date(calc.fecha_salida) : null
                  const hoy = new Date()
                  const diasSalariosCaidos = fechaDespido 
                    ? Math.max(0, Math.floor((hoy.getTime() - fechaDespido.getTime()) / (1000 * 60 * 60 * 24)))
                    : 0
                  
                  // Calcular monto de juicio actualizado con salarios caídos adicionales
                  const salarioDiario = calc.salario_diario || 0
                  const salariosCaidosAdicionales = diasSalariosCaidos * salarioDiario
                  const montoJuicioActualizado = (calc.total_conciliacion || 0) + salariosCaidosAdicionales
                  
                  return (
                    <Card key={calc.id} className="overflow-hidden">
                      {/* Header con nombre de empresa */}
                      <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{calc.nombre || 'Sin nombre'}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatMXN(calc.salario_diario * 30)}/mes
                        </Badge>
                      </div>
                      
                      <div className="p-4">
                        {/* Fecha de despido y contador */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Despido:</span>
                            <span className="font-medium">
                              {fechaDespido?.toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {diasSalariosCaidos} días de salarios caídos
                            </span>
                          </div>
                        </div>
                        
                        {/* Montos */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Conciliación</p>
                            <p className="text-xl font-bold text-blue-700">
                              {formatMXN(calc.total_conciliacion || 0)}
                            </p>
                            <p className="text-xs text-blue-500 mt-1">Monto fijo</p>
                          </div>
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-xs text-red-600 mb-1">Juicio (actualizado)</p>
                            <p className="text-xl font-bold text-red-700">
                              {formatMXN(montoJuicioActualizado)}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              +{formatMXN(salariosCaidosAdicionales)} en salarios
                            </p>
                          </div>
                        </div>
                        
                        {/* Info adicional */}
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Antigüedad: {calc.antiguedad_anios}a {calc.antiguedad_meses || 0}m</span>
                          <span>Creado: {new Date(calc.created_at).toLocaleDateString('es-MX')}</span>
                        </div>
                        
                        {/* Acciones */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => setConfirmDialog({ open: true, casoId: calc.id })}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver Caso
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent"
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              
                              // Descargar PDF
                              const descargarPDF = async (path: string, nombre: string) => {
                                try {
                                  const result = await obtenerUrlPorPath(path)
                                  
                                  if (result.success && result.url) {
                                    const link = document.createElement('a')
                                    link.href = result.url
                                    link.download = `${nombre}.pdf`
                                    link.target = '_blank'
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  } else {
                                    alert('Error al obtener el archivo: ' + (result.error || 'Desconocido'))
                                  }
                                } catch (err) {
                                  alert('Error al descargar el archivo')
                                }
                              }
                              
                              // Descargar liquidación
                              if (calc.archivo_path) {
                                await descargarPDF(calc.archivo_path, `${calc.nombre_empresa || 'liquidacion'}-calculo`)
                              } else {
                                console.log('[v0] No archivo_path available')
                                alert('No hay archivo de liquidación disponible')
                              }
                              
                              // Descargar propuesta empresa si existe
                              if (calc.archivo_propuesta_path) {
                                setTimeout(async () => {
                                  await descargarPDF(calc.archivo_propuesta_path!, `${calc.nombre_empresa || 'propuesta'}-empresa`)
                                }, 1000)
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleEliminar(calc.id, calc.nombre_empresa || 'Calculo')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
          
          {/* Tab: Identificación */}
          <TabsContent value="identificacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Documentos de Identificación
                  {(documentosPorCategoria.ine_frente?.[0] || documentosPorCategoria.ine_reverso?.[0] || documentosPorCategoria.pasaporte?.[0]) ? (
                    <Badge className="bg-amber-500 text-white text-xs">Por Verificar</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Cuenta Guest</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Sube tus documentos de identificación para completar tu expediente y obtener la insignia de cuenta verificada. 
                  Una cuenta verificada es aquella que ya subió INE o pasaporte y tiene caso completo para contratar abogado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* INE */}
                <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">INE / Credencial de Elector</p>
                      <p className="text-xs text-muted-foreground">Frente y reverso</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* Frente */}
                    {documentosPorCategoria.ine_frente?.[0] ? (
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium">Frente</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            disabled={loadingDocUrl === documentosPorCategoria.ine_frente[0].id}
                            onClick={() => verDocumento(documentosPorCategoria.ine_frente[0].id)}
                          >
                            {loadingDocUrl === documentosPorCategoria.ine_frente[0].id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          {!documentosPorCategoria.ine_frente[0].verificado && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleEliminar(documentosPorCategoria.ine_frente[0].id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-sm" 
                        onClick={() => setShowINEScanner('frente')}
                      >
                        <ScanLine className="w-4 h-4 mr-2 flex-shrink-0 text-blue-600" />
                        <span className="text-blue-700">Escanear frente (OCR)</span>
                      </Button>
                    )}
                    {/* Reverso */}
                    {documentosPorCategoria.ine_reverso?.[0] ? (
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium">Reverso</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            disabled={loadingDocUrl === documentosPorCategoria.ine_reverso[0].id}
                            onClick={() => verDocumento(documentosPorCategoria.ine_reverso[0].id)}
                          >
                            {loadingDocUrl === documentosPorCategoria.ine_reverso[0].id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          {!documentosPorCategoria.ine_reverso[0].verificado && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleEliminar(documentosPorCategoria.ine_reverso[0].id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-auto py-2 sm:py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100 text-sm" 
                        onClick={() => setShowINEScanner('reverso')}
                      >
                        <ScanLine className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-600" />
                        <span className="text-indigo-700">Escanear reverso (CURP)</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Info de datos extraidos */}
                {ineDataExtraido && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-700">Datos extraidos de la INE</p>
                        <div className="mt-1 space-y-0.5 text-xs text-green-600">
                          {ineDataExtraido.curp && (
                            <p><span className="font-medium">CURP:</span> {ineDataExtraido.curp}</p>
                          )}
                          {ineDataExtraido.nombreCompleto && (
                            <p><span className="font-medium">Nombre:</span> {ineDataExtraido.nombreCompleto}</p>
                          )}
                          {ineDataExtraido.fechaNacimiento && (
                            <p><span className="font-medium">Nacimiento:</span> {new Date(ineDataExtraido.fechaNacimiento).toLocaleDateString('es-MX')}</p>
                          )}
                          {ineDataExtraido.domicilio?.domicilioCompleto && (
                            <p><span className="font-medium">Domicilio:</span> {ineDataExtraido.domicilio.domicilioCompleto}</p>
                          )}
                        </div>
                        <p className="text-[10px] text-green-500 mt-1">
                          Estos datos se usarán para llenar formularios del CCL
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Pasaporte */}
                <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Pasaporte (opcional)</p>
                      <p className="text-xs text-muted-foreground">Solo página con foto</p>
                    </div>
                  </div>
                  {documentosPorCategoria.pasaporte?.[0] ? (
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium">Pasaporte</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          disabled={loadingDocUrl === documentosPorCategoria.pasaporte[0].id}
                          onClick={() => verDocumento(documentosPorCategoria.pasaporte[0].id)}
                        >
                          {loadingDocUrl === documentosPorCategoria.pasaporte[0].id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        {!documentosPorCategoria.pasaporte[0].verificado && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleEliminar(documentosPorCategoria.pasaporte[0].id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full justify-start h-auto py-2 sm:py-3 bg-transparent text-sm" onClick={() => {
                      setUploaderCategoria('pasaporte')
                      setShowUploader(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                      Subir pasaporte
                    </Button>
                  )}
                </div>
                
                {/* Cedula Profesional (para abogados) */}
                <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Cedula Profesional</p>
                      <p className="text-xs text-muted-foreground">Para abogados verificados</p>
                    </div>
                  </div>
                  {documentosPorCategoria.cedula_profesional?.[0] ? (
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium">Cedula</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          disabled={loadingDocUrl === documentosPorCategoria.cedula_profesional[0].id}
                          onClick={() => verDocumento(documentosPorCategoria.cedula_profesional[0].id)}
                        >
                          {loadingDocUrl === documentosPorCategoria.cedula_profesional[0].id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleEliminar(documentosPorCategoria.cedula_profesional[0].id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full justify-start h-auto py-2 sm:py-3 bg-transparent text-sm" onClick={() => {
                      setUploaderCategoria('cedula_profesional')
                      setShowUploader(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                      Subir cedula profesional
                    </Button>
                  )}
                </div>
                
                {/* Comprobante domicilio */}
                <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Comprobante de Domicilio</p>
                      <p className="text-xs text-muted-foreground">Recibo de luz, agua, telefono (max 3 meses)</p>
                    </div>
                  </div>
                  {documentosPorCategoria.comprobante_domicilio?.[0] ? (
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium">Comprobante</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          disabled={loadingDocUrl === documentosPorCategoria.comprobante_domicilio[0].id}
                          onClick={() => verDocumento(documentosPorCategoria.comprobante_domicilio[0].id)}
                        >
                          {loadingDocUrl === documentosPorCategoria.comprobante_domicilio[0].id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleEliminar(documentosPorCategoria.comprobante_domicilio[0].id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full justify-start h-auto py-2 sm:py-3 bg-transparent text-sm" onClick={() => {
                      setUploaderCategoria('comprobante_domicilio')
                      setShowUploader(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                      Subir comprobante
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modal: Grabador de audio */}
        <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
          <DialogContent className="max-w-md">
            <AudioRecorder 
              onSaved={() => {
                setShowRecorder(false)
                loadData()
              }}
              onCancel={() => setShowRecorder(false)}
            />
          </DialogContent>
        </Dialog>
        
        {/* Modal: Subidor de documentos */}
        <Dialog open={showUploader} onOpenChange={(open) => {
          setShowUploader(open)
          if (!open) setUploaderCategoria(undefined)
        }}>
          <DialogContent className="w-[90vw] max-w-[340px] p-0 gap-0 overflow-hidden max-h-[85vh] [&>button]:hidden [&>div]:w-full">
            <DocumentUploader 
              onUploaded={() => {
                setShowUploader(false)
                setUploaderCategoria(undefined)
                loadData() // Refrescar boveda automaticamente
              }}
              onClose={() => {
                setShowUploader(false)
                setUploaderCategoria(undefined)
                loadData() // Refrescar boveda al cerrar tambien
              }}
              defaultCategoria={uploaderCategoria}
            />
          </DialogContent>
        </Dialog>
        
        {/* Modal: Escáner OCR */}
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent className="w-[95vw] max-w-[400px] p-0 gap-0 overflow-hidden max-h-[85vh] [&>button]:hidden">
            <OCRScanner 
              onClose={() => setShowScanner(false)}
              onComplete={() => {
                setShowScanner(false)
                loadData() // Refrescar bóveda automáticamente
              }}
            />
          </DialogContent>
        </Dialog>
        
        {/* Modal: Escáner inteligente de INE */}
        <Dialog open={showINEScanner !== null} onOpenChange={(open) => !open && setShowINEScanner(null)}>
          <DialogContent className="w-[95vw] max-w-[400px] p-0 gap-0 overflow-hidden max-h-[85vh] [&>button]:hidden">
            {showINEScanner && (
              <INEScanner 
                lado={showINEScanner}
                datosExistentes={ineDataExtraido || undefined}
                onClose={() => setShowINEScanner(null)}
                onComplete={async (result) => {
                  setShowINEScanner(null)
                  
                  // Guardar datos extraídos
                  const newData = result.ineData as DatosINEExtraidos
                  setIneDataExtraido(prev => prev ? { ...prev, ...newData } : newData)
                  
                  // Actualizar perfil con los datos de la INE
                  if (newData.curp || newData.nombreCompleto || newData.domicilio) {
                    await actualizarPerfilConINE(newData)
                  }
                  
                  // Refrescar datos
                  loadData()
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Modal: Visor de documentos */}
        <Dialog open={visorOpen} onOpenChange={setVisorOpen}>
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle>Visualizar Documento</DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full bg-muted">
              {visorUrl && (
                visorTipo?.startsWith('image/') ? (
                  <img 
                    src={visorUrl || "/placeholder.svg"} 
                    alt="Documento"
                    className="w-full h-[calc(90vh-60px)] object-contain"
                  />
                ) : visorTipo?.startsWith('video/') ? (
                  <video 
                    src={visorUrl}
                    controls
                    className="w-full h-[calc(90vh-60px)]"
                  />
                ) : visorTipo?.startsWith('audio/') ? (
                  <div className="flex items-center justify-center h-[calc(90vh-60px)]">
                    <audio src={visorUrl} controls className="w-full max-w-md" />
                  </div>
                ) : (
                  <iframe
                    src={visorUrl}
                    className="w-full h-[calc(90vh-60px)]"
                    title="Documento"
                  />
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Modal: Documentos del cálculo - Simplificado para móvil */}
        <Dialog open={visorCalculoOpen} onOpenChange={setVisorCalculoOpen}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{calculoSeleccionado?.nombre || 'Cálculo'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {calculoSeleccionado?.fecha_salida 
                  ? new Date(calculoSeleccionado.fecha_salida).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })
                  : ''
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 space-y-4 overflow-auto max-h-[calc(90vh-100px)]">
              {/* Documento de Liquidación */}
              {calculoSeleccionado?.archivo_path && (
                <DocumentoCard
                  titulo="Tu Liquidacion"
                  descripcion="Infografia detallada de tu caso"
                  archivoPath={calculoSeleccionado.archivo_path}
                  nombreArchivo={calculoSeleccionado?.nombre || 'liquidacion'}
                  obtenerUrl={obtenerUrlPorPath}
                />
              )}
              
              {/* Propuesta para Empresa */}
              {calculoSeleccionado?.archivo_propuesta_path && (
                <DocumentoCard
                  titulo="Propuesta Empresa"
                  descripcion="Documento para negociacion"
                  archivoPath={calculoSeleccionado.archivo_propuesta_path}
                  nombreArchivo={`${calculoSeleccionado?.nombre || 'propuesta'}-empresa`}
                  obtenerUrl={obtenerUrlPorPath}
                />
              )}
              

            </div>
          </DialogContent>
        </Dialog>
        
        {/* AlertDialog: Confirmar eliminacion */}
        <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, docId: null })}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Eliminar documento
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {deleteConfirm.docName 
                  ? `¿Estas seguro de eliminar "${deleteConfirm.docName}"?`
                  : '¿Estas seguro de eliminar este documento?'
                }
                <br />
                <span className="text-destructive/80 text-sm">Esta accion no se puede deshacer.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel 
                disabled={deleting}
                className="bg-muted hover:bg-muted/80"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminacion}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Diálogo personalizado para salir a ver caso */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, casoId: null })}>
          <AlertDialogContent className="max-w-[340px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                Ir a tu caso
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Vas a salir de la Bóveda para ver los detalles de tu caso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 sm:gap-2">
              <AlertDialogCancel className="flex-1 mt-0 bg-muted hover:bg-muted/80">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDialog.casoId) {
                    window.location.href = `/casos/${confirmDialog.casoId}`
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Ver caso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
