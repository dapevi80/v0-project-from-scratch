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
  ArrowRight, ArrowLeft, DollarSign
} from 'lucide-react'
import { 
  generarSolicitudCCL, 
  calcularPrescripcion, 
  obtenerPortalCCL,
  ESTADOS_MEXICO,
  type DatosCasoSolicitud,
  type TipoTerminacion,
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

export function GenerarSolicitudModal({ isOpen, onClose, caso, onSuccess }: GenerarSolicitudModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ResultadoSolicitud | null>(null)
  const [portal, setPortal] = useState<{ nombre: string; direccion: string; url_portal: string } | null>(null)
  
  // Datos del formulario
  const [tipoTerminacion, setTipoTerminacion] = useState<TipoTerminacion>('despido')
  const [estadoEmpleador, setEstadoEmpleador] = useState('')
  const [fechaTerminacion, setFechaTerminacion] = useState('')
  const [descripcionHechos, setDescripcionHechos] = useState('')
  const [montoEstimado, setMontoEstimado] = useState('')
  
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
    
    setLoading(true)
    
    const datos: DatosCasoSolicitud = {
      casoId: caso.id,
      trabajadorNombre: caso.worker?.full_name || 'Sin nombre',
      trabajadorCurp: caso.worker?.curp,
      trabajadorDomicilio: caso.worker?.calle ? `${caso.worker.calle}, ${caso.worker.ciudad}, ${caso.worker.estado}` : undefined,
      trabajadorTelefono: caso.worker?.phone,
      trabajadorEmail: caso.worker?.email,
      empleadorNombre: caso.employer_name,
      empleadorDomicilio: caso.employer_address,
      empleadorEstado: estadoEmpleador,
      fechaIngreso: caso.start_date || '',
      fechaTerminacion: fechaTerminacion,
      tipoTerminacion: tipoTerminacion,
      salarioDiario: caso.salary_daily || 0,
      puestoTrabajo: caso.job_title,
      descripcionHechos: descripcionHechos,
      montoEstimado: montoEstimado ? parseFloat(montoEstimado) : undefined
    }
    
    const result = await generarSolicitudCCL(datos)
    setResultado(result)
    
    if (result.success) {
      setStep(3)
      onSuccess?.(result)
    }
    
    setLoading(false)
  }

  const handleClose = () => {
    setStep(1)
    setResultado(null)
    onClose()
  }

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
            <div>
              <Label>Descripción de los hechos (opcional)</Label>
              <Textarea 
                placeholder="Describe brevemente lo que sucedió..."
                value={descripcionHechos}
                onChange={(e) => setDescripcionHechos(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label>Monto estimado de liquidación (opcional)</Label>
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
                    <span className="text-gray-500">Empleador:</span>
                    <span className="font-medium">{caso.employer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <Badge variant="outline">
                      {tipoTerminacion === 'despido' ? 'Despido Injustificado' : 
                       tipoTerminacion === 'rescision' ? 'Rescisión' : 'Renuncia Forzada'}
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
                  <p className="text-green-600">Tu solicitud ha sido registrada exitosamente</p>
                </div>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Folio:</span>
                        <Badge className="text-lg px-3 py-1 bg-green-600">{resultado.folioSolicitud}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha de cita:</span>
                        <span className="font-semibold">{resultado.fechaCita}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hora:</span>
                        <span className="font-semibold">{resultado.horaCita}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sede:</span>
                        <span className="font-semibold">{resultado.sedeCcl}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 block mb-1">Dirección:</span>
                        <p className="text-sm">{resultado.direccionSede}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {resultado.instrucciones && resultado.instrucciones.length > 0 && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">Instrucciones</h4>
                      <ul className="space-y-2 text-sm">
                        {resultado.instrucciones.map((inst, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{inst}</span>
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
    </Dialog>
  )
}
