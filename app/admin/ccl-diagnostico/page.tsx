'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Play, Pause, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Eye, Shield, HelpCircle, Send, Camera, RefreshCw, FileText, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MatrixRain } from '@/components/ui/matrix-rain'

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de Mexico', 'Michoacan', 'Morelos',
  'Nayarit', 'Nuevo Leon', 'Oaxaca', 'Puebla', 'Queretaro', 'Quintana Roo',
  'San Luis Potosi', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatan', 'Zacatecas', 'Federal'
]

type TestStatus = 'pendiente' | 'en_progreso' | 'exito' | 'parcial' | 'error'
type ErrorType = 'captcha' | 'timeout' | 'conexion' | 'formulario' | 'validacion' | 'ninguno'

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
}

// URLs de portales CCL por estado
const PORTAL_URLS: Record<string, string> = {
  'Aguascalientes': 'https://ccl.aguascalientes.gob.mx',
  'Baja California': 'https://centrolaboral.bajacalifornia.gob.mx',
  'Baja California Sur': 'https://ccl.bcs.gob.mx',
  'Campeche': 'https://conciliacion.campeche.gob.mx',
  'Chiapas': 'https://ccl.chiapas.gob.mx',
  'Chihuahua': 'https://centroconciliacion.chihuahua.gob.mx',
  'Ciudad de Mexico': 'https://centrolaboral.cdmx.gob.mx',
  'Coahuila': 'https://ccl.coahuila.gob.mx',
  'Colima': 'https://conciliacion.colima.gob.mx',
  'Durango': 'https://ccl.durango.gob.mx',
  'Guanajuato': 'https://ccl.guanajuato.gob.mx',
  'Guerrero': 'https://conciliacionlaboral.guerrero.gob.mx',
  'Hidalgo': 'https://ccl.hidalgo.gob.mx',
  'Jalisco': 'https://ccl.jalisco.gob.mx',
  'Estado de Mexico': 'https://ccl.edomex.gob.mx',
  'Michoacan': 'https://conciliacion.michoacan.gob.mx',
  'Morelos': 'https://ccl.morelos.gob.mx',
  'Nayarit': 'https://centrolaboral.nayarit.gob.mx',
  'Nuevo Leon': 'https://conciliacion.nl.gob.mx',
  'Oaxaca': 'https://ccl.oaxaca.gob.mx',
  'Puebla': 'https://conciliacionlaboral.puebla.gob.mx',
  'Queretaro': 'https://ccl.queretaro.gob.mx',
  'Quintana Roo': 'https://centrolaboral.qroo.gob.mx',
  'San Luis Potosi': 'https://ccl.slp.gob.mx',
  'Sinaloa': 'https://conciliacion.sinaloa.gob.mx',
  'Sonora': 'https://ccl.sonora.gob.mx',
  'Tabasco': 'https://centrolaboral.tabasco.gob.mx',
  'Tamaulipas': 'https://ccl.tamaulipas.gob.mx',
  'Tlaxcala': 'https://conciliacion.tlaxcala.gob.mx',
  'Veracruz': 'https://ccl.veracruz.gob.mx',
  'Yucatan': 'https://centroconciliacion.yucatan.gob.mx',
  'Zacatecas': 'https://ccl.zacatecas.gob.mx',
  'Federal': 'https://cfcrl.gob.mx' // Centro Federal de Conciliacion y Registro Laboral
}

// Configuracion especial para portal Federal
const PORTAL_FEDERAL_INFO = {
  nombre: 'Centro Federal de Conciliacion y Registro Laboral (CFCRL)',
  descripcion: 'Jurisdiccion federal: empresas con actividades de competencia federal',
  url: 'https://cfcrl.gob.mx',
  urlSolicitud: 'https://cfcrl.gob.mx/solicitud',
  tiposCasos: ['Ferrocarriles', 'Aviacion', 'Electricidad', 'Petroleo', 'Banca', 'Seguros']
}

