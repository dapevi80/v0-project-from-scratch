'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Download,
  Calendar,
  CreditCard,
  Zap,
  FileDown
} from 'lucide-react'
import { 
  obtenerDatosCasoParaCCL, 
  determinarCCL, 
  getIndustriasFederales,
  verificarCreditosDisponibles,
  crearBorradorSolicitudCCL,
  generarSolicitudAutomatica,
  generarGuiaManual
} from './actions'
import { ESTADOS_MEXICO } from '@/lib/ccl/jurisdiction-engine'

const PASOS = [
  { id: 1, titulo: 'Ubicacion del trabajo', icono: MapPin },
  { id: 2, titulo: 'Industria del patron', icono: Building2 },
  { id: 3, titulo: 'Detalles de la solicitud', icono: FileText },
  { id: 4, titulo: 'Confirmacion', icono: CheckCircle2 }
]

const OBJETOS_SOLICITUD = [
  { value: 'despido', label: 'Despido injustificado' },
  { value: 'rescision', label: 'Rescision de contrato (renuncia justificada)' },
  { value: 'pago_prestaciones', label: 'Pago de prestaciones adeudadas' },
  { value: 'terminacion_voluntaria', label: 'Terminacion voluntaria' },
  { value: 'otro', label: 'Otro' }
]

