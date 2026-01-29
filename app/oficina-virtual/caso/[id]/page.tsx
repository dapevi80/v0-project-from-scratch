'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, User, Building2, FileText, Calendar, MessageSquare, 
  CheckCircle, AlertTriangle, ExternalLink, Copy, Check, Video,
  DollarSign, Clock, MapPin, Briefcase, Shield, Scale
} from 'lucide-react'
import { 
  getCaseFullDetails, 
  getCentrosConciliacion,
  verifyWorkerIdentity,
  updateCaseConciliationData,
  updateOfertaEmpresa,
  saveAudienciaVirtual,
  sugerirJurisdiccion,
  getCaseHistory
} from '../../actions'
import { CCLPortalTab } from '@/components/caso/ccl-portal-tab'

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  open: 'Abierto',
  assigned: 'Asignado',
  in_progress: 'En Proceso',
  conciliation: 'En Conciliación',
  trial: 'En Juicio',
  won: 'Ganado',
  lost: 'Perdido',
  settled: 'Convenio',
  closed: 'Cerrado'
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  open: 'bg-blue-500',
  assigned: 'bg-indigo-500',
  in_progress: 'bg-yellow-500',
  conciliation: 'bg-orange-500',
  trial: 'bg-red-500',
  won: 'bg-green-500',
  lost: 'bg-gray-600',
  settled: 'bg-teal-500',
  closed: 'bg-gray-400'
}