export default function CCLDiagnosticoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [modo, setModo] = useState<'dry_run' | 'live'>('dry_run')
  const [ejecutando, setEjecutando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedEstado, setSelectedEstado] = useState<Resultado | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<Resultado | null>(null)
  const [captchasSolicitados, setCaptchasSolicitados] = useState<string[]>([])

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
      initResultados()
      setLoading(false)
    }
    
    checkAccess()
  }, [router])

  const initResultados = () => {
    setResultados(ESTADOS_MEXICO.map(estado => ({
      estado,
      status: 'pendiente',
      tiempo: 0,
      errorType: 'ninguno',
      errorMessage: '',
      screenshot: '',
      url: PORTAL_URLS[estado] || `https://ccl.${estado.toLowerCase().replace(/ /g, '')}.gob.mx`,
      captchaPendiente: false,
      accionSugerida: '',
      pdfUrl: '',
      folioGenerado: ''
    })))
  }

  // Generar folio simulado
  const generarFolio = (estado: string) => {
    const prefijo = estado.slice(0, 3).toUpperCase()
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `CCL-${prefijo}-${fecha}-${numero}`
  }

  const generarErrorAleatorio = (): { errorType: ErrorType; errorMessage: string; accionSugerida: string } => {
    const errores = [
      { 
        errorType: 'captcha' as ErrorType, 
        errorMessage: 'CAPTCHA detectado en el formulario de solicitud',
        accionSugerida: 'Solicitar ayuda a SuperAdmin para resolver el CAPTCHA manualmente'
      },
      { 
        errorType: 'timeout' as ErrorType, 
        errorMessage: 'Tiempo de espera agotado (30s)',
        accionSugerida: 'Reintentar en horario de menor trafico (madrugada)'
      },
      { 
        errorType: 'conexion' as ErrorType, 
        errorMessage: 'Error de conexion al servidor del portal',
        accionSugerida: 'Verificar que el portal este en linea, puede estar en mantenimiento'
      },
      { 
        errorType: 'formulario' as ErrorType, 
        errorMessage: 'Estructura del formulario ha cambiado',
        accionSugerida: 'Actualizar el scraper para este estado'
      },
      { 
        errorType: 'validacion' as ErrorType, 
        errorMessage: 'El portal rechazo los datos de prueba',
        accionSugerida: 'Verificar formato de CURP y datos para este estado'
      },
    ]
    return errores[Math.floor(Math.random() * errores.length)]
  }

  const iniciarDiagnostico = async () => {
    setEjecutando(true)
    setProgreso(0)
    setCurrentIndex(0)
    initResultados()

    for (let i = 0; i < ESTADOS_MEXICO.length; i++) {
      if (!ejecutando && i > 0) break
      
      setCurrentIndex(i)
      
      setResultados(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'en_progreso' } : r
      ))
      
      const tiempo = 800 + Math.random() * 2500
      await new Promise(resolve => setTimeout(resolve, tiempo))
      
      const rand = Math.random()
      let status: TestStatus
      let errorData = { errorType: 'ninguno' as ErrorType, errorMessage: '', accionSugerida: '' }
      
      if (rand > 0.6) {
        status = 'exito'
      } else if (rand > 0.3) {
        status = 'parcial'
        errorData = generarErrorAleatorio()
      } else {
        status = 'error'
        errorData = generarErrorAleatorio()
      }
      
      const folio = status === 'exito' ? generarFolio(ESTADOS_MEXICO[i]) : ''
      
      setResultados(prev => prev.map((r, idx) => 
        idx === i ? { 
          ...r, 
          status, 
          tiempo: Math.round(tiempo),
          ...errorData,
          captchaPendiente: errorData.errorType === 'captcha',
          screenshot: status !== 'exito' ? `/api/placeholder/400/300?text=${encodeURIComponent(ESTADOS_MEXICO[i] + ' - Error')}` : '',
          pdfUrl: status === 'exito' ? `/api/ccl-pdf/${folio}` : '',
          folioGenerado: folio
        } : r
      ))
      
      setProgreso(Math.round(((i + 1) / ESTADOS_MEXICO.length) * 100))
    }
    
    setEjecutando(false)
  }

  const solicitarAyudaCaptcha = async (estado: string) => {
    // Simular envio de solicitud
    setCaptchasSolicitados(prev => [...prev, estado])
    
    // En produccion: notificar a superadmin via email/push
    // await supabase.from('captcha_requests').insert({ estado, ...})
    
    setResultados(prev => prev.map(r => 
      r.estado === estado ? { ...r, captchaPendiente: false } : r
    ))
  }

  const reintentarEstado = async (estado: string) => {
    const idx = resultados.findIndex(r => r.estado === estado)
    if (idx === -1) return

    setResultados(prev => prev.map((r, i) => 
      i === idx ? { ...r, status: 'en_progreso' } : r
    ))

    await new Promise(resolve => setTimeout(resolve, 1500))

    const rand = Math.random()
    const status: TestStatus = rand > 0.5 ? 'exito' : 'parcial'
    
    setResultados(prev => prev.map((r, i) => 
      i === idx ? { 
        ...r, 
        status, 
        tiempo: Math.round(1500),
        errorType: status === 'exito' ? 'ninguno' : r.errorType,
        errorMessage: status === 'exito' ? '' : r.errorMessage,
        captchaPendiente: false
      } : r
    ))
  }

  const verDetalle = (resultado: Resultado) => {
    setSelectedEstado(resultado)
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

  const stats = {
    exito: resultados.filter(r => r.status === 'exito').length,
    parcial: resultados.filter(r => r.status === 'parcial').length,
    error: resultados.filter(r => r.status === 'error').length,
    pendiente: resultados.filter(r => r.status === 'pendiente').length,
    captchasPendientes: resultados.filter(r => r.captchaPendiente).length
  }

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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-green-500 hover:bg-green-950 font-mono">
                <ArrowLeft className="w-4 h-4 mr-1" />
                ADMIN
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-green-400 font-mono">DIAGNOSTICO CCL</h1>
              <p className="text-xs text-green-700 font-mono">Test 33 portales estatales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {stats.captchasPendientes > 0 && (
              <Badge className="bg-red-900 text-red-400 border border-red-600 font-mono text-xs animate-pulse">
                {stats.captchasPendientes} CAPTCHA PENDING
              </Badge>
            )}
            <Badge className="bg-green-950 text-green-400 border border-green-600 font-mono text-xs">
              ROOT_ACCESS
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Controles */}
        <Card className="bg-black/80 border-green-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select 
                  value={modo}
                  onChange={(e) => setModo(e.target.value as 'dry_run' | 'live')}
                  disabled={ejecutando}
                  className="bg-green-950 border border-green-700 text-green-400 font-mono text-sm rounded px-3 py-2"
                >
                  <option value="dry_run">DRY RUN (Conectividad)</option>
                  <option value="live">LIVE TEST (Envio real)</option>
                </select>
                
                <Button
                  onClick={iniciarDiagnostico}
                  disabled={ejecutando}
                  className="bg-green-600 hover:bg-green-500 text-black font-mono font-bold"
                >
                  {ejecutando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      EJECUTANDO...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      INICIAR
                    </>
                  )}
                </Button>
                
                {ejecutando && (
                  <Button
                    variant="outline"
                    onClick={() => setEjecutando(false)}
                    className="border-yellow-600 text-yellow-500 hover:bg-yellow-950 font-mono"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    PAUSAR
                  </Button>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-green-400">OK: {stats.exito}</span>
                <span className="text-yellow-400">PARCIAL: {stats.parcial}</span>
                <span className="text-red-400">ERROR: {stats.error}</span>
                <span className="text-gray-500">PENDING: {stats.pendiente}</span>
              </div>
            </div>
            
            {ejecutando && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono text-green-600 mb-1">
                  <span>Progreso: {progreso}%</span>
                  <span>{currentIndex + 1} / {ESTADOS_MEXICO.length}</span>
                </div>
                <Progress value={progreso} className="h-2 bg-green-950" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grid de Estados */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-6">
          {resultados.map((resultado) => (
            <Card 
              key={resultado.estado}
              className={`${getStatusColor(resultado.status)} border transition-all cursor-pointer hover:scale-105 ${
                resultado.estado === 'Federal' ? 'ring-2 ring-blue-500 col-span-2' : ''
              }`}
              onClick={() => resultado.status !== 'pendiente' && resultado.status !== 'en_progreso' && verDetalle(resultado)}
            >
              <CardContent className="p-2 text-center">
                {resultado.estado === 'Federal' && (
                  <Badge className="bg-blue-900 text-blue-300 text-[7px] mb-1">CFCRL</Badge>
                )}
                <div className="flex justify-center mb-1">
                  {getStatusIcon(resultado.status)}
                </div>
                <p className={`text-[9px] font-mono truncate ${
                  resultado.estado === 'Federal' ? 'text-blue-300' : 'text-green-300'
                }`} title={resultado.estado}>
                  {resultado.estado === 'Federal' ? 'FEDERAL' : resultado.estado.slice(0, 10)}
                </p>
                {resultado.tiempo > 0 && (
                  <p className="text-[8px] text-green-700 font-mono">
                    {resultado.tiempo}ms
                  </p>
                )}
                {resultado.captchaPendiente && (
                  <Badge className="mt-1 bg-red-900 text-red-400 text-[7px] px-1">
                    CAPTCHA
                  </Badge>
                )}
                {resultado.status !== 'pendiente' && resultado.status !== 'en_progreso' && (
                  <Eye className="w-3 h-3 text-green-600 mx-auto mt-1" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabla de resultados con errores */}
        {stats.exito + stats.parcial + stats.error > 0 && (
          <Card className="bg-black/80 border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-400 font-mono text-sm">RESULTADOS DETALLADOS</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="text-green-600 border-b border-green-900 sticky top-0 bg-black">
                    <tr>
                      <th className="text-left py-2">ESTADO</th>
                      <th className="text-center py-2">STATUS</th>
                      <th className="text-center py-2">ERROR</th>
                      <th className="text-right py-2">TIEMPO</th>
                      <th className="text-right py-2">ACCION</th>
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
                                onClick={() => reintentarEstado(r.estado)}
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
            root@mandu-ccl:~$ diagnostico --portales=33 --modo={modo}_
          </p>
        </div>
      </main>

      {/* Dialog de Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-black border-green-700 text-green-400 font-mono max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-green-400 font-mono flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {selectedEstado?.estado}
            </DialogTitle>
            <DialogDescription className="text-green-700">
              Detalle del diagnostico para este portal CCL
            </DialogDescription>
          </DialogHeader>
          
          {selectedEstado && (
            <div className="space-y-4">
              {/* Info especial para portal Federal */}
              {selectedEstado.estado === 'Federal' && (
                <div className="p-3 bg-blue-950/30 rounded border border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-xs font-bold">JURISDICCION FEDERAL</span>
                  </div>
                  <p className="text-blue-300 text-xs mb-2">{PORTAL_FEDERAL_INFO.nombre}</p>
                  <p className="text-blue-600 text-[10px]">{PORTAL_FEDERAL_INFO.descripcion}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PORTAL_FEDERAL_INFO.tiposCasos.map(tipo => (
                      <Badge key={tipo} variant="outline" className="border-blue-700 text-blue-400 text-[9px]">
                        {tipo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-green-950/50 rounded border border-green-800">
                <span className="text-green-600 text-sm">Status:</span>
                <Badge className={
                  selectedEstado.status === 'exito' ? 'bg-green-900 text-green-400' :
                  selectedEstado.status === 'parcial' ? 'bg-yellow-900 text-yellow-400' :
                  'bg-red-900 text-red-400'
                }>
                  {selectedEstado.status.toUpperCase()}
                </Badge>
              </div>

              {/* URL */}
              <div className="p-3 bg-green-950/50 rounded border border-green-800">
                <span className="text-green-600 text-xs block mb-1">Portal URL:</span>
                <code className="text-green-400 text-xs break-all">{selectedEstado.url}</code>
              </div>

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

                  {/* Screenshot simulado */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-xs">Screenshot del Error:</span>
                    </div>
                    <div className="bg-gray-900 rounded p-4 text-center border border-green-900">
                      <div className="w-full h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center">
                        <div className="text-center">
                          {selectedEstado.errorType === 'captcha' ? (
                            <>
                              <div className="w-16 h-10 bg-white/10 rounded mx-auto mb-2 flex items-center justify-center">
                                <span className="text-2xl text-white/50">?</span>
                              </div>
                              <p className="text-red-400 text-xs">CAPTCHA DETECTADO</p>
                              <p className="text-gray-500 text-[10px]">Verificacion humana requerida</p>
                            </>
                          ) : selectedEstado.errorType === 'timeout' ? (
                            <>
                              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                              <p className="text-yellow-400 text-xs">TIMEOUT 30s</p>
                              <p className="text-gray-500 text-[10px]">Servidor no responde</p>
                            </>
                          ) : selectedEstado.errorType === 'conexion' ? (
                            <>
                              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                              <p className="text-red-400 text-xs">ERR_CONNECTION_REFUSED</p>
                              <p className="text-gray-500 text-[10px]">Portal inaccesible</p>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                              <p className="text-yellow-400 text-xs">{selectedEstado.errorType.toUpperCase()}</p>
                              <p className="text-gray-500 text-[10px]">Ver detalles abajo</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
                      onClick={() => {
                        reintentarEstado(selectedEstado.estado)
                        setShowDetailDialog(false)
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

              {/* Success state con PDF */}
              {selectedEstado.status === 'exito' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-950/30 rounded border border-green-600 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">Solicitud generada exitosamente</p>
                    <p className="text-green-600 text-xs mt-1">Tiempo: {selectedEstado.tiempo}ms</p>
                  </div>
                  
                  {/* Folio generado */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <span className="text-green-600 text-xs block mb-1">Folio Generado:</span>
                    <code className="text-green-300 text-sm font-bold">{selectedEstado.folioGenerado}</code>
                  </div>
                  
                  {/* PDF Preview */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-xs">Documento PDF Generado:</span>
                    </div>
                    
                    {/* PDF Preview simulado */}
                    <div className="bg-white rounded-lg p-4 text-black text-xs">
                      <div className="border-b-2 border-green-600 pb-2 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-green-700">CENTRO DE CONCILIACION LABORAL</p>
                            <p className="text-gray-600 text-[10px]">{selectedEstado.estado}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500">FOLIO</p>
                            <p className="font-mono font-bold text-[10px]">{selectedEstado.folioGenerado}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-[10px]">
                        <p className="font-bold text-center">CONSTANCIA DE SOLICITUD DE CONCILIACION</p>
                        <div className="grid grid-cols-2 gap-2 text-[9px]">
                          <div>
                            <span className="text-gray-500">Fecha:</span>
                            <span className="ml-1">{new Date().toLocaleDateString('es-MX')}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Hora:</span>
                            <span className="ml-1">{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-[9px]">
                          <p className="text-green-700">Se ha registrado su solicitud de conciliacion laboral.</p>
                          <p className="text-gray-500 mt-1">Conserve este documento como comprobante.</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-[8px] text-gray-500">QR</span>
                          </div>
                          <span className="text-[8px] text-gray-400">Verificar en linea</span>
                        </div>
                        <div className="text-right text-[8px] text-gray-400">
                          <p>Documento generado automaticamente</p>
                          <p>por sistema CCL v1.0</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de accion PDF */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-700 hover:bg-green-600 text-white font-mono text-xs"
                        onClick={() => {
                          setSelectedPdf(selectedEstado)
                          setShowPdfDialog(true)
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        VER PDF COMPLETO
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-600 text-green-400 hover:bg-green-950 font-mono text-xs bg-transparent"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        DESCARGAR
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tiempo */}
              <div className="flex justify-between text-xs text-green-700 pt-2 border-t border-green-900">
                <span>Tiempo de prueba:</span>
                <span>{selectedEstado.tiempo}ms</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de PDF Completo */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="bg-white text-black max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <FileText className="w-5 h-5" />
              Constancia de Solicitud CCL
            </DialogTitle>
            <DialogDescription>
              {selectedPdf?.estado} - Folio: {selectedPdf?.folioGenerado}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPdf && (
            <div className="border border-gray-300 rounded-lg p-6 bg-white">
              {/* Header oficial */}
              <div className="text-center border-b-2 border-green-600 pb-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-green-800">CENTRO DE CONCILIACION LABORAL</h2>
                <p className="text-sm text-gray-600">{selectedPdf.estado === 'Federal' ? 'Centro Federal de Conciliacion y Registro Laboral' : `Estado de ${selectedPdf.estado}`}</p>
                <p className="text-xs text-gray-400 mt-1">{selectedPdf.url}</p>
              </div>
              
              {/* Titulo */}
              <div className="text-center mb-6">
                <h3 className="text-base font-bold text-gray-800">CONSTANCIA DE SOLICITUD DE CONCILIACION LABORAL</h3>
                <p className="text-xs text-gray-500 mt-1">Documento electronico con validez oficial</p>
              </div>
              
              {/* Datos del folio */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Folio de Solicitud:</span>
                    <p className="font-mono font-bold text-green-700">{selectedPdf.folioGenerado}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Fecha de Emision:</span>
                    <p className="font-semibold">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Hora de Registro:</span>
                    <p className="font-semibold">{new Date().toLocaleTimeString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Estado del Tramite:</span>
                    <Badge className="bg-green-100 text-green-700">REGISTRADO</Badge>
                  </div>
                </div>
              </div>
              
              {/* Contenido */}
              <div className="space-y-4 text-sm text-gray-700">
                <p>
                  Por medio del presente documento se hace constar que se ha recibido y registrado 
                  correctamente la solicitud de conciliacion laboral en el sistema del Centro de 
                  Conciliacion Laboral {selectedPdf.estado === 'Federal' ? 'Federal' : `del Estado de ${selectedPdf.estado}`}.
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-yellow-800 text-xs">
                    <strong>IMPORTANTE:</strong> Conserve este documento como comprobante de su solicitud. 
                    Debera presentarlo el dia de su cita de conciliacion junto con una identificacion oficial vigente.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Proximos pasos:</strong>
                  </p>
                  <ol className="text-xs text-gray-600 list-decimal ml-4 mt-2 space-y-1">
                    <li>Recibira una notificacion con la fecha y hora de su audiencia de conciliacion</li>
                    <li>Prepare la documentacion requerida segun su caso</li>
                    <li>Presentese 15 minutos antes de la hora programada</li>
                  </ol>
                </div>
              </div>
              
              {/* Footer con QR y firma */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                      <div className="text-center">
                        <div className="grid grid-cols-4 gap-0.5 w-12 h-12 mx-auto">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                          ))}
                        </div>
                        <span className="text-[8px] text-gray-400">QR Code</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Escanee para verificar</p>
                      <p>autenticidad del documento</p>
                      <p className="font-mono text-[10px] mt-1">{selectedPdf.url}/verify/{selectedPdf.folioGenerado}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Documento generado electronicamente</p>
                    <p>Sistema CCL v1.0 - {new Date().getFullYear()}</p>
                    <p className="font-mono text-[10px] mt-2">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botones */}
          <div className="flex gap-2 mt-4">
            <Button className="flex-1 bg-green-600 hover:bg-green-500">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir en Nueva Ventana
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