export default function CCLFlowPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const casoId = searchParams.get('caso')
  
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Datos del caso
  const [caso, setCaso] = useState<Record<string, unknown> | null>(null)
  const [trabajador, setTrabajador] = useState<Record<string, unknown> | null>(null)
  const [industrias, setIndustrias] = useState<Array<{clave: string, nombre: string, descripcion: string, ejemplos: string[]}>>([])
  const [creditos, setCreditos] = useState({ tieneCreditos: false, creditosDisponibles: 0, plan: 'basico' })
  
  // Formulario
  const [formData, setFormData] = useState({
    estadoCentroTrabajo: '',
    municipioCentroTrabajo: '',
    direccionCentroTrabajo: '',
    coordenadas: null as { lat: number; lng: number } | null,
    referenciaUbicacion: '',
    industriaPatronClave: 'ninguna',
    objetoSolicitud: 'despido' as 'despido' | 'rescision' | 'pago_prestaciones' | 'terminacion_voluntaria' | 'otro',
    fechaConflicto: ''
  })
  
  // Resultado de jurisdiccion
  const [jurisdiccion, setJurisdiccion] = useState<{
    competencia: 'federal' | 'local'
    centroConciliacion: {
      id: string
      nombre: string
      direccion: string
      portalUrl: string
      horario: string
    }
    estado: string
    claveEstado: string
  } | null>(null)
  
  // Resultado final
  const [resultado, setResultado] = useState<{
    folio?: string
    citaRatificacion?: string
    pdfUrl?: string
  } | null>(null)

  useEffect(() => {
    if (!casoId) {
      setError('No se especifico un caso')
      setLoading(false)
      return
    }
    
    async function cargarDatos() {
      try {
        const [casosRes, industriasRes] = await Promise.all([
          obtenerDatosCasoParaCCL(casoId),
          getIndustriasFederales()
        ])
        
        if (casosRes.error) {
          setError(casosRes.error)
          return
        }
        
        setCaso(casosRes.data?.caso || null)
        setTrabajador(casosRes.data?.trabajador || null)
        setIndustrias(industriasRes.data || [])
        
        // Pre-llenar datos del caso si existen
        if (casosRes.data?.caso) {
          const c = casosRes.data.caso
          setFormData(prev => ({
            ...prev,
            fechaConflicto: c.fecha_separacion || '',
            objetoSolicitud: c.motivo_separacion === 'despido' ? 'despido' : 
                            c.motivo_separacion === 'renuncia' ? 'rescision' : 'despido'
          }))
        }
        
        // Verificar creditos del abogado
        const creditosRes = await verificarCreditosDisponibles(casosRes.data?.caso?.abogado_asignado || '')
        setCreditos(creditosRes)
        
      } catch {
        setError('Error al cargar datos del caso')
      } finally {
        setLoading(false)
      }
    }
    
    cargarDatos()
  }, [casoId])

  const handleDeterminarJurisdiccion = async () => {
    if (!formData.estadoCentroTrabajo || !formData.direccionCentroTrabajo) {
      setError('Complete la ubicacion del centro de trabajo')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const result = await determinarCCL({
        estadoCentroTrabajo: formData.estadoCentroTrabajo,
        municipioCentroTrabajo: formData.municipioCentroTrabajo,
        direccionCentroTrabajo: formData.direccionCentroTrabajo,
        coordenadas: formData.coordenadas || undefined,
        industriaPatronClave: formData.industriaPatronClave
      })
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      setJurisdiccion(result.data)
      setPaso(3)
    } catch {
      setError('Error al determinar jurisdiccion')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerarAutomatico = async () => {
    if (!jurisdiccion || !caso || !trabajador) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      // Crear borrador
      const borrador = await crearBorradorSolicitudCCL({
        casoId: casoId!,
        abogadoId: (caso as Record<string, string>).abogado_asignado,
        trabajadorId: (trabajador as Record<string, string>).id,
        competencia: jurisdiccion.competencia,
        industriaFederal: formData.industriaPatronClave !== 'ninguna' ? formData.industriaPatronClave : undefined,
        estadoCCL: jurisdiccion.estado,
        municipioCCL: formData.municipioCentroTrabajo,
        centroConciliacionId: jurisdiccion.centroConciliacion.id,
        direccionCentroTrabajo: formData.direccionCentroTrabajo,
        coordenadasTrabajo: formData.coordenadas || undefined,
        referenciaUbicacion: formData.referenciaUbicacion,
        objetoSolicitud: formData.objetoSolicitud,
        fechaConflicto: formData.fechaConflicto
      })
      
      if (borrador.error) {
        setError(borrador.error)
        return
      }
      
      // Generar automaticamente
      const result = await generarSolicitudAutomatica(borrador.data.id)
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      setResultado({
        folio: result.data?.folio,
        citaRatificacion: result.data?.citaRatificacion
      })
      setPaso(4)
      
    } catch {
      setError('Error al generar solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerarGuia = async () => {
    if (!jurisdiccion || !caso || !trabajador) return
    
    setSubmitting(true)
    setError(null)
    
    try {
      // Crear borrador
      const borrador = await crearBorradorSolicitudCCL({
        casoId: casoId!,
        abogadoId: (caso as Record<string, string>).abogado_asignado,
        trabajadorId: (trabajador as Record<string, string>).id,
        competencia: jurisdiccion.competencia,
        industriaFederal: formData.industriaPatronClave !== 'ninguna' ? formData.industriaPatronClave : undefined,
        estadoCCL: jurisdiccion.estado,
        municipioCCL: formData.municipioCentroTrabajo,
        centroConciliacionId: jurisdiccion.centroConciliacion.id,
        direccionCentroTrabajo: formData.direccionCentroTrabajo,
        coordenadasTrabajo: formData.coordenadas || undefined,
        referenciaUbicacion: formData.referenciaUbicacion,
        objetoSolicitud: formData.objetoSolicitud,
        fechaConflicto: formData.fechaConflicto
      })
      
      if (borrador.error) {
        setError(borrador.error)
        return
      }
      
      // Generar guia manual
      await generarGuiaManual(borrador.data.id)
      
      setResultado({ pdfUrl: '/api/ccl/guia-pdf?id=' + borrador.data.id })
      setPaso(4)
      
    } catch {
      setError('Error al generar guia')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!casoId || !caso) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error || 'No se encontro el caso especificado'}
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/oficina-virtual">Volver a la oficina</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/oficina-virtual/casos/${casoId}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Generar Solicitud CCL</h1>
          <p className="text-muted-foreground">
            Centro de Conciliacion Laboral - Solicitud automatica o guia de llenado
          </p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center justify-between mb-8">
        {PASOS.map((p, idx) => (
          <div key={p.id} className="flex items-center">
            <div className={`flex items-center gap-2 ${paso >= p.id ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                paso > p.id ? 'bg-primary text-primary-foreground' :
                paso === p.id ? 'bg-primary/20 text-primary border-2 border-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {paso > p.id ? <CheckCircle2 className="w-5 h-5" /> : <p.icono className="w-5 h-5" />}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{p.titulo}</span>
            </div>
            {idx < PASOS.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 mx-2 ${paso > p.id ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Paso 1: Ubicacion del centro de trabajo */}
      {paso === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicacion del centro de trabajo
            </CardTitle>
            <CardDescription>
              Ingrese la direccion donde el trabajador laboraba. Esta ubicacion determina la jurisdiccion del CCL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Importante:</strong> Use la direccion del centro de trabajo, no el domicilio fiscal del patron.
                Esto evita que la solicitud se genere en una jurisdiccion incorrecta.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado donde laboraba *</Label>
                <Select 
                  value={formData.estadoCentroTrabajo}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, estadoCentroTrabajo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ESTADOS_MEXICO).map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio">Municipio / Alcaldia</Label>
                <Input
                  id="municipio"
                  value={formData.municipioCentroTrabajo}
                  onChange={(e) => setFormData(prev => ({ ...prev, municipioCentroTrabajo: e.target.value }))}
                  placeholder="Ej: Benito Juarez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Direccion completa del centro de trabajo *</Label>
              <Textarea
                id="direccion"
                value={formData.direccionCentroTrabajo}
                onChange={(e) => setFormData(prev => ({ ...prev, direccionCentroTrabajo: e.target.value }))}
                placeholder="Calle, numero, colonia, codigo postal"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencias">Referencias adicionales (opcional)</Label>
              <Input
                id="referencias"
                value={formData.referenciaUbicacion}
                onChange={(e) => setFormData(prev => ({ ...prev, referenciaUbicacion: e.target.value }))}
                placeholder="Ej: Frente al centro comercial X, entre calles Y y Z"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setPaso(2)}
                disabled={!formData.estadoCentroTrabajo || !formData.direccionCentroTrabajo}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Industria del patron */}
      {paso === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Industria del patron
            </CardTitle>
            <CardDescription>
              Seleccione la actividad principal del patron para determinar si la competencia es federal o local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Si el patron pertenece a alguna de las 25 industrias federales, la competencia sera del 
                <strong> Centro Federal de Conciliacion</strong>. De lo contrario, sera del CCL estatal.
              </AlertDescription>
            </Alert>

            <RadioGroup
              value={formData.industriaPatronClave}
              onValueChange={(v) => setFormData(prev => ({ ...prev, industriaPatronClave: v }))}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/50">
                <RadioGroupItem value="ninguna" id="ninguna" />
                <Label htmlFor="ninguna" className="flex-1 cursor-pointer">
                  <span className="font-medium">Ninguna de las industrias federales</span>
                  <span className="block text-sm text-muted-foreground">
                    Competencia LOCAL - CCL del estado donde laboraba
                  </span>
                </Label>
                <Badge variant="outline">Local</Badge>
              </div>

              <Separator />
              <p className="text-sm font-medium text-muted-foreground">Industrias de competencia federal:</p>

              {industrias.map(ind => (
                <div key={ind.clave} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/30">
                  <RadioGroupItem value={ind.clave} id={ind.clave} className="mt-1" />
                  <Label htmlFor={ind.clave} className="flex-1 cursor-pointer">
                    <span className="font-medium">{ind.nombre}</span>
                    <span className="block text-sm text-muted-foreground">{ind.descripcion}</span>
                    {ind.ejemplos && ind.ejemplos.length > 0 && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Ejemplos: {ind.ejemplos.join(', ')}
                      </span>
                    )}
                  </Label>
                  <Badge>Federal</Badge>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setPaso(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atras
              </Button>
              <Button onClick={handleDeterminarJurisdiccion} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Determinar CCL
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Detalles y seleccion de metodo */}
      {paso === 3 && jurisdiccion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles de la solicitud
            </CardTitle>
            <CardDescription>
              Complete los datos de la solicitud y seleccione el metodo de generacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resultado de jurisdiccion */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Centro de Conciliacion determinado:</span>
                <Badge variant={jurisdiccion.competencia === 'federal' ? 'default' : 'secondary'}>
                  {jurisdiccion.competencia.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{jurisdiccion.centroConciliacion.nombre}</p>
                <p className="text-muted-foreground">{jurisdiccion.centroConciliacion.direccion}</p>
                <p className="text-muted-foreground">{jurisdiccion.centroConciliacion.horario}</p>
              </div>
            </div>

            {/* Datos de la solicitud */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="objeto">Objeto de la solicitud *</Label>
                <Select 
                  value={formData.objetoSolicitud}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    objetoSolicitud: v as typeof formData.objetoSolicitud 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJETOS_SOLICITUD.map(obj => (
                      <SelectItem key={obj.value} value={obj.value}>{obj.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaConflicto">Fecha del conflicto *</Label>
                <Input
                  id="fechaConflicto"
                  type="date"
                  value={formData.fechaConflicto}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaConflicto: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Seleccion de metodo */}
            <div className="space-y-4">
              <h3 className="font-medium">Seleccione metodo de generacion:</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Opcion automatica */}
                <Card className={`cursor-pointer transition-all ${
                  creditos.tieneCreditos ? 'hover:border-primary' : 'opacity-60'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Llenado Automatico</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          El sistema llena el formulario oficial y genera el PDF.
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>- Llena formulario SINACOL</li>
                          <li>- Genera solicitud oficial</li>
                          <li>- PDF guardado en boveda</li>
                          <li>- Agenda cita ratificacion</li>
                        </ul>
                        <div className="mt-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">
                            {creditos.tieneCreditos 
                              ? `${creditos.creditosDisponibles} creditos disponibles`
                              : 'Sin creditos'
                            }
                          </span>
                        </div>
                        <Button 
                          className="w-full mt-3" 
                          disabled={!creditos.tieneCreditos || submitting || !formData.fechaConflicto}
                          onClick={handleGenerarAutomatico}
                        >
                          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Usar 1 credito
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Opcion manual */}
                <Card className="cursor-pointer hover:border-primary transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileDown className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Guia de Llenado Manual</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          PDF con datos prellenados para copiar al portal.
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>- PDF con todos los datos</li>
                          <li>- Instrucciones paso a paso</li>
                          <li>- Link al portal CCL</li>
                          <li>- Sin costo</li>
                        </ul>
                        <div className="mt-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">Ilimitado</span>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-3 bg-transparent"
                          disabled={submitting || !formData.fechaConflicto}
                          onClick={handleGenerarGuia}
                        >
                          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Descargar guia
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setPaso(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atras
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Confirmacion */}
      {paso === 4 && resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              Solicitud generada exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {resultado.folio && (
              <div className="p-4 rounded-lg border bg-green-50">
                <p className="text-sm text-muted-foreground">Folio de pre-registro:</p>
                <p className="text-2xl font-bold text-green-700">{resultado.folio}</p>
              </div>
            )}

            {resultado.citaRatificacion && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium">Cita de ratificacion:</span>
                </div>
                <p className="text-lg">
                  {new Date(resultado.citaRatificacion).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {jurisdiccion?.centroConciliacion.nombre}
                </p>
                <p className="text-sm text-muted-foreground">
                  {jurisdiccion?.centroConciliacion.direccion}
                </p>
              </div>
            )}

            {resultado.pdfUrl && (
              <div className="p-4 rounded-lg border">
                <p className="font-medium mb-2">Guia de llenado generada:</p>
                <Button asChild>
                  <a href={resultado.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </a>
                </Button>
              </div>
            )}

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {resultado.folio 
                  ? 'Recuerde que debe ratificar la solicitud en persona dentro de los 5 dias habiles siguientes.'
                  : 'Use la guia para llenar manualmente el formulario en el portal del CCL.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href={`/oficina-virtual/casos/${casoId}`}>
                  Volver al caso
                </Link>
              </Button>
              {jurisdiccion?.centroConciliacion.portalUrl && (
                <Button asChild>
                  <a href={jurisdiccion.centroConciliacion.portalUrl} target="_blank" rel="noopener noreferrer">
                    Abrir portal CCL
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
