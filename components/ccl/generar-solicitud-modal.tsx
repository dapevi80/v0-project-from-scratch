'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  FileText, Calendar, MapPin, Building2, User, Phone, Mail, 
  AlertTriangle, CheckCircle2, Loader2, Clock, Scale, Sparkles,
  ArrowRight, ArrowLeft, DollarSign, Video, Users, Bot, Zap
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AgentProgressModal } from './agent-progress-modal'
import { ManualSolicitudGuide } from './manual-solicitud-guide'
import { SolicitudManualGuide } from './solicitud-manual-guide'
import { 
  generarSolicitudCCL, 
  calcularPrescripcion, 
  obtenerPortalCCL,
  getEstadosMexico,
  type DatosCasoSolicitud,
  type TipoTerminacion,
  type TipoPersonaCitado,
  type ModalidadConciliacionTipo,
  type ResultadoSolicitud
} from '@/lib/ccl/solicitud-generator'

interface Caso {
  id: string
  worker_id: string
  employer_name: string
  employer_address?: string
  job_title?: string
  salary_daily?: number
  start_date?: string
  end_date?: string
  termination_type?: string
  status?: string
  worker?: {
    full_name?: string
    email?: string
    phone?: string
    curp?: string
    calle?: string
    ciudad?: string
    estado?: string
  }
}

interface GenerarSolicitudModalProps {
  isOpen: boolean
  onClose: () => void
  caso: Caso | null
  onSuccess?: (resultado: ResultadoSolicitud) => void
}

const ESTADOS_MEXICO = [
  { codigo: '01', nombre: 'Aguascalientes' },
  { codigo: '02', nombre: 'Baja California' },
  { codigo: '03', nombre: 'Baja California Sur' },
  { codigo: '04', nombre: 'Campeche' },
  { codigo: '05', nombre: 'Coahuila de Zaragoza' },
  { codigo: '06', nombre: 'Colima' },
  { codigo: '07', nombre: 'Chiapas' },
  { codigo: '08', nombre: 'Chihuahua' },
  { codigo: '09', nombre: 'Ciudad de México' },
  { codigo: '10', nombre: 'Durango' },
  { codigo: '11', nombre: 'Guanajuato' },
  { codigo: '12', nombre: 'Guerrero' },
  { codigo: '13', nombre: 'Hidalgo' },
  { codigo: '14', nombre: 'Jalisco' },
  { codigo: '15', nombre: 'México' },
  { codigo: '16', nombre: 'Michoacán de Ocampo' },
  { codigo: '17', nombre: 'Morelos' },
  { codigo: '18', nombre: 'Nayarit' },
  { codigo: '19', nombre: 'Nuevo León' },
  { codigo: '20', nombre: 'Oaxaca' },
  { codigo: '21', nombre: 'Puebla' },
  { codigo: '22', nombre: 'Querétaro' },
  { codigo: '23', nombre: 'Quintana Roo' },
  { codigo: '24', nombre: 'San Luis Potosí' },
  { codigo: '25', nombre: 'Sinaloa' },
  { codigo: '26', nombre: 'Sonora' },
  { codigo: '27', nombre: 'Tabasco' },
  { codigo: '28', nombre: 'Tamaulipas' },
  { codigo: '29', nombre: 'Tlaxcala' },
  { codigo: '30', nombre: 'Veracruz de Ignacio de Zaragoza' },
  { codigo: '31', nombre: 'Yucatán' },
  { codigo: '32', nombre: 'Zacatecas' }
]

