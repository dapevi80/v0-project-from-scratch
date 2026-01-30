'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Play, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Eye, Shield, HelpCircle, Send, Camera, RefreshCw, FileText, ExternalLink, Copy, Globe } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MatrixRain } from '@/components/ui/matrix-rain'

type TestStatus = 'pendiente' | 'en_progreso' | 'exito' | 'parcial' | 'error'
type ErrorType = 'captcha' | 'timeout' | 'conexion' | 'formulario' | 'validacion' | 'ninguno'

// Pasos del proceso de automatizacion
type PasoRobot = 'conexion' | 'carga_portal' | 'login' | 'formulario' | 'captcha' | 'envio' | 'confirmacion' | 'descarga_pdf'

interface PasoDetalle {
  paso: PasoRobot
  nombre: string
  completado: boolean
  error: boolean
  tiempo: number
  screenshot: string
  mensaje: string
}

interface Resultado {
  estado: string
  status: TestStatus
  tiempo: number
  errorType: ErrorType
  errorMessage: string
  screenshot: string
  url: string
  captchaPendiente: boolean
  accionSugerida: string
  pdfUrl: string
  folioGenerado: string
  jobId?: string
  casoId?: string
  empresaNombre?: string
  progreso?: number
  currentStepRaw?: string
  // Nuevos campos para tracking detallado
  pasoActual: PasoRobot
  pasoDetenido: PasoRobot | null
  pasos: PasoDetalle[]
  errorDetallado: {
    tipo: 'red' | 'servidor' | 'captcha' | 'timeout' | 'formulario' | 'desconocido'
    codigo: string
    descripcion: string
    timestamp: string
    intentos: number
  } | null
  // Datos para acceso a SINACOL
  cuentaCCL?: {
    urlLogin?: string
    urlBuzon?: string
    urlSinacol?: string
  }
  logs?: Array<{ level: string; message: string; created_at?: string }>
}

// Configuración especial para portal Federal
const PORTAL_FEDERAL_INFO = {
  nombre: 'Centro Federal de Conciliación y Registro Laboral (CFCRL)',
  descripcion: 'Jurisdicción federal: empresas con actividades de competencia federal',
  url: 'https://cfcrl.gob.mx',
  urlSolicitud: 'https://cfcrl.gob.mx/solicitud',
  tiposCasos: ['Ferrocarriles', 'Aviación', 'Electricidad', 'Petróleo', 'Banca', 'Seguros']
}

// Pasos del proceso de automatizacion (a nivel de modulo)
const PASOS_ROBOT: { paso: PasoRobot; nombre: string }[] = [
  { paso: 'conexion', nombre: 'Conexion a red' },
  { paso: 'carga_portal', nombre: 'Carga del portal' },
  { paso: 'login', nombre: 'Acceso/Login' },
  { paso: 'formulario', nombre: 'Llenado de formulario' },
  { paso: 'captcha', nombre: 'Resolucion CAPTCHA' },
  { paso: 'envio', nombre: 'Envio de solicitud' },
  { paso: 'confirmacion', nombre: 'Confirmacion' },
  { paso: 'descarga_pdf', nombre: 'Descarga PDF' }
]

const CURSOR_POSITIONS = [
  { top: '18%', left: '24%' },
  { top: '32%', left: '58%' },
  { top: '48%', left: '36%' },
  { top: '64%', left: '62%' },
  { top: '78%', left: '30%' }
]