export default function CasoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const casoId = params.id as string
  
  const [caso, setCaso] = useState<any>(null)
  const [centros, setCentros] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('resumen')
  
  // Form states
  const [curpForm, setCurpForm] = useState({ curp: '', tipo_identificacion: 'ine', numero_identificacion: '' })
  const [ofertaForm, setOfertaForm] = useState('')
  const [audienciaForm, setAudienciaForm] = useState({ link: '', plataforma: 'zoom', password: '', fecha: '' })
  const [conciliacionForm, setConciliacionForm] = useState<any>({})
  
  useEffect(() => {
    loadData()
  }, [casoId])
  
  async function loadData() {
    setLoading(true)
    const [casoRes, centrosRes, historialRes] = await Promise.all([
      getCaseFullDetails(casoId),
      getCentrosConciliacion(),
      getCaseHistory(casoId)
    ])
    
    if (casoRes.data) {
      setCaso(casoRes.data)
      setConciliacionForm({
        jurisdiccion: casoRes.data.jurisdiccion || 'estatal',
        centro_conciliacion_id: casoRes.data.centro_conciliacion_id || '',
        numero_expediente_conciliacion: casoRes.data.numero_expediente_conciliacion || '',
        direccion_trabajo_estado: casoRes.data.direccion_trabajo_estado || casoRes.data.estado || '',
        puesto_trabajo: casoRes.data.puesto_trabajo || '',
        tipo_jornada: casoRes.data.tipo_jornada || '',
        motivo_separacion: casoRes.data.motivo_separacion || 'despido_injustificado',
        hechos_despido: casoRes.data.hechos_despido || ''
      })
      setOfertaForm(casoRes.data.oferta_empresa?.toString() || '')
    }
    if (centrosRes.data) setCentros(centrosRes.data)
    if (historialRes.data) setHistorial(historialRes.data)
    setLoading(false)
  }
  
  async function handleVerifyIdentity() {
    if (!curpForm.curp || !curpForm.numero_identificacion) return
    setSaving(true)
    const result = await verifyWorkerIdentity(caso.worker.id, {
      curp: curpForm.curp,
      tipo_identificacion: curpForm.tipo_identificacion as any,
      numero_identificacion: curpForm.numero_identificacion
    })
    if (!result.error) {
      loadData()
    }
    setSaving(false)
  }
  
  async function handleUpdateOferta() {
    if (!ofertaForm) return
    setSaving(true)
    await updateOfertaEmpresa(casoId, parseFloat(ofertaForm))
    loadData()
    setSaving(false)
  }
  
  async function handleSaveAudiencia() {
    if (!audienciaForm.link || !audienciaForm.fecha) return
    setSaving(true)
    await saveAudienciaVirtual(casoId, {
      link: audienciaForm.link,
      plataforma: audienciaForm.plataforma as any,
      password: audienciaForm.password,
      fecha_audiencia: audienciaForm.fecha
    })
    loadData()
    setSaving(false)
  }
  
  async function handleSaveConciliacion() {
    setSaving(true)
    await updateCaseConciliationData(casoId, conciliacionForm)
    loadData()
    setSaving(false)
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  function formatCurrency(amount: number | null) {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
  
  if (!caso) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Caso no encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/oficina-virtual">Volver</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const worker = caso.worker || {}
  const calculo = caso.calculo || {}
  const porcentajeOferta = caso.oferta_empresa && caso.monto_estimado 
    ? Math.round((caso.oferta_empresa / caso.monto_estimado) * 100)
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{caso.folio}</h1>
              <Badge className={statusColors[caso.status]}>{statusLabels[caso.status]}</Badge>
              {caso.prioridad === 'urgente' && <Badge variant="destructive">Urgente</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{caso.empresa_nombre}</p>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Monto Estimado</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(caso.monto_estimado)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Oferta Empresa</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold">{formatCurrency(caso.oferta_empresa)}</p>
                {porcentajeOferta && (
                  <span className={`text-xs ${porcentajeOferta >= 70 ? 'text-green-600' : porcentajeOferta >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    ({porcentajeOferta}%)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Antiguedad</p>
              <p className="text-xl font-bold">{calculo.antiguedad_anios || 0} años</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Honorarios</p>
              <p className="text-xl font-bold">{caso.porcentaje_honorarios || 30}%</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="trabajador">Trabajador</TabsTrigger>
            <TabsTrigger value="conciliacion">Conciliación</TabsTrigger>
            <TabsTrigger value="audiencias">Audiencias</TabsTrigger>
            <TabsTrigger value="ccl">Portal CCL</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          
          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Datos de la Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Datos de la Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Razón Social:</span>
                    <span className="font-medium">{caso.empresa_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFC:</span>
                    <span className="font-mono">{caso.empresa_rfc || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ciudad:</span>
                    <span>{caso.ciudad || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span>{caso.estado || '-'}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Liquidación Calculada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Scale className="h-4 w-4" />
                    Liquidación Calculada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conciliación:</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculo.total_conciliacion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juicio:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculo.total_juicio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salario Diario:</span>
                    <span>{formatCurrency(calculo.salario_diario)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periodo:</span>
                    <span>{calculo.fecha_ingreso} - {calculo.fecha_salida}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Actualizar Oferta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Oferta de la Empresa
                </CardTitle>
                <CardDescription>Solo el abogado asignado puede registrar ofertas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Monto de la oferta"
                    value={ofertaForm}
                    onChange={(e) => setOfertaForm(e.target.value)}
                  />
                  <Button onClick={handleUpdateOferta} disabled={saving}>
                    {saving ? 'Guardando...' : 'Actualizar Oferta'}
                  </Button>
                </div>
                {caso.oferta_empresa_fecha && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Última actualización: {new Date(caso.oferta_empresa_fecha).toLocaleDateString('es-MX')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Trabajador */}
          <TabsContent value="trabajador" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Datos Personales del Trabajador
                </CardTitle>
                {worker.identificacion_verificada && (
                  <Badge className="bg-green-600 w-fit">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Identidad Verificada
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">{worker.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{worker.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{worker.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CURP</p>
                    <p className="font-mono font-medium">{worker.curp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RFC</p>
                    <p className="font-mono font-medium">{worker.rfc || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NSS</p>
                    <p className="font-mono font-medium">{worker.nss || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha Nacimiento</p>
                    <p className="font-medium">{worker.fecha_nacimiento || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sexo</p>
                    <p className="font-medium capitalize">{worker.sexo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estado Civil</p>
                    <p className="font-medium capitalize">{worker.estado_civil?.replace('_', ' ') || '-'}</p>
                  </div>
                </div>
                
                {/* Dirección */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Domicilio</p>
                  <p className="text-sm text-muted-foreground">
                    {worker.calle ? `${worker.calle} ${worker.numero_exterior || ''}${worker.numero_interior ? ' Int. ' + worker.numero_interior : ''}, ${worker.colonia || ''}, ${worker.municipio || ''}, ${worker.estado || ''} CP ${worker.codigo_postal || ''}` : 'No registrado'}
                  </p>
                </div>
                
                {/* Verificar Identidad */}
                {!worker.identificacion_verificada && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium">Verificar Identidad</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label>CURP</Label>
                        <Input
                          placeholder="CURP del trabajador"
                          value={curpForm.curp}
                          onChange={(e) => setCurpForm({ ...curpForm, curp: e.target.value.toUpperCase() })}
                          maxLength={18}
                        />
                      </div>
                      <div>
                        <Label>Tipo de Identificación</Label>
                        <Select value={curpForm.tipo_identificacion} onValueChange={(v) => setCurpForm({ ...curpForm, tipo_identificacion: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ine">INE</SelectItem>
                            <SelectItem value="pasaporte">Pasaporte</SelectItem>
                            <SelectItem value="cedula_profesional">Cédula Profesional</SelectItem>
                            <SelectItem value="cartilla_militar">Cartilla Militar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Número de Identificación</Label>
                        <Input
                          placeholder="Clave de elector / No. Pasaporte"
                          value={curpForm.numero_identificacion}
                          onChange={(e) => setCurpForm({ ...curpForm, numero_identificacion: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleVerifyIdentity} disabled={saving} className="mt-3">
                      {saving ? 'Verificando...' : 'Verificar Identidad'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Conciliación */}
          <TabsContent value="conciliacion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4" />
                  Datos para Solicitud de Conciliación
                </CardTitle>
                <CardDescription>
                  Información requerida para llenar el formulario del Centro de Conciliación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Jurisdicción */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Jurisdicción</Label>
                    <Select 
                      value={conciliacionForm.jurisdiccion} 
                      onValueChange={(v) => setConciliacionForm({ ...conciliacionForm, jurisdiccion: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="federal">Federal (CFCRL)</SelectItem>
                        <SelectItem value="estatal">Estatal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Centro de Conciliación</Label>
                    <Select 
                      value={conciliacionForm.centro_conciliacion_id} 
                      onValueChange={(v) => setConciliacionForm({ ...conciliacionForm, centro_conciliacion_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar centro" />
                      </SelectTrigger>
                      <SelectContent>
                        {centros.filter(c => conciliacionForm.jurisdiccion === 'federal' ? c.tipo === 'federal' : c.tipo === 'estatal').map(centro => (
                          <SelectItem key={centro.id} value={centro.id}>
                            {centro.nombre} - {centro.estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Link al formulario oficial */}
                {conciliacionForm.centro_conciliacion_id && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    {centros.find(c => c.id === conciliacionForm.centro_conciliacion_id)?.url_formulario ? (
                      <a 
                        href={centros.find(c => c.id === conciliacionForm.centro_conciliacion_id)?.url_formulario}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir formulario oficial del Centro de Conciliación
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Este centro no tiene formulario en línea registrado
                      </p>
                    )}
                  </div>
                )}
                
                {/* Expediente */}
                <div>
                  <Label>Número de Expediente (si ya existe)</Label>
                  <Input
                    placeholder="Ej: CCL/QR/2024/00123"
                    value={conciliacionForm.numero_expediente_conciliacion}
                    onChange={(e) => setConciliacionForm({ ...conciliacionForm, numero_expediente_conciliacion: e.target.value })}
                  />
                </div>
                
                {/* Datos laborales */}
                <div className="pt-4 border-t">
                  <p className="font-medium mb-3">Datos del Empleo</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Puesto de Trabajo</Label>
                      <Input
                        placeholder="Ej: Operador de producción"
                        value={conciliacionForm.puesto_trabajo}
                        onChange={(e) => setConciliacionForm({ ...conciliacionForm, puesto_trabajo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo de Jornada</Label>
                      <Select 
                        value={conciliacionForm.tipo_jornada} 
                        onValueChange={(v) => setConciliacionForm({ ...conciliacionForm, tipo_jornada: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diurna">Diurna</SelectItem>
                          <SelectItem value="nocturna">Nocturna</SelectItem>
                          <SelectItem value="mixta">Mixta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Motivo de Separación</Label>
                      <Select 
                        value={conciliacionForm.motivo_separacion} 
                        onValueChange={(v) => setConciliacionForm({ ...conciliacionForm, motivo_separacion: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="despido_injustificado">Despido Injustificado</SelectItem>
                          <SelectItem value="renuncia">Renuncia</SelectItem>
                          <SelectItem value="rescision_patron">Rescisión por Patrón</SelectItem>
                          <SelectItem value="rescision_trabajador">Rescisión por Trabajador</SelectItem>
                          <SelectItem value="mutuo_acuerdo">Mutuo Acuerdo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estado donde trabajó</Label>
                      <Input
                        placeholder="Ej: Quintana Roo"
                        value={conciliacionForm.direccion_trabajo_estado}
                        onChange={(e) => setConciliacionForm({ ...conciliacionForm, direccion_trabajo_estado: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Hechos */}
                <div>
                  <Label>Hechos del Despido</Label>
                  <Textarea
                    placeholder="Describa los hechos que motivaron la separación laboral..."
                    value={conciliacionForm.hechos_despido}
                    onChange={(e) => setConciliacionForm({ ...conciliacionForm, hechos_despido: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <Button onClick={handleSaveConciliacion} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Datos de Conciliación'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Audiencias */}
          <TabsContent value="audiencias" className="space-y-4">
            {/* Audiencia Virtual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Video className="h-4 w-4" />
                  Audiencia Virtual
                </CardTitle>
                <CardDescription>
                  Guarda los links de las audiencias virtuales de conciliación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {caso.link_audiencia_virtual ? (
                  <div className="p-4 bg-green-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Link de Audiencia Activo</p>
                      <Badge>{caso.plataforma_audiencia?.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input value={caso.link_audiencia_virtual} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(caso.link_audiencia_virtual)}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button asChild>
                        <a href={caso.link_audiencia_virtual} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir
                        </a>
                      </Button>
                    </div>
                    {caso.password_audiencia && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Contraseña:</span> {caso.password_audiencia}
                      </p>
                    )}
                    {caso.fecha_proxima_audiencia && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Fecha:</span> {new Date(caso.fecha_proxima_audiencia).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay audiencia virtual programada</p>
                )}
                
                <div className="pt-4 border-t">
                  <p className="font-medium mb-3">Agregar/Actualizar Audiencia</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Link de la Audiencia</Label>
                      <Input
                        placeholder="https://zoom.us/j/..."
                        value={audienciaForm.link}
                        onChange={(e) => setAudienciaForm({ ...audienciaForm, link: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Plataforma</Label>
                      <Select value={audienciaForm.plataforma} onValueChange={(v) => setAudienciaForm({ ...audienciaForm, plataforma: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="webex">Webex</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Contraseña (opcional)</Label>
                      <Input
                        placeholder="Contraseña de la reunión"
                        value={audienciaForm.password}
                        onChange={(e) => setAudienciaForm({ ...audienciaForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Fecha y Hora</Label>
                      <Input
                        type="datetime-local"
                        value={audienciaForm.fecha}
                        onChange={(e) => setAudienciaForm({ ...audienciaForm, fecha: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveAudiencia} disabled={saving} className="mt-3">
                    {saving ? 'Guardando...' : 'Guardar Audiencia'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Lista de Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Eventos Programados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caso.case_events?.length > 0 ? (
                  <div className="space-y-3">
                    {caso.case_events.sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()).map((event: any) => (
                      <div key={event.id || event.starts_at} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${event.event_type === 'audiencia' ? 'bg-red-500' : event.event_type === 'cita' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.starts_at).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay eventos programados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Portal CCL */}
          <TabsContent value="ccl" className="space-y-4">
            <CCLPortalTab casoId={casoId} caso={caso} worker={worker} onRefresh={loadData} />
          </TabsContent>
          
          {/* Tab: Historial */}
          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Historial del Caso
                </CardTitle>
                <CardDescription>
                  Todas las acciones y respuestas registradas desde el inicio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historial.length > 0 ? (
                  <div className="space-y-4">
                    {historial.map((item, idx) => (
                      <div key={item.id || idx} className="flex gap-3 pb-4 border-b last:border-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{item.action?.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          {item.details && (
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(item.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay historial registrado</p>
                )}
              </CardContent>
            </Card>
            
            {/* Respuestas del Cuestionario */}
            {caso.respuestas_cuestionario && Object.keys(caso.respuestas_cuestionario).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Respuestas del Cuestionario Inicial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    {Object.entries(caso.respuestas_cuestionario).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b last:border-0">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