export function GenerarSolicitudModal({ isOpen, onClose, caso, onSuccess }: GenerarSolicitudModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoSolicitud | null>(null)
  const [portal, setPortal] = useState<{ nombre: string; direccion: string; url_portal: string } | null>(null)
  
  // Estado del agente de IA
  const [agentJobId, setAgentJobId] = useState<string | null>(null)
  const [showAgentProgress, setShowAgentProgress] = useState(false)
  const [useAgent, setUseAgent] = useState(true) // Por defecto usar el agente de IA
  
  // Datos del formulario
  const [tipoTerminacion, setTipoTerminacion] = useState<TipoTerminacion>('despido')
  const [estadoEmpleador, setEstadoEmpleador] = useState('')
  const [fechaTerminacion, setFechaTerminacion] = useState('')
  const [descripcionHechos, setDescripcionHechos] = useState('')
  const [montoEstimado, setMontoEstimado] = useState('')
  // Nuevos campos SINACOL
  const [tipoPersonaCitado, setTipoPersonaCitado] = useState<TipoPersonaCitado>('moral')
  const [modalidadConciliacion, setModalidadConciliacion] = useState<ModalidadConciliacionTipo>('remota')
  
  // Prescripción calculada
  const [prescripcion, setPrescripcion] = useState<{ diasRestantes: number; fechaLimite: string; urgente: boolean } | null>(null)

  // Inicializar datos del caso
  useEffect(() => {
    if (caso) {
      setFechaTerminacion(caso.end_date || '')
      setEstadoEmpleador(caso.worker?.estado || '')
      
      // Mapear tipo de terminación
      if (caso.termination_type) {
        const mapeo: Record<string, TipoTerminacion> = {
          'despido_injustificado': 'despido',
          'despido': 'despido',
          'rescision': 'rescision',
          'renuncia_forzada': 'renuncia_forzada',
          'renuncia': 'renuncia_forzada'
        }
        setTipoTerminacion(mapeo[caso.termination_type] || 'despido')
      }
    }
  }, [caso])

  // Calcular prescripción cuando cambian los datos
  useEffect(() => {
    if (fechaTerminacion && tipoTerminacion) {
      const result = calcularPrescripcion(tipoTerminacion, fechaTerminacion)
      setPrescripcion(result)
    }
  }, [fechaTerminacion, tipoTerminacion])

  // Obtener portal CCL cuando cambia el estado
  useEffect(() => {
    async function fetchPortal() {
      if (estadoEmpleador) {
        const p = await obtenerPortalCCL(estadoEmpleador)
        setPortal(p)
      }
    }
    fetchPortal()
  }, [estadoEmpleador])

  const handleGenerar = async () => {
    if (!caso) return
    
    // Si NO usa el agente de IA, mostrar guia manual
    if (!useAgent) {
      console.log('Mostrar guía manual')
      return
    }
    
    setLoading(true)
    
    // Si usa el agente de IA, iniciar el proceso automatizado
    try {
      const response = await fetch('/api/ccl/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casoId: caso.id,
          modalidad: modalidadConciliacion,
          tipoPersonaCitado: tipoPersonaCitado,
          estadoEmpleador: estadoEmpleador,
          tipoTerminacion: tipoTerminacion,
          fechaTerminacion: fechaTerminacion
        })
      })
      
      const data = await response.json()
      
      if (data.jobId) {
        setAgentJobId(data.jobId)
        setShowAgentProgress(true)
        setLoading(false)
        return
      } else {
        throw new Error(data.error || 'Error al iniciar el agente')
      }
    } catch (error) {
      console.error('Error iniciando agente:', error)
      // Fallback al metodo manual si falla el agente
      console.log('Mostrar guía manual')
      setLoading(false)
      return
    }
  }
  
  const handleAgentComplete = (job: { resultado?: { folioSolicitud?: string; pdfUrl?: string } }) => {
    setShowAgentProgress(false)
    if (job.resultado) {
      setResultado({
        success: true,
        folioSolicitud: job.resultado.folioSolicitud,
        modalidad: modalidadConciliacion,
        urlComprobante: job.resultado.pdfUrl,
        instrucciones: [
          'El agente de IA ha completado la solicitud automaticamente',
          `Folio generado: ${job.resultado.folioSolicitud}`,
          'El PDF del acuse ha sido guardado en el caso',
          modalidadConciliacion === 'remota' 
            ? 'Proximo paso: Llama al CCL para confirmar la cita de videollamada'
            : 'Proximo paso: Acude al CCL a confirmar la solicitud presencialmente'
        ]
      })
      setStep(3)
    }
  }

  const handleClose = () => {
    setStep(1)
    setResultado(null)
    setAgentJobId(null)
    setShowAgentProgress(false)
    onClose()
  }

  const [showManualGuide, setShowManualGuide] = useState(false);

  if (!caso) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Generar Solicitud CCL con IA
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Verifica los datos del caso antes de generar la solicitud'}
            {step === 2 && 'Confirma la información y genera la solicitud'}
            {step === 3 && 'Solicitud generada exitosamente'}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Paso 1: Datos del caso */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Alerta de prescripción */}
            {prescripcion && (
              <Alert className={prescripcion.urgente ? 'border-red-500 bg-red-50' : prescripcion.diasRestantes <= 30 ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'}>
                <Clock className={`h-4 w-4 ${prescripcion.urgente ? 'text-red-600' : prescripcion.diasRestantes <= 30 ? 'text-amber-600' : 'text-green-600'}`} />
                <AlertTitle className={prescripcion.urgente ? 'text-red-800' : prescripcion.diasRestantes <= 30 ? 'text-amber-800' : 'text-green-800'}>
                  {prescripcion.diasRestantes <= 0 ? 'Plazo vencido' : `${prescripcion.diasRestantes} días restantes`}
                </AlertTitle>
                <AlertDescription className={prescripcion.urgente ? 'text-red-700' : prescripcion.diasRestantes <= 30 ? 'text-amber-700' : 'text-green-700'}>
                  {prescripcion.diasRestantes <= 0 
                    ? 'El plazo de prescripción ha vencido. No es posible generar la solicitud.'
                    : `Fecha límite: ${prescripcion.fechaLimite}. ${prescripcion.urgente ? 'Es urgente presentar la solicitud.' : ''}`
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Datos del trabajador */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Datos del Trabajador
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nombre:</span>
                    <p className="font-medium">{caso.worker?.full_name || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CURP:</span>
                    <p className="font-medium">{caso.worker?.curp || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <p className="font-medium">{caso.worker?.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{caso.worker?.email || 'No especificado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos del empleador */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Datos del Empleador
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <span className="text-gray-500">Empresa:</span>
                    <p className="font-medium">{caso.employer_name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Dirección:</span>
                    <p className="font-medium">{caso.employer_address || 'No especificada'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de tipo de terminación */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Terminación</Label>
                <Select value={tipoTerminacion} onValueChange={(v) => setTipoTerminacion(v as TipoTerminacion)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despido">Despido Injustificado</SelectItem>
                    <SelectItem value="rescision">Rescisión (causa imputable al patrón)</SelectItem>
                    <SelectItem value="renuncia_forzada">Renuncia Forzada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Fecha de Terminación</Label>
                <Input 
                  type="date" 
                  value={fechaTerminacion}
                  onChange={(e) => setFechaTerminacion(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Estado donde se ubica el centro de trabajo</Label>
              <Select value={estadoEmpleador} onValueChange={setEstadoEmpleador}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_MEXICO.map((estado) => (
                    <SelectItem key={estado.codigo} value={estado.nombre}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {portal && (
              <Alert className="bg-blue-50 border-blue-200">
                <MapPin className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Centro de Conciliación</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <strong>{portal.nombre}</strong><br />
                  {portal.direccion}<br />
                  <a href={portal.url_portal} target="_blank" rel="noopener noreferrer" className="underline">
                    Ver portal oficial
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="bg-transparent">
                Cancelar
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={!estadoEmpleador || !fechaTerminacion || (prescripcion?.diasRestantes || 0) <= 0}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Paso 2: Confirmación y detalles adicionales */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Tipo de persona del demandado */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tipo de persona del demandado *
              </Label>
              <RadioGroup
                value={tipoPersonaCitado}
                onValueChange={(v) => setTipoPersonaCitado(v as TipoPersonaCitado)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moral" id="moral-ccl" />
                  <Label htmlFor="moral-ccl" className="font-normal cursor-pointer">
                    Persona Moral (empresa)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fisica" id="fisica-ccl" />
                  <Label htmlFor="fisica-ccl" className="font-normal cursor-pointer">
                    Persona Fisica
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Modalidad de conciliación */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Modalidad de conciliacion *
              </Label>
              <RadioGroup
                value={modalidadConciliacion}
                onValueChange={(v) => setModalidadConciliacion(v as ModalidadConciliacionTipo)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="remota" id="remota-ccl" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="remota-ccl" className="font-medium cursor-pointer flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      Conciliacion Remota (Recomendada)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Audiencia por videollamada. El abogado llama al CCL para agendar confirmacion.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="presencial" id="presencial-ccl" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="presencial-ccl" className="font-medium cursor-pointer flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      Conciliacion Presencial
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      El trabajador debe acudir al CCL a confirmar dentro de 3 dias habiles.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Descripcion de los hechos (opcional)</Label>
              <Textarea 
                placeholder="Describe brevemente lo que sucedio..."
                value={descripcionHechos}
                onChange={(e) => setDescripcionHechos(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Monto estimado de liquidacion (opcional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={montoEstimado}
                  onChange={(e) => setMontoEstimado(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Modo de generacion: Agente IA o Manual */}
            <Card className={useAgent ? 'border-primary bg-primary/5' : 'border-amber-300 bg-amber-50'}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {useAgent ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {useAgent ? (
                          <>
                            <Zap className="h-4 w-4 text-primary" />
                            Agente de IA Activado
                          </>
                        ) : (
                          'Modo Manual'
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {useAgent 
                          ? 'El agente navegara automaticamente el portal SINACOL, llenara los formularios, resolvera CAPTCHAs y obtendra el PDF de tu solicitud.' 
                          : 'Se generaran instrucciones para completar la solicitud manualmente en el portal CCL.'}
                      </p>
                    </div>
                  </div>
                  {useAgent && (
                    <Alert className="mt-3 border-blue-200 bg-blue-50">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 text-xs">
                        El agente se ejecutara en segundo plano. Recibiras una notificacion cuando termine con el PDF del acuse listo.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>

            {/* Resumen */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-3">Resumen de la Solicitud</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trabajador:</span>
                    <span className="font-medium">{caso.worker?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Demandado:</span>
                    <span className="font-medium">{caso.employer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo persona:</span>
                    <Badge variant="outline">
                      {tipoPersonaCitado === 'moral' ? 'Persona Moral' : 'Persona Fisica'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo terminacion:</span>
                    <Badge variant="outline">
                      {tipoTerminacion === 'despido' ? 'Despido Injustificado' : 
                       tipoTerminacion === 'rescision' ? 'Rescision' : 'Renuncia Forzada'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modalidad:</span>
                    <Badge className={modalidadConciliacion === 'remota' ? 'bg-blue-500' : 'bg-green-500'}>
                      {modalidadConciliacion === 'remota' ? 'Remota (videollamada)' : 'Presencial'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado:</span>
                    <span className="font-medium">{estadoEmpleador}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Portal CCL:</span>
                    <span className="font-medium">{portal?.nombre}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Generación con IA</AlertTitle>
              <AlertDescription>
                La solicitud será generada automáticamente usando inteligencia artificial. 
                Recibirás un folio de confirmación y los datos de tu cita de conciliación.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Regresar
              </Button>
              <Button onClick={handleGenerar} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando solicitud...
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4 mr-2" />
                    Generar Solicitud CCL
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Paso 3: Resultado */}
        {step === 3 && resultado && (
          <div className="space-y-4">
            {resultado.success ? (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800">Solicitud Generada</h3>
                  <p className="text-green-600">
                    Modalidad: {resultado.modalidad === 'remota' ? 'CONCILIACION REMOTA' : 'CONCILIACION PRESENCIAL'}
                  </p>
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Folio:</span>
                        <Badge className="text-lg px-3 py-1 bg-green-600">{resultado.folioSolicitud}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modalidad:</span>
                        <Badge className={resultado.modalidad === 'remota' ? 'bg-blue-500' : 'bg-green-500'}>
                          {resultado.modalidad === 'remota' ? 'Remota (videollamada)' : 'Presencial'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sede CCL:</span>
                        <span className="font-semibold">{resultado.sedeCcl}</span>
                      </div>
                      {resultado.fechaLimiteConfirmacion && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confirmar antes de:</span>
                          <span className="font-semibold text-amber-600">{resultado.fechaLimiteConfirmacion}</span>
                        </div>
                      )}
                      {resultado.telefonoConfirmacion && resultado.modalidad === 'remota' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telefono CCL:</span>
                          <span className="font-semibold">{resultado.telefonoConfirmacion}</span>
                        </div>
                      )}
                      {resultado.ligaUnica && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-600 block mb-1">Liga unica para audiencias:</span>
                          <a href={resultado.ligaUnica} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm break-all">
                            {resultado.ligaUnica}
                          </a>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 block mb-1">Direccion CCL:</span>
                        <p className="text-sm">{resultado.direccionSede}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerta importante según modalidad */}
                <Alert className={resultado.modalidad === 'remota' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'}>
                  {resultado.modalidad === 'remota' ? (
                    <Video className="h-4 w-4 text-blue-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-green-600" />
                  )}
                  <AlertTitle className={resultado.modalidad === 'remota' ? 'text-blue-800' : 'text-green-800'}>
                    {resultado.modalidad === 'remota' ? 'Siguiente paso: Llamar al CCL' : 'Siguiente paso: Acudir al CCL'}
                  </AlertTitle>
                  <AlertDescription className={resultado.modalidad === 'remota' ? 'text-blue-700' : 'text-green-700'}>
                    {resultado.modalidad === 'remota' 
                      ? 'El abogado debe llamar al CCL para agendar la cita de confirmacion por videollamada con el oficial de partes.'
                      : 'El trabajador debe acudir personalmente al CCL a confirmar la solicitud con su identificacion oficial.'
                    }
                  </AlertDescription>
                </Alert>

                {resultado.instrucciones && resultado.instrucciones.length > 0 && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">Instrucciones de confirmacion</h4>
                      <ul className="space-y-2 text-sm">
                        {resultado.instrucciones.map((inst, i) => (
                          <li key={i} className="flex items-start gap-2">
                            {inst ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{inst}</span>
                              </>
                            ) : (
                              <span className="h-4" />
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800">Error</h3>
                <p className="text-red-600">{resultado.error}</p>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Modal del Agente de IA */}
      {agentJobId && (
        <AgentProgressModal
          isOpen={showAgentProgress}
          onClose={() => setShowAgentProgress(false)}
          jobId={agentJobId}
          onComplete={handleAgentComplete}
        />
      )}
      
      {/* Dialog de Guia Manual */}
      <Dialog open={showManualGuide} onOpenChange={setShowManualGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Guia para Solicitud Manual CCL
            </DialogTitle>
            <DialogDescription>
              Sigue estos pasos para crear la solicitud manualmente en el portal CCL
            </DialogDescription>
          </DialogHeader>
          
          {caso && portal && (
            <ManualSolicitudGuide
              caso={caso}
              portal={{
                nombre: portal.nombre,
                url_portal: portal.url_portal,
                direccion: portal.direccion,
                telefono: portal.telefono,
                horario: portal.horario,
                codigo: estadoEmpleador.substring(0, 3).toUpperCase()
              }}
              estadoEmpleador={estadoEmpleador}
              tipoTerminacion={tipoTerminacion}
              tipoPersonaCitado={tipoPersonaCitado}
              modalidadConciliacion={modalidadConciliacion}
              fechaTerminacion={fechaTerminacion}
              descripcionHechos={descripcionHechos}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