export default function CCLDiagnosticoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [ejecutando, setEjecutando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [selectedEstado, setSelectedEstado] = useState<Resultado | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [captchasSolicitados, setCaptchasSolicitados] = useState<string[]>([])
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('')
  const [selectedPdfEstado, setSelectedPdfEstado] = useState('')
  const [livePreviewIndex, setLivePreviewIndex] = useState(0)
  const [livePreviewPlaying, setLivePreviewPlaying] = useState(true)
  const [casoIdInput, setCasoIdInput] = useState('')
  const [jobIdActivo, setJobIdActivo] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/acceso')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'superadmin') {
        router.replace('/admin')
        return
      }
      
      setIsSuperAdmin(true)
      setResultados([])
      setLoading(false)
    }
    
    checkAccess()
  }, [router])

  useEffect(() => {
    if (!showDetailDialog || !selectedEstado) return
    const frames = selectedEstado.pasos.filter(p => p.screenshot)
    if (frames.length === 0 || !livePreviewPlaying) return
    const interval = setInterval(() => {
      setLivePreviewIndex((prev) => (prev + 1) % frames.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [showDetailDialog, selectedEstado, livePreviewPlaying])

  useEffect(() => {
    if (!jobIdActivo) return

    let isMounted = true
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/ccl/agent/status/${jobIdActivo}`)
        if (!response.ok) return
        const data = await response.json()
        if (!isMounted) return
        const nuevoResultado = construirResultadoDesdeJob(data.job, data.logs || [])
        setResultados([nuevoResultado])
        setSelectedEstado(nuevoResultado)
        setProgreso(data.job?.progress || 0)
        setEjecutando(data.job?.status === 'running' || data.job?.status === 'pending')
      } catch {
        // Ignorar errores temporales de red
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 4000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [jobIdActivo])

  const crearPasosIniciales = (): PasoDetalle[] => {
    return PASOS_ROBOT.map(p => ({
      paso: p.paso,
      nombre: p.nombre,
      completado: false,
      error: false,
      tiempo: 0,
      screenshot: '',
      mensaje: ''
    }))
  }

  // Mapeo real de pasos y estado del job
  const mapStepFromJob = (step?: string): PasoRobot => {
    const normalized = (step || '').toLowerCase()
    if (normalized.includes('navegando') || normalized.includes('portal')) return 'carga_portal'
    if (normalized.includes('iniciando') || normalized.includes('browser')) return 'conexion'
    if (normalized.includes('llenando') || normalized.includes('formulario')) return 'formulario'
    if (normalized.includes('captcha')) return 'captcha'
    if (normalized.includes('envi')) return 'envio'
    if (normalized.includes('confirm')) return 'confirmacion'
    if (normalized.includes('pdf') || normalized.includes('extrayendo')) return 'descarga_pdf'
    return 'conexion'
  }

  const detectarCaptcha = (logs: Array<{ level: string; message: string }> = [], error?: string) => {
    const texto = `${error || ''} ${logs.map((l) => l.message).join(' ')}`.toLowerCase()
    return texto.includes('captcha')
  }

  const construirResultadoDesdeJob = (job: any, logs: any[]) => {
    const pasoActual = mapStepFromJob(job.currentStep)
    const pasosBase = crearPasosIniciales().map((paso) => {
      const indexActual = PASOS_ROBOT.findIndex((p) => p.paso === pasoActual)
      const indexPaso = PASOS_ROBOT.findIndex((p) => p.paso === paso.paso)
      const completado = indexPaso >= 0 && indexPaso < indexActual
      const detenido = job.status === 'failed' && paso.paso === pasoActual
      return {
        ...paso,
        completado,
        error: detenido,
        mensaje: detenido ? 'Error real detectado' : completado ? 'Completado' : 'Pendiente'
      }
    })

    const captchaDetectado = detectarCaptcha(logs, job.error)
    const statusMap: Record<string, TestStatus> = {
      pending: 'pendiente',
      running: 'en_progreso',
      completed: 'exito',
      failed: 'error',
      cancelled: 'error'
    }

    const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : null
    const completedAt = job.completedAt ? new Date(job.completedAt).getTime() : null
    const tiempo = startedAt && completedAt ? completedAt - startedAt : 0

    return {
      estado: job.metadata?.jurisdiccion?.estadoRecomendado || job.caso?.empresa_nombre || 'CASO',
      status: captchaDetectado && job.status !== 'completed' ? 'parcial' : (statusMap[job.status] || 'pendiente'),
      tiempo,
      errorType: captchaDetectado ? 'captcha' : job.error ? 'validacion' : 'ninguno',
      errorMessage: job.error || '',
      screenshot: '',
      url: job.metadata?.jurisdiccion?.cclRecomendado?.urlPortal || '',
      captchaPendiente: captchaDetectado,
      accionSugerida: captchaDetectado ? 'Resolver CAPTCHA manualmente en el portal.' : '',
      pdfUrl: job.resultado?.pdfUrl || '',
      folioGenerado: job.resultado?.folioSolicitud || '',
      jobId: job.id,
      casoId: job.casoId,
      empresaNombre: job.caso?.empresa_nombre || '',
      progreso: job.progress || 0,
      currentStepRaw: job.currentStep,
      pasoActual,
      pasoDetenido: job.status === 'failed' ? pasoActual : null,
      pasos: pasosBase,
      errorDetallado: job.error ? {
        tipo: captchaDetectado ? 'captcha' : 'desconocido',
        codigo: captchaDetectado ? 'CAPTCHA_DETECTED' : 'JOB_FAILED',
        descripcion: job.error,
        timestamp: new Date().toISOString(),
        intentos: 1
      } : null,
      cuentaCCL: {
        urlLogin: job.metadata?.jurisdiccion?.cclRecomendado?.urlPortal,
        urlSinacol: job.metadata?.jurisdiccion?.cclRecomendado?.urlPortal
      },
      logs: logs || []
    }
  }

  const iniciarDiagnosticoReal = async () => {
    if (!casoIdInput.trim()) return

    setEjecutando(true)
    setProgreso(0)
    setResultados([])

    try {
      const response = await fetch('/api/ccl/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoId: casoIdInput.trim() })
      })

      const data = await response.json()
      if (!response.ok) {
        setEjecutando(false)
        const errorResultado: Resultado = {
          estado: 'CASO',
          status: 'error',
          tiempo: 0,
          errorType: 'validacion',
          errorMessage: data.error || 'No se pudo iniciar el diagnóstico',
          screenshot: '',
          url: '',
          captchaPendiente: false,
          accionSugerida: 'Revisa el ID del caso y los permisos del usuario.',
          pdfUrl: '',
          folioGenerado: '',
          jobId: data.jobId,
          casoId: casoIdInput.trim(),
          pasoActual: 'conexion',
          pasoDetenido: 'conexion',
          pasos: crearPasosIniciales(),
          errorDetallado: data.error ? {
            tipo: 'desconocido',
            codigo: 'JOB_START_FAILED',
            descripcion: data.error,
            timestamp: new Date().toISOString(),
            intentos: 1
          } : null
        }
        setResultados([errorResultado])
        setSelectedEstado(errorResultado)
        return
      }

      setJobIdActivo(data.jobId)
    } catch {
      setEjecutando(false)
    }
  }

  const iniciarDiagnostico = async () => {
    await iniciarDiagnosticoReal()
  }

  const solicitarAyudaCaptcha = async (estado: string) => {
    setCaptchasSolicitados(prev => [...prev, estado])
    
    // En produccion: notificar a superadmin
    const supabase = createClient()
    await supabase.from('captcha_requests').insert({ 
      estado, 
      status: 'pending',
      created_at: new Date().toISOString()
    }).catch(() => {}) // Ignorar si la tabla no existe
    
    setResultados(prev => prev.map(r => 
      r.estado === estado ? { ...r, captchaPendiente: false } : r
    ))
  }

  const marcarCaptchaResuelto = (estado: string) => {
    setCaptchasSolicitados(prev => (prev.includes(estado) ? prev : [...prev, estado]))
    setResultados(prev => prev.map(r => 
      r.estado === estado ? { ...r, captchaPendiente: false } : r
    ))
  }

  const reintentarEstado = async () => {
    await iniciarDiagnosticoReal()
  }



  const verDetalle = (resultado: Resultado) => {
    setSelectedEstado(resultado)
    setLivePreviewIndex(0)
    setLivePreviewPlaying(true)
    setShowDetailDialog(true)
  }

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'exito': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'parcial': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'en_progreso': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'exito': return 'bg-green-900/50 border-green-500'
      case 'parcial': return 'bg-yellow-900/50 border-yellow-500'
      case 'error': return 'bg-red-900/50 border-red-500'
      case 'en_progreso': return 'bg-blue-900/50 border-blue-500 animate-pulse'
      default: return 'bg-gray-900/50 border-gray-700'
    }
  }

  const getErrorTypeLabel = (type: ErrorType) => {
    const labels = {
      captcha: 'CAPTCHA',
      timeout: 'TIMEOUT',
      conexion: 'CONEXION',
      formulario: 'FORMULARIO',
      validacion: 'VALIDACION',
      ninguno: 'OK'
    }
    return labels[type]
  }

  const obtenerInsightsError = (resultado: Resultado) => {
    if (!resultado.errorDetallado) return []
    const codigo = resultado.errorDetallado.codigo.toLowerCase()
    const mensaje = resultado.errorMessage.toLowerCase()
    const es503 = codigo.includes('503') || mensaje.includes('503')

    if (es503) {
      return [
        'El portal puede estar en mantenimiento o con sobrecarga temporal.',
        'El servidor podría estar limitando tráfico automatizado (WAF/rate limit).',
        'Si ocurre al cargar el portal, no implica CAPTCHA; es indisponibilidad del backend.',
        'Reintenta con backoff (espera 60-120s) o prueba en horario de menor tráfico.'
      ]
    }

    return []
  }

  const stats = {
    exito: resultados.filter(r => r.status === 'exito').length,
    parcial: resultados.filter(r => r.status === 'parcial').length,
    error: resultados.filter(r => r.status === 'error').length,
    pendiente: resultados.filter(r => r.status === 'pendiente').length,
    captchasPendientes: resultados.filter(r => r.captchaPendiente).length
  }

  const resultadoActivo =
    resultados.find(r => r.status === 'en_progreso') ||
    selectedEstado ||
    [...resultados].reverse().find(r => r.status !== 'pendiente') ||
    null

  const liveFrames = selectedEstado?.pasos.filter(p => p.screenshot) || []
  const liveFrame = liveFrames[livePreviewIndex] || null
  const cursorPos = CURSOR_POSITIONS[livePreviewIndex % CURSOR_POSITIONS.length]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <MatrixRain />
        <div className="text-green-500 font-mono animate-pulse z-10">Verificando acceso ROOT...</div>
      </div>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      {/* Header */}
      <header className="bg-black/90 border-b border-green-900 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-green-500 hover:bg-green-950 font-mono px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">ADMIN</span>
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-lg font-bold text-green-400 font-mono">DIAGNÓSTICO CCL</h1>
                  <Badge className="bg-red-600 text-white text-[8px] px-1 py-0">DATOS REALES</Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-green-700 font-mono hidden sm:block">
                  Diagnóstico con datos reales del caso seleccionado.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {stats.captchasPendientes > 0 && (
                <Badge className="bg-red-900 text-red-400 border border-red-600 font-mono text-[10px] sm:text-xs animate-pulse px-1 sm:px-2">
                  {stats.captchasPendientes} CAPTCHA
                </Badge>
              )}
              <Badge className="bg-green-950 text-green-400 border border-green-600 font-mono text-[10px] sm:text-xs px-1 sm:px-2">
                ROOT
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {/* Controles */}
        <Card className="bg-black/80 border-green-800 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <label className="text-green-500 font-mono text-xs block mb-1">CASO ID (REAL)</label>
                  <input
                    value={casoIdInput}
                    onChange={(e) => setCasoIdInput(e.target.value)}
                    placeholder="Pega aquí el ID del caso real"
                    className="w-full bg-green-950 border border-green-700 text-green-300 font-mono text-xs rounded px-3 py-2"
                  />
                </div>
                <Button
                  onClick={iniciarDiagnostico}
                  disabled={ejecutando || !casoIdInput.trim()}
                  size="sm"
                  className="font-mono font-bold text-xs sm:text-sm bg-cyan-600 hover:bg-cyan-500 text-black"
                >
                  {ejecutando ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">EJECUTANDO...</span>
                      <span className="sm:hidden">RUN...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      INICIAR DIAGNÓSTICO REAL
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-green-500">
                <span>Job activo: {jobIdActivo || '—'}</span>
                <span>Progreso: {progreso}%</span>
              </div>

              {ejecutando && (
                <div>
                  <div className="flex justify-between text-xs font-mono text-green-600 mb-1">
                    <span>Progreso real: {progreso}%</span>
                    <span>Estado: {resultados[0]?.status || 'pendiente'}</span>
                  </div>
                  <Progress value={progreso} className="h-2 bg-green-950" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel de resultados reales */}
        <Card className="bg-black/80 border-cyan-800 mb-4 sm:mb-6">
          <CardHeader className="pb-2 px-3 sm:px-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-cyan-300 font-mono text-xs sm:text-sm">DASHBOARD SUPERADMIN · RESULTADOS REALES</CardTitle>
              <p className="text-cyan-600 text-[10px] sm:text-xs font-mono">
                Seguimiento del último diagnóstico en tiempo real (folio oficial, PDF y paso actual).
              </p>
            </div>
            {resultadoActivo?.status && (
              <Badge
                className={`font-mono text-[10px] ${
                  resultadoActivo.status === 'exito'
                    ? 'bg-green-900 text-green-300 border border-green-700'
                    : resultadoActivo.status === 'parcial'
                      ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
                      : resultadoActivo.status === 'error'
                        ? 'bg-red-900 text-red-300 border border-red-700'
                        : 'bg-cyan-900 text-cyan-300 border border-cyan-700'
                }`}
              >
                {resultadoActivo.status.toUpperCase()}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {!resultadoActivo ? (
              <div className="text-cyan-500 text-xs font-mono border border-cyan-900 rounded p-3 bg-cyan-950/20">
                Sin ejecuciones recientes. Ejecuta un diagnóstico para ver resultados reales.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border border-cyan-900 rounded p-3 bg-cyan-950/20">
                  <p className="text-cyan-400 text-[10px] font-mono">ESTADO / PORTAL</p>
                  <p className="text-cyan-200 text-sm font-mono mt-1">{resultadoActivo.estado}</p>
                  <p className="text-cyan-600 text-[10px] font-mono mt-1 break-all">
                    {resultadoActivo.cuentaCCL?.urlSinacol || resultadoActivo.url}
                  </p>
                </div>
                <div className="border border-cyan-900 rounded p-3 bg-cyan-950/20">
                  <p className="text-cyan-400 text-[10px] font-mono">FOLIO OFICIAL</p>
                  <p className="text-cyan-200 text-sm font-mono mt-1">
                    {resultadoActivo.folioGenerado || 'Pendiente'}
                  </p>
                  <p className="text-cyan-600 text-[10px] font-mono mt-1">
                    Paso: {PASOS_ROBOT.find(p => p.paso === resultadoActivo.pasoDetenido)?.nombre || resultadoActivo.pasoDetenido || resultadoActivo.pasoActual}
                  </p>
                </div>
                <div className="border border-cyan-900 rounded p-3 bg-cyan-950/20">
                  <p className="text-cyan-400 text-[10px] font-mono">PDF REAL</p>
                  <p className="text-cyan-200 text-sm font-mono mt-1">
                    {resultadoActivo.pdfUrl ? 'Disponible' : 'Pendiente'}
                  </p>
                  <p className="text-cyan-600 text-[10px] font-mono mt-1">
                    {resultadoActivo.pdfUrl ? 'Listo para abrir en visor' : 'Esperando descarga en portal'}
                  </p>
                </div>
                <div className="border border-cyan-900 rounded p-3 bg-cyan-950/20">
                  <p className="text-cyan-400 text-[10px] font-mono">TIEMPO / LATENCIA</p>
                  <p className="text-cyan-200 text-sm font-mono mt-1">{resultadoActivo.tiempo}ms</p>
                  <p className="text-cyan-600 text-[10px] font-mono mt-1">
                    CAPTCHA: {resultadoActivo.captchaPendiente ? 'Pendiente' : 'Sin bloqueo'}
                  </p>
                </div>
              </div>
            )}

            {resultadoActivo && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-600 text-cyan-300 hover:bg-cyan-950 font-mono text-xs"
                  onClick={() => {
                    const portalUrl = resultadoActivo.cuentaCCL?.urlSinacol || resultadoActivo.cuentaCCL?.urlLogin || resultadoActivo.url
                    if (portalUrl) window.open(portalUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir portal
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-600 text-cyan-300 hover:bg-cyan-950 font-mono text-xs"
                  onClick={() => {
                    if (!resultadoActivo) return
                    setSelectedEstado(resultadoActivo)
                    setShowDetailDialog(true)
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver detalle en vivo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-600 text-cyan-300 hover:bg-cyan-950 font-mono text-xs"
                  onClick={() => {
                    if (!resultadoActivo?.folioGenerado) return
                    navigator.clipboard.writeText(resultadoActivo.folioGenerado)
                  }}
                  disabled={!resultadoActivo.folioGenerado}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar folio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-cyan-600 text-cyan-300 hover:bg-cyan-950 font-mono text-xs"
                  onClick={() => {
                    if (!resultadoActivo?.pdfUrl) return
                    setSelectedPdfUrl(resultadoActivo.pdfUrl)
                    setSelectedPdfEstado(resultadoActivo.estado)
                  }}
                  disabled={!resultadoActivo.pdfUrl}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Ver PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de intervención humana */}
        <Card className="bg-black/80 border-green-800 mb-4 sm:mb-6">
          <CardHeader className="pb-2 px-3 sm:px-4">
            <CardTitle className="text-green-400 font-mono text-xs sm:text-sm">PANEL HUMANO (CAPTCHA & PDF)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
            <p className="text-green-700 text-[10px] sm:text-xs">
              Si un portal solicita CAPTCHA, abre el sitio oficial, resuélvelo manualmente y reintenta el flujo.
              Los PDFs del diagnóstico son temporales y se reemplazan en cada intento; no se guardan en bóvedas.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {resultados.filter(r => r.captchaPendiente).length === 0 ? (
                <div className="text-green-700 text-xs border border-green-900 rounded p-2 bg-green-950/30">
                  Sin CAPTCHA pendientes. ✅
                </div>
              ) : (
                resultados.filter(r => r.captchaPendiente).map((r) => {
                  const portalUrl = r.cuentaCCL?.urlSinacol || r.cuentaCCL?.urlLogin || r.cuentaCCL?.urlBuzon || r.url
                  return (
                    <div key={r.estado} className="border border-red-700/60 bg-red-950/30 rounded p-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-red-300 text-xs font-mono">{r.estado}</p>
                        <p className="text-red-500 text-[10px]">CAPTCHA pendiente</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-500 text-red-300 hover:bg-red-950"
                          onClick={() => window.open(portalUrl, '_blank')}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2 bg-green-600 hover:bg-green-500 text-black"
                          onClick={() => {
                            marcarCaptchaResuelto(r.estado)
                            reintentarEstado()
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Continuar
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 sm:mb-6">
            {resultados.map((resultado) => (
              <Card
                key={resultado.jobId || resultado.estado}
                className={`${getStatusColor(resultado.status)} border transition-all cursor-pointer active:scale-95 sm:hover:scale-105`}
                onClick={() => verDetalle(resultado)}
              >
                <CardContent className="p-2 text-center">
                  <div className="flex justify-center mb-1">
                    {getStatusIcon(resultado.status)}
                  </div>
                  <p className="text-[9px] font-mono text-green-300 truncate" title={resultado.estado}>
                    {resultado.estado}
                  </p>
                  {resultado.tiempo > 0 && (
                    <p className="text-[8px] text-green-700 font-mono">{resultado.tiempo}ms</p>
                  )}
                  {resultado.captchaPendiente && (
                    <Badge className="mt-1 bg-red-900 text-red-400 text-[7px] px-1">
                      CAPTCHA
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabla de resultados con errores */}
        {stats.exito + stats.parcial + stats.error > 0 && (
          <Card className="bg-black/80 border-green-800">
            <CardHeader className="pb-2 px-3 sm:px-4">
              <CardTitle className="text-green-400 font-mono text-xs sm:text-sm">RESULTADOS</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0">
              <div className="max-h-60 sm:max-h-80 overflow-y-auto overflow-x-auto">
                <table className="w-full text-[10px] sm:text-xs font-mono min-w-[300px]">
                  <thead className="text-green-600 border-b border-green-900 sticky top-0 bg-black">
                    <tr>
                      <th className="text-left py-1.5 sm:py-2">ESTADO</th>
                      <th className="text-center py-1.5 sm:py-2">STATUS</th>
                      <th className="text-center py-1.5 sm:py-2 hidden sm:table-cell">ERROR</th>
                      <th className="text-right py-1.5 sm:py-2">MS</th>
                      <th className="text-right py-1.5 sm:py-2">VER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.filter(r => r.status !== 'pendiente' && r.status !== 'en_progreso').map((r) => (
                      <tr key={r.estado} className="border-b border-green-950 hover:bg-green-950/30">
                        <td className="py-2 text-green-300">{r.estado}</td>
                        <td className="py-2 text-center">
                          <Badge className={
                            r.status === 'exito' ? 'bg-green-900 text-green-400' :
                            r.status === 'parcial' ? 'bg-yellow-900 text-yellow-400' :
                            'bg-red-900 text-red-400'
                          }>
                            {r.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2 text-center">
                          {r.errorType !== 'ninguno' && (
                            <Badge variant="outline" className={
                              r.errorType === 'captcha' ? 'border-red-500 text-red-400' :
                              'border-yellow-500 text-yellow-400'
                            }>
                              {getErrorTypeLabel(r.errorType)}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 text-right text-green-500">{r.tiempo}ms</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-green-500 hover:bg-green-950"
                              onClick={() => verDetalle(r)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {r.status !== 'exito' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-yellow-500 hover:bg-yellow-950"
                                onClick={() => reintentarEstado()}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            )}
                            {r.captchaPendiente && !captchasSolicitados.includes(r.estado) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-red-500 hover:bg-red-950"
                                onClick={() => solicitarAyudaCaptcha(r.estado)}
                              >
                                <HelpCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-green-800 font-mono text-xs">
            root@mandu-ccl:~$ diagnostico --caso={casoIdInput || 'ID'}_
          </p>
        </div>
      </main>

      {/* Dialog de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-black border-green-700 text-green-400 font-mono max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono flex items-center gap-2 text-sm sm:text-base">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              {selectedEstado?.estado}
            </DialogTitle>
            <DialogDescription className="text-green-700 text-xs sm:text-sm">
              Detalle del diagnostico CCL
            </DialogDescription>
          </DialogHeader>
          
          {selectedEstado && (
            <div className="space-y-3 sm:space-y-4">
              {/* Info especial para portal Federal */}
              {selectedEstado.estado === 'Federal' && (
                <div className="p-2 sm:p-3 bg-blue-950/30 rounded border border-blue-700">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-blue-400 text-[10px] sm:text-xs font-bold">JURISDICCION FEDERAL</span>
                  </div>
                  <p className="text-blue-300 text-[10px] sm:text-xs mb-1 sm:mb-2">{PORTAL_FEDERAL_INFO.nombre}</p>
                  <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                    {PORTAL_FEDERAL_INFO.tiposCasos.slice(0, 4).map(tipo => (
                      <Badge key={tipo} variant="outline" className="border-blue-700 text-blue-400 text-[8px] sm:text-[9px] px-1">
                        {tipo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Status */}
              <div className="flex items-center justify-between p-2 sm:p-3 bg-green-950/50 rounded border border-green-800">
                <span className="text-green-600 text-xs sm:text-sm">Status:</span>
                <Badge className={`text-[10px] sm:text-xs ${
                  selectedEstado.status === 'exito' ? 'bg-green-900 text-green-400' :
                  selectedEstado.status === 'parcial' ? 'bg-yellow-900 text-yellow-400' :
                  'bg-red-900 text-red-400'
                }`}>
                  {selectedEstado.status.toUpperCase()}
                </Badge>
              </div>

              {/* URL */}
              <div className="p-2 sm:p-3 bg-green-950/50 rounded border border-green-800">
                <span className="text-green-600 text-[10px] sm:text-xs block mb-1">Portal URL:</span>
                <code className="text-green-400 text-[9px] sm:text-xs break-all">{selectedEstado.url}</code>
              </div>

              {/* Pasos del Robot */}
              <div className="p-2 sm:p-3 bg-green-950/50 rounded border border-green-800">
                <span className="text-green-600 text-[10px] sm:text-xs block mb-1 sm:mb-2">Secuencia de Pasos:</span>
                <div className="space-y-0.5 sm:space-y-1">
                  {selectedEstado.pasos.map((paso, idx) => (
                    <div 
                      key={paso.paso}
                      className={`flex items-center justify-between p-1.5 sm:p-2 rounded text-[10px] sm:text-xs ${
                        paso.error ? 'bg-red-950/50 border border-red-800' :
                        paso.completado ? 'bg-green-950/50 border border-green-800' :
                        'bg-gray-900/50 border border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4">{idx + 1}.</span>
                        {paso.completado ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : paso.error ? (
                          <XCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-500" />
                        )}
                        <span className={
                          paso.error ? 'text-red-400' :
                          paso.completado ? 'text-green-400' :
                          'text-gray-500'
                        }>
                          {paso.nombre}
                        </span>
                        {paso.paso === selectedEstado.pasoDetenido && (
                          <Badge className="bg-red-900 text-red-300 text-[8px] ml-1">DETENIDO</Badge>
                        )}
                      </div>
                      {paso.tiempo > 0 && (
                        <span className="text-gray-500">{paso.tiempo}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vista en vivo */}
              <div className="p-3 bg-black/60 rounded border border-green-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-xs font-bold">VISTA EN VIVO (AGENTE IA)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 border-green-700 text-green-300 hover:bg-green-950"
                      onClick={() => setLivePreviewPlaying((prev) => !prev)}
                    >
                      {livePreviewPlaying ? 'Pausar' : 'Reproducir'}
                    </Button>
                  </div>
                </div>
                <div className="relative rounded border border-green-900 bg-black">
                  {liveFrame ? (
                    <img
                      src={liveFrame.screenshot}
                      alt={`Vista en vivo - ${liveFrame.nombre}`}
                      className="w-full rounded"
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-green-700">
                      Sin frames disponibles aún. Ejecuta un diagnóstico para ver la captura en vivo.
                    </div>
                  )}
                  {liveFrame && (
                    <div
                      className="absolute w-3 h-3 border-2 border-white rounded-full bg-black/40 shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-pulse"
                      style={{ top: cursorPos.top, left: cursorPos.left }}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-green-600">
                  <span>Paso actual: {liveFrame?.nombre || 'Esperando...'}</span>
                  <span>Frame {liveFrames.length ? livePreviewIndex + 1 : 0}/{liveFrames.length || 0}</span>
                </div>
              </div>

              {/* Paso donde se detuvo */}
              {selectedEstado.pasoDetenido && (
                <div className="p-3 bg-red-950/30 rounded border border-red-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-xs font-bold">ROBOT DETENIDO EN:</span>
                  </div>
                  <p className="text-red-400 text-sm font-bold">
                    {PASOS_ROBOT.find(p => p.paso === selectedEstado.pasoDetenido)?.nombre || selectedEstado.pasoDetenido}
                  </p>
                </div>
              )}

              {/* Error Detallado */}
              {selectedEstado.errorDetallado && (
                <div className="p-3 bg-red-950/30 rounded border border-red-800">
                  <span className="text-red-500 text-xs block mb-2">Error Detallado:</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-red-600">Tipo:</span>
                      <Badge variant="outline" className="border-red-600 text-red-400 text-[10px]">
                        {selectedEstado.errorDetallado.tipo.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Codigo:</span>
                      <code className="text-red-400 bg-red-950/50 px-1 rounded">
                        {selectedEstado.errorDetallado.codigo}
                      </code>
                    </div>
                    <div className="pt-2 border-t border-red-900">
                      <span className="text-red-600 block mb-1">Descripcion:</span>
                      <p className="text-red-300 text-[11px] leading-relaxed">
                        {selectedEstado.errorDetallado.descripcion}
                      </p>
                    </div>
                    <div className="flex justify-between text-[10px] text-red-700">
                      <span>Timestamp: {new Date(selectedEstado.errorDetallado.timestamp).toLocaleString()}</span>
                      <span>Intentos: {selectedEstado.errorDetallado.intentos}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights de error 503 */}
              {selectedEstado.errorDetallado && obtenerInsightsError(selectedEstado).length > 0 && (
                <div className="p-3 bg-yellow-950/30 rounded border border-yellow-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-bold">POSIBLES CAUSAS (HTTP 503)</span>
                  </div>
                  <ul className="space-y-1 text-yellow-300 text-[11px] list-disc pl-4">
                    {obtenerInsightsError(selectedEstado).map((insight, idx) => (
                      <li key={insight + idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error Info */}
              {selectedEstado.errorType !== 'ninguno' && (
                <>
                  <div className="p-3 bg-red-950/30 rounded border border-red-800">
                    <span className="text-red-500 text-xs block mb-1">Tipo de Error:</span>
                    <Badge variant="outline" className="border-red-500 text-red-400">
                      {getErrorTypeLabel(selectedEstado.errorType)}
                    </Badge>
                    <p className="text-red-400 text-xs mt-2">{selectedEstado.errorMessage}</p>
                  </div>

                  {selectedEstado.errorType === 'captcha' && (
                    <div className="p-3 bg-yellow-950/30 rounded border border-yellow-700">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-xs font-bold">CAPTCHA REQUIERE ACCION HUMANA</span>
                      </div>
                      <p className="text-yellow-300 text-xs">
                        Abre el portal oficial, resuelve el CAPTCHA manualmente y luego continúa el flujo para descargar el PDF real.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-yellow-500 text-yellow-300 hover:bg-yellow-950"
                          onClick={() => {
                            const portalUrl = selectedEstado.cuentaCCL?.urlSinacol || selectedEstado.cuentaCCL?.urlLogin || selectedEstado.cuentaCCL?.urlBuzon || selectedEstado.url
                            window.open(portalUrl, '_blank')
                          }}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Abrir portal
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-500 text-black"
                          onClick={async () => {
                            marcarCaptchaResuelto(selectedEstado.estado)
                            setShowDetailDialog(false)
                            await new Promise(r => setTimeout(r, 100))
                            reintentarEstado()
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Continuar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Captura del ultimo paso */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-xs">Captura del ultimo paso:</span>
                    </div>
                    {selectedEstado.screenshot ? (
                      <div className="space-y-2">
                        <img
                          src={selectedEstado.screenshot}
                          alt={`Captura del paso ${selectedEstado.pasoDetenido || ''}`}
                          className="w-full rounded border border-green-900"
                        />
                        <div className="flex items-center justify-between text-[10px] text-green-700">
                          <span>Estado: {selectedEstado.estado}</span>
                          <span>Paso: {PASOS_ROBOT.find(p => p.paso === selectedEstado.pasoDetenido)?.nombre || selectedEstado.pasoDetenido}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-900 rounded p-4 text-center border border-green-900">
                        <p className="text-gray-500 text-[10px]">Sin captura disponible para este paso.</p>
                      </div>
                    )}
                  </div>

                  {/* Accion sugerida */}
                  <div className="p-3 bg-blue-950/30 rounded border border-blue-800">
                    <span className="text-blue-400 text-xs block mb-2">Accion Sugerida:</span>
                    <p className="text-blue-300 text-sm">{selectedEstado.accionSugerida}</p>
                  </div>

                  {/* Botones de accion */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-mono"
                      onClick={async () => {
                        if (!selectedEstado?.estado) return
                        setShowDetailDialog(false)
                        // Esperar a que cierre el dialog
                        await new Promise(r => setTimeout(r, 100))
                        reintentarEstado()
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      REINTENTAR
                    </Button>
                    
                    {selectedEstado.errorType === 'captcha' && !captchasSolicitados.includes(selectedEstado.estado) && (
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-mono"
                        onClick={() => {
                          solicitarAyudaCaptcha(selectedEstado.estado)
                          setShowDetailDialog(false)
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        SOLICITAR AYUDA
                      </Button>
                    )}
                    
                    {captchasSolicitados.includes(selectedEstado.estado) && (
                      <Badge className="flex-1 justify-center bg-green-900 text-green-400 py-2">
                        AYUDA SOLICITADA
                      </Badge>
                    )}
                  </div>
                </>
              )}

              {/* Resultado exitoso */}
              {selectedEstado.status === 'exito' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-950/30 rounded border border-green-600 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm font-bold">Solicitud enviada exitosamente</p>
                    <p className="text-green-600 text-xs mt-1">Tiempo: {selectedEstado.tiempo}ms</p>
                  </div>
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <span className="text-green-600 text-xs block mb-1">Folio oficial:</span>
                    <code className="text-green-300 text-lg font-bold">
                      {selectedEstado.folioGenerado || 'Pendiente'}
                    </code>
                    <p className="text-green-700 text-[10px] mt-1">Portal: {selectedEstado.url}</p>
                  </div>
                  <div className="p-3 bg-blue-950/30 rounded border border-blue-800">
                    <span className="text-blue-400 text-xs block mb-2">PDF del acuse:</span>
                    <p className="text-blue-300 text-xs">
                      {selectedEstado.pdfUrl ? 'Disponible para abrir en visor.' : 'Aún no se detecta PDF en el portal.'}
                    </p>
                  </div>
                </div>
              )}

              {selectedEstado.pdfUrl && (
                <Button
                  size="sm"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs"
                  onClick={() => {
                    setSelectedPdfUrl(selectedEstado.pdfUrl)
                    setSelectedPdfEstado(selectedEstado.estado)
                    setShowPdfViewer(true)
                  }}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  VER PDF DE SOLICITUD
                </Button>
              )}
              
              {/* Info adicional */}
              <div className="p-2 bg-green-950/30 rounded border border-green-900">
                <p className="text-green-600 text-[10px]">
                  <strong>Pasos en SINACOL:</strong> Completa el formulario oficial, confirma el envío y descarga el acuse
                  desde el portal cuando esté disponible.
                </p>
              </div>

              {/* Tiempo */}
              <div className="flex justify-between text-xs text-green-700 pt-2 border-t border-green-900">
                <span>Tiempo de ejecución:</span>
                <span>{selectedEstado.tiempo}ms</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Acceso a SINACOL */}
      {/* Visor PDF diagnóstico */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="bg-black text-green-400 max-w-4xl max-h-[95vh] overflow-hidden border border-cyan-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400 font-mono">
              <FileText className="w-5 h-5" />
              PDF de Solicitud - {selectedPdfEstado || 'Diagnóstico'}
            </DialogTitle>
            <DialogDescription className="text-cyan-600 text-xs">
              Documento temporal del diagnóstico. Se reemplaza en cada intento y no se guarda en bóvedas.
            </DialogDescription>
          </DialogHeader>
          {selectedPdfUrl ? (
            <iframe
              src={selectedPdfUrl}
              className="w-full h-[70vh] rounded border border-cyan-900"
              title="PDF diagnóstico"
            />
          ) : (
            <div className="text-xs text-cyan-700">No hay PDF disponible.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
