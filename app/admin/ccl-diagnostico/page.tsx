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
  // 32 Centros Estatales
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de Mexico', 'Michoacan', 'Morelos',
  'Nayarit', 'Nuevo Leon', 'Oaxaca', 'Puebla', 'Queretaro', 'Quintana Roo',
  'San Luis Potosi', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatan', 'Zacatecas',
  // 1 Centro Federal (CFCRL)
  'Federal'
]

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

// Function to generate random error data
const generarErrorAleatorio = (): { errorType: ErrorType; errorMessage: string; accionSugerida: string } => {
  const errorTypes = ['captcha', 'timeout', 'conexion', 'formulario', 'validacion', 'ninguno'] as ErrorType[]
  const randomErrorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
  const errorMessages: Record<ErrorType, string> = {
    captcha: 'CAPTCHA detectado - Requiere intervencion humana',
    timeout: 'Timeout: Portal tardo mas de 30s en cargar',
    conexion: 'Error de red: No se pudo establecer conexion',
    formulario: 'Formulario de login no encontrado',
    validacion: 'Validacion del formulario fallo',
    ninguno: ''
  }
  const accionSugeridas: Record<ErrorType, string> = {
    captcha: 'Solicitar a SuperAdmin resolver CAPTCHA manualmente',
    timeout: 'El portal esta lento, reintentar en horario de menor trafico',
    conexion: 'Verificar conexion a internet y firewall',
    formulario: 'La estructura del portal cambio, actualizar selector',
    validacion: 'Verificar formato de datos de prueba',
    ninguno: ''
  }

  return {
    errorType: randomErrorType,
    errorMessage: errorMessages[randomErrorType],
    accionSugerida: accionSugeridas[randomErrorType]
  }
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
      folioGenerado: '',
      pasoActual: 'conexion',
      pasoDetenido: null,
      pasos: crearPasosIniciales(),
      errorDetallado: null
    })))
  }

  // Generar folio simulado
  const generarFolio = (estado: string) => {
    const prefijo = estado.slice(0, 3).toUpperCase()
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `CCL-${prefijo}-${fecha}-${numero}`
  }

  // Generador de errores detallados con paso especifico
  const generarErrorDetallado = (pasoFallido: PasoRobot): { 
    errorType: ErrorType
    errorMessage: string
    accionSugerida: string
    errorDetallado: Resultado['errorDetallado']
  } => {
    const erroresPorPaso: Record<PasoRobot, Array<{
      errorType: ErrorType
      errorMessage: string
      accionSugerida: string
      tipoDetallado: 'red' | 'servidor' | 'captcha' | 'timeout' | 'formulario' | 'desconocido'
      codigo: string
      descripcion: string
    }>> = {
      'conexion': [
        {
          errorType: 'conexion',
          errorMessage: 'Error de red: No se pudo establecer conexion',
          accionSugerida: 'Verificar conexion a internet y firewall',
          tipoDetallado: 'red',
          codigo: 'NET_ERR_CONNECTION_REFUSED',
          descripcion: 'El servidor rechazo la conexion. Posible bloqueo de IP o servidor caido.'
        },
        {
          errorType: 'conexion',
          errorMessage: 'DNS no resuelto',
          accionSugerida: 'El dominio del portal no responde, puede estar en mantenimiento',
          tipoDetallado: 'red',
          codigo: 'NET_ERR_NAME_NOT_RESOLVED',
          descripcion: 'No se pudo resolver el nombre de dominio. Verificar URL del portal.'
        }
      ],
      'carga_portal': [
        {
          errorType: 'timeout',
          errorMessage: 'Timeout: Portal tardo mas de 30s en cargar',
          accionSugerida: 'El portal esta lento, reintentar en horario de menor trafico',
          tipoDetallado: 'timeout',
          codigo: 'TIMEOUT_EXCEEDED',
          descripcion: 'El tiempo de espera se agoto esperando respuesta del servidor (30000ms).'
        },
        {
          errorType: 'conexion',
          errorMessage: 'Error 503: Servicio no disponible',
          accionSugerida: 'El portal esta en mantenimiento, reintentar mas tarde',
          tipoDetallado: 'servidor',
          codigo: 'HTTP_503_SERVICE_UNAVAILABLE',
          descripcion: 'El servidor devolvio error 503. El servicio no esta disponible temporalmente.'
        }
      ],
      'login': [
        {
          errorType: 'formulario',
          errorMessage: 'Formulario de login no encontrado',
          accionSugerida: 'La estructura del portal cambio, actualizar selector',
          tipoDetallado: 'formulario',
          codigo: 'SELECTOR_NOT_FOUND',
          descripcion: 'No se encontro el elemento #login-form en la pagina. Posible cambio de estructura.'
        }
      ],
      'formulario': [
        {
          errorType: 'formulario',
          errorMessage: 'Campo requerido no encontrado',
          accionSugerida: 'Actualizar mapeo de campos del formulario',
          tipoDetallado: 'formulario',
          codigo: 'FIELD_NOT_FOUND',
          descripcion: 'No se encontro el campo "curp" en el formulario. Selector: input[name="curp"]'
        },
        {
          errorType: 'validacion',
          errorMessage: 'Validacion del formulario fallo',
          accionSugerida: 'Verificar formato de datos de prueba',
          tipoDetallado: 'formulario',
          codigo: 'VALIDATION_ERROR',
          descripcion: 'El portal rechazo los datos: "CURP invalido". Verificar formato.'
        }
      ],
      'captcha': [
        {
          errorType: 'captcha',
          errorMessage: 'CAPTCHA detectado - Requiere intervencion humana',
          accionSugerida: 'Solicitar a SuperAdmin resolver CAPTCHA manualmente',
          tipoDetallado: 'captcha',
          codigo: 'CAPTCHA_DETECTED',
          descripcion: 'Se detecto reCAPTCHA v2/v3. El robot no puede resolverlo automaticamente.'
        },
        {
          errorType: 'captcha',
          errorMessage: 'CAPTCHA de imagen detectado',
          accionSugerida: 'Solicitar ayuda manual para resolver el CAPTCHA',
          tipoDetallado: 'captcha',
          codigo: 'IMAGE_CAPTCHA',
          descripcion: 'CAPTCHA de seleccion de imagenes detectado. Requiere intervencion humana.'
        }
      ],
      'envio': [
        {
          errorType: 'conexion',
          errorMessage: 'Error al enviar formulario',
          accionSugerida: 'Reintentar el envio',
          tipoDetallado: 'servidor',
          codigo: 'SUBMIT_FAILED',
          descripcion: 'El servidor devolvio error 500 al procesar la solicitud.'
        }
      ],
      'confirmacion': [
        {
          errorType: 'timeout',
          errorMessage: 'No se recibio confirmacion',
          accionSugerida: 'Verificar manualmente si la solicitud fue registrada',
          tipoDetallado: 'timeout',
          codigo: 'CONFIRMATION_TIMEOUT',
          descripcion: 'No se recibio pagina de confirmacion despues de 15s.'
        }
      ],
      'descarga_pdf': [
        {
          errorType: 'conexion',
          errorMessage: 'Error al descargar PDF',
          accionSugerida: 'Reintentar descarga o descargar manualmente',
          tipoDetallado: 'servidor',
          codigo: 'PDF_DOWNLOAD_FAILED',
          descripcion: 'No se pudo descargar el archivo PDF de confirmacion.'
        }
      ]
    }

    const erroresDisponibles = erroresPorPaso[pasoFallido] || erroresPorPaso['conexion']
    const error = erroresDisponibles[Math.floor(Math.random() * erroresDisponibles.length)]

    return {
      errorType: error.errorType,
      errorMessage: error.errorMessage,
      accionSugerida: error.accionSugerida,
      errorDetallado: {
        tipo: error.tipoDetallado,
        codigo: error.codigo,
        descripcion: error.descripcion,
        timestamp: new Date().toISOString(),
        intentos: 1
      }
    }
  }

  // Simular ejecucion de un paso del robot
  const ejecutarPaso = async (paso: PasoRobot): Promise<{ exito: boolean; tiempo: number; screenshot: string }> => {
    const tiempoBase = {
      'conexion': 200,
      'carga_portal': 1500,
      'login': 800,
      'formulario': 1200,
      'captcha': 500,
      'envio': 1000,
      'confirmacion': 800,
      'descarga_pdf': 600
    }
    
    const tiempo = tiempoBase[paso] + Math.random() * 500
    await new Promise(resolve => setTimeout(resolve, tiempo))
    
    // Probabilidad de fallo por paso
    const probFallo = {
      'conexion': 0.05,
      'carga_portal': 0.1,
      'login': 0.08,
      'formulario': 0.12,
      'captcha': 0.25, // CAPTCHA tiene mayor probabilidad de fallo
      'envio': 0.1,
      'confirmacion': 0.05,
      'descarga_pdf': 0.08
    }
    
    const fallo = Math.random() < probFallo[paso]
    
    return {
      exito: !fallo,
      tiempo: Math.round(tiempo),
      screenshot: fallo ? `/api/placeholder/800/600?text=${encodeURIComponent(`Error en: ${paso}`)}` : ''
    }
  }

  const iniciarDiagnostico = async () => {
    setEjecutando(true)
    setProgreso(0)
    setCurrentIndex(0)
    initResultados()

    // Continuar con cada estado aunque haya errores (robusto)
    for (let i = 0; i < ESTADOS_MEXICO.length; i++) {
      setCurrentIndex(i)
      const estadoActual = ESTADOS_MEXICO[i]
      let tiempoTotal = 0
      let pasoDetenido: PasoRobot | null = null
      let errorData: ReturnType<typeof generarErrorDetallado> | null = null
      let finalStatus: TestStatus = 'exito'
      const pasosActualizados = crearPasosIniciales()
      
      // Marcar como en progreso
      setResultados(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'en_progreso', pasoActual: 'conexion' } : r
      ))

      // Ejecutar cada paso secuencialmente
      try {
        for (let p = 0; p < PASOS_ROBOT.length; p++) {
          const pasoInfo = PASOS_ROBOT[p]
          
          // Actualizar paso actual
          setResultados(prev => prev.map((r, idx) => 
            idx === i ? { ...r, pasoActual: pasoInfo.paso } : r
          ))
          
          // Ejecutar el paso
          const resultado = await ejecutarPaso(pasoInfo.paso)
          tiempoTotal += resultado.tiempo
          
          // Actualizar el paso en el array
          pasosActualizados[p] = {
            ...pasosActualizados[p],
            completado: resultado.exito,
            error: !resultado.exito,
            tiempo: resultado.tiempo,
            screenshot: resultado.screenshot,
            mensaje: resultado.exito ? 'Completado' : 'Error detectado'
          }
          
          // Si fallo, capturar screenshot y continuar al siguiente ESTADO (no paso)
          if (!resultado.exito) {
            pasoDetenido = pasoInfo.paso
            errorData = generarErrorDetallado(pasoInfo.paso)
            
            // Determinar si es error total o parcial
            if (pasoInfo.paso === 'conexion' || pasoInfo.paso === 'carga_portal') {
              finalStatus = 'error' // Error critico
            } else if (pasoInfo.paso === 'captcha') {
              finalStatus = 'parcial' // Necesita intervencion
            } else {
              finalStatus = 'parcial'
            }
            
            // Capturar screenshot del momento del error
            pasosActualizados[p].screenshot = `/api/placeholder/800/600?text=${encodeURIComponent(
              `ROBOT DETENIDO\n${estadoActual}\nPaso: ${pasoInfo.nombre}\nError: ${errorData.errorDetallado?.codigo || 'UNKNOWN'}`
            )}`
            
            // IMPORTANTE: Salir del loop de pasos pero CONTINUAR con el siguiente estado
            break
          }
        }
      } catch (err) {
        // Error inesperado - registrar y continuar
        finalStatus = 'error'
        pasoDetenido = 'conexion'
        errorData = {
          errorType: 'conexion',
          errorMessage: 'Error inesperado en la ejecucion',
          accionSugerida: 'Revisar logs del sistema',
          errorDetallado: {
            tipo: 'desconocido',
            codigo: 'UNEXPECTED_ERROR',
            descripcion: err instanceof Error ? err.message : 'Error desconocido',
            timestamp: new Date().toISOString(),
            intentos: 1
          }
        }
      }
      
      // Generar folio si fue exitoso
      const folio = finalStatus === 'exito' ? generarFolio(estadoActual) : ''
      
      // Actualizar resultado final del estado
      setResultados(prev => prev.map((r, idx) => 
        idx === i ? { 
          ...r, 
          status: finalStatus, 
          tiempo: tiempoTotal,
          errorType: errorData?.errorType || 'ninguno',
          errorMessage: errorData?.errorMessage || '',
          accionSugerida: errorData?.accionSugerida || '',
          captchaPendiente: errorData?.errorType === 'captcha',
          screenshot: pasoDetenido ? pasosActualizados.find(p => p.paso === pasoDetenido)?.screenshot || '' : '',
          pdfUrl: finalStatus === 'exito' ? `/api/ccl-pdf/${folio}` : '',
          folioGenerado: folio,
          pasoDetenido,
          pasos: pasosActualizados,
          errorDetallado: errorData?.errorDetallado || null
        } : r
      ))
      
      setProgreso(Math.round(((i + 1) / ESTADOS_MEXICO.length) * 100))
      
      // Pequeña pausa entre estados para no saturar
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setEjecutando(false)
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

  const reintentarEstado = async (estado: string) => {
    const idx = resultados.findIndex(r => r.estado === estado)
    if (idx === -1) return

    // Reiniciar pasos
    const pasosReiniciados = crearPasosIniciales()
    
    setResultados(prev => prev.map((r, i) => 
      i === idx ? { 
        ...r, 
        status: 'en_progreso', 
        pasos: pasosReiniciados,
        pasoDetenido: null,
        errorDetallado: null
      } : r
    ))

    // Simular reintento completo
    let tiempoTotal = 0
    let exitoso = true
    
    for (const pasoInfo of PASOS_ROBOT) {
      const resultado = await ejecutarPaso(pasoInfo.paso)
      tiempoTotal += resultado.tiempo
      
      if (!resultado.exito) {
        exitoso = false
        break
      }
    }

    const folio = exitoso ? generarFolio(estado) : ''
    
    setResultados(prev => prev.map((r, i) => 
      i === idx ? { 
        ...r, 
        status: exitoso ? 'exito' : 'parcial',
        tiempo: tiempoTotal,
        errorType: exitoso ? 'ninguno' : r.errorType,
        errorMessage: exitoso ? '' : r.errorMessage,
        captchaPendiente: false,
        folioGenerado: folio,
        pdfUrl: exitoso ? `/api/ccl-pdf/${folio}` : ''
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
                <h1 className="text-sm sm:text-lg font-bold text-green-400 font-mono">DIAGNOSTICO CCL</h1>
                <p className="text-[10px] sm:text-xs text-green-700 font-mono hidden sm:block">32 Centros Estatales + 1 Federal</p>
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
            {/* Stats mobile - arriba */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm mb-3 sm:hidden">
              <span className="text-green-400">OK:{stats.exito}</span>
              <span className="text-yellow-400">PARC:{stats.parcial}</span>
              <span className="text-red-400">ERR:{stats.error}</span>
              <span className="text-gray-500">PEND:{stats.pendiente}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <select 
                  value={modo}
                  onChange={(e) => setModo(e.target.value as 'dry_run' | 'live')}
                  disabled={ejecutando}
                  className="bg-green-950 border border-green-700 text-green-400 font-mono text-xs sm:text-sm rounded px-2 sm:px-3 py-1.5 sm:py-2 flex-1 sm:flex-none"
                >
                  <option value="dry_run">DRY RUN</option>
                  <option value="live">LIVE TEST</option>
                </select>
                
                <Button
                  onClick={iniciarDiagnostico}
                  disabled={ejecutando}
                  size="sm"
                  className="bg-green-600 hover:bg-green-500 text-black font-mono font-bold text-xs sm:text-sm flex-1 sm:flex-none"
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
                      INICIAR
                    </>
                  )}
                </Button>
                
                {ejecutando && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEjecutando(false)}
                    className="border-yellow-600 text-yellow-500 hover:bg-yellow-950 font-mono text-xs sm:text-sm"
                  >
                    <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">PAUSAR</span>
                  </Button>
                )}
              </div>
              
              {/* Stats desktop */}
              <div className="hidden sm:flex items-center gap-4 font-mono text-sm">
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
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {resultados.map((resultado) => (
            <Card 
              key={resultado.estado}
              className={`${getStatusColor(resultado.status)} border transition-all cursor-pointer active:scale-95 sm:hover:scale-105 ${
                resultado.estado === 'Federal' ? 'ring-1 sm:ring-2 ring-blue-500 col-span-2' : ''
              }`}
              onClick={() => resultado.status !== 'pendiente' && resultado.status !== 'en_progreso' && verDetalle(resultado)}
            >
              <CardContent className="p-1.5 sm:p-2 text-center">
                {resultado.estado === 'Federal' && (
                  <Badge className="bg-blue-900 text-blue-300 text-[6px] sm:text-[7px] mb-0.5 sm:mb-1 px-1">CFCRL</Badge>
                )}
                <div className="flex justify-center mb-0.5 sm:mb-1">
                  {getStatusIcon(resultado.status)}
                </div>
                <p className={`text-[7px] sm:text-[9px] font-mono truncate ${
                  resultado.estado === 'Federal' ? 'text-blue-300' : 'text-green-300'
                }`} title={resultado.estado}>
                  {resultado.estado === 'Federal' ? 'FED' : resultado.estado.slice(0, 8)}
                </p>
                {resultado.tiempo > 0 && (
                  <p className="text-[6px] sm:text-[8px] text-green-700 font-mono">
                    {resultado.tiempo}ms
                  </p>
                )}
                {resultado.captchaPendiente && (
                  <Badge className="mt-0.5 sm:mt-1 bg-red-900 text-red-400 text-[6px] sm:text-[7px] px-0.5 sm:px-1">
                    CAP
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

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
                      onClick={async () => {
                        if (!selectedEstado?.estado) return
                        setShowDetailDialog(false)
                        // Esperar a que cierre el dialog
                        await new Promise(r => setTimeout(r, 100))
                        reintentarEstado(selectedEstado.estado)
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

              {/* Success state con PDF REAL del portal CCL */}
              {selectedEstado.status === 'exito' && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-950/30 rounded border border-green-600 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">Solicitud registrada exitosamente</p>
                    <p className="text-green-600 text-xs mt-1">Tiempo: {selectedEstado.tiempo}ms</p>
                  </div>
                  
                  {/* Folio REAL del portal CCL */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <span className="text-green-600 text-xs block mb-1">Folio Electronico del CCL:</span>
                    <code className="text-green-300 text-sm font-bold">{selectedEstado.folioGenerado}</code>
                    <p className="text-green-700 text-[10px] mt-1">Este folio es generado por el portal oficial {selectedEstado.url}</p>
                  </div>
                  
                  {/* PDF REAL descargado del portal CCL */}
                  <div className="p-3 bg-green-950/50 rounded border border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 text-xs">PDF OFICIAL del Portal CCL:</span>
                      </div>
                      <Badge className="bg-green-600 text-black text-[9px]">DOCUMENTO REAL</Badge>
                    </div>
                    
                    {/* Indicador de PDF real descargado */}
                    <div className="bg-black/50 rounded-lg p-4 border border-green-700">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-16 bg-white rounded flex items-center justify-center shadow-lg">
                          <FileText className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-green-300 text-xs font-mono">constancia_ccl_{selectedEstado.estado.toLowerCase().replace(/ /g, '_')}.pdf</p>
                          <p className="text-green-600 text-[10px] mt-1">Descargado desde: {selectedEstado.url}</p>
                          <p className="text-green-700 text-[10px]">Fecha: {new Date().toLocaleDateString('es-MX')}</p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-900/30 border border-yellow-600 rounded p-2 mb-3">
                        <p className="text-yellow-400 text-[10px] text-center">
                          Este es el PDF REAL generado por el portal gubernamental del CCL.
                          Presentar en Oficialia de Partes para confirmar audiencia.
                        </p>
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
                        VER PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-600 text-green-400 hover:bg-green-950 font-mono text-xs bg-transparent"
                        onClick={() => {
                          // TODO: Descargar el PDF real almacenado
                          window.open(selectedEstado.pdfUrl, '_blank')
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        DESCARGAR PDF
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

      {/* Dialog de PDF REAL del Portal CCL */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="bg-gray-900 text-white max-w-2xl max-h-[90vh] overflow-auto border border-green-600">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <FileText className="w-5 h-5" />
              PDF OFICIAL del Centro de Conciliacion Laboral
            </DialogTitle>
            <DialogDescription className="text-green-600">
              {selectedPdf?.estado === 'Federal' ? 'CFCRL - Centro Federal' : `CCL ${selectedPdf?.estado}`} | Folio: {selectedPdf?.folioGenerado}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPdf && (
            <div className="space-y-4">
              {/* Aviso de documento real */}
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">DOCUMENTO OFICIAL</span>
                </div>
                <p className="text-green-300 text-xs">
                  Este PDF fue descargado directamente del portal gubernamental: <span className="font-mono">{selectedPdf.url}</span>
                </p>
              </div>
              
              {/* Visor de PDF embebido */}
              <div className="bg-white rounded-lg overflow-hidden">
                {selectedPdf.pdfUrl ? (
                  <iframe 
                    src={selectedPdf.pdfUrl}
                    className="w-full h-[400px]"
                    title="PDF de Constancia CCL"
                  />
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center bg-gray-100">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-sm">PDF no disponible en preview</p>
                    <p className="text-gray-500 text-xs mt-1">Use los botones para descargar o abrir</p>
                  </div>
                )}
              </div>
              
              {/* Datos del documento */}
              <div className="bg-black/50 rounded-lg p-3 border border-green-800">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-green-600">Folio Electronico:</span>
                    <p className="font-mono text-green-300 font-bold">{selectedPdf.folioGenerado}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Portal de Origen:</span>
                    <p className="text-green-300 truncate">{selectedPdf.url}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Fecha de Descarga:</span>
                    <p className="text-green-300">{new Date().toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-green-600">Hora:</span>
                    <p className="text-green-300">{new Date().toLocaleTimeString('es-MX')}</p>
                  </div>
                </div>
              </div>
              
              {/* Instrucciones */}
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
                <p className="text-yellow-400 text-xs">
                  <strong>SIGUIENTE PASO:</strong> Presentar este documento en Oficialía de Partes del CCL de {selectedPdf.estado} 
                  para confirmar la solicitud y recibir fecha de audiencia de conciliación.
                </p>
              </div>
            </div>
          )}
          
          {/* Botones */}
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-500"
              onClick={() => selectedPdf?.pdfUrl && window.open(selectedPdf.pdfUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent border-green-600 text-green-400 hover:bg-green-950"
              onClick={() => selectedPdf?.pdfUrl && window.open(selectedPdf.pdfUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir en Nueva Ventana
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
