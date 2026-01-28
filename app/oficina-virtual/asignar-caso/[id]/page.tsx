'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Scale,
  UserCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { asignarCaso, getAbogadosDisponibles } from '../../actions'

interface CasoDetalle {
  id: string
  folio: string
  empresa_nombre: string
  empresa_rfc: string | null
  ciudad: string | null
  estado: string | null
  monto_estimado: number | null
  fecha_despido: string | null
  motivo_separacion: string | null
  hechos_despido: string | null
  puesto_trabajo: string | null
  tipo_jornada: string | null
  tipo_contrato: string | null
  categoria: string
  status: string
  created_at: string
  calculo?: {
    antiguedad_anios: number
    antiguedad_meses: number
    total_conciliacion: number
    total_juicio: number
    salario_diario: number
  }
  trabajador?: {
    id: string
    full_name: string
    email: string
    phone: string
    curp: string | null
    identificacion_verificada: boolean
  }
}

interface Abogado {
  id: string
  full_name: string
  email: string
  phone?: string
}

export default function AsignarCasoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [caso, setCaso] = useState<CasoDetalle | null>(null)
  const [abogados, setAbogados] = useState<Abogado[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  
  // Form state
  const [selectedAbogado, setSelectedAbogado] = useState<string>('')
  const [tipoCaso, setTipoCaso] = useState<'despido' | 'rescision'>('despido')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado')
      setLoading(false)
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    setUserRole(profile?.role || '')
    setUserId(user.id)
    
    // Si es abogado, auto-seleccionar
    if (profile?.role === 'lawyer') {
      setSelectedAbogado(user.id)
    }
    
    // Obtener caso
    const { data: casoData, error: casoError } = await supabase
      .from('casos')
      .select(`
        *,
        calculo:calculos_liquidacion(
          antiguedad_anios, antiguedad_meses, 
          total_conciliacion, total_juicio, salario_diario
        )
      `)
      .eq('id', id)
      .single()
    
    if (casoError || !casoData) {
      setError('Caso no encontrado')
      setLoading(false)
      return
    }
    
    // Obtener trabajador por separado
    if (casoData.worker_id) {
      const { data: trabajador } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, curp, identificacion_verificada')
        .eq('id', casoData.worker_id)
        .single()
      
      casoData.trabajador = trabajador
    }
    
    setCaso(casoData as CasoDetalle)
    
    // Determinar tipo de caso inicial
    if (casoData.motivo_separacion === 'rescision_trabajador') {
      setTipoCaso('rescision')
    }
    
    // Obtener abogados disponibles
    const abogadosResult = await getAbogadosDisponibles()
    if (!abogadosResult.error && abogadosResult.data) {
      setAbogados(abogadosResult.data as Abogado[])
    }
    
    setLoading(false)
  }

  async function handleAsignar() {
    if (!selectedAbogado) {
      setError('Selecciona un abogado')
      return
    }
    
    setSaving(true)
    setError(null)
    
    const result = await asignarCaso(id, selectedAbogado, {
      tipo_caso: tipoCaso,
      notas: notas || undefined
    })
    
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    
    router.push('/oficina-virtual?tab=casos')
    router.refresh()
  }

  const diasPrescripcion = tipoCaso === 'rescision' ? 30 : 60
  const fechaLimite = caso?.fecha_despido 
    ? new Date(new Date(caso.fecha_despido).getTime() + diasPrescripcion * 24 * 60 * 60 * 1000)
    : null
  const diasRestantes = fechaLimite 
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

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
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Caso no encontrado</h2>
            <Button asChild>
              <Link href="/oficina-virtual">Volver</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLawyer = userRole === 'lawyer'
  const canAssignOthers = ['admin', 'superadmin'].includes(userRole)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/oficina-virtual" className="p-2 hover:bg-muted rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-bold text-lg">Asignar Caso</h1>
                <p className="text-xs text-muted-foreground font-mono">{caso.folio}</p>
              </div>
            </div>
            <Badge className={
              caso.categoria === 'nuevo' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-yellow-100 text-yellow-700'
            }>
              {caso.categoria === 'nuevo' ? 'Nuevo' : 'Por preaprobar'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        
        {/* Datos de la Empresa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Datos de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">{caso.empresa_nombre}</p>
              {caso.empresa_rfc && (
                <p className="text-sm text-muted-foreground font-mono">RFC: {caso.empresa_rfc}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{caso.ciudad}, {caso.estado}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Puesto</p>
                <p className="font-medium">{caso.puesto_trabajo || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo Contrato</p>
                <p className="font-medium capitalize">{caso.tipo_contrato?.replace('_', ' ') || 'No especificado'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Datos del Trabajador */}
        {caso.trabajador && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos del Trabajador
                {caso.trabajador.identificacion_verificada ? (
                  <Badge className="bg-green-100 text-green-700 ml-auto">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 ml-auto">
                    Pendiente verificacion
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{caso.trabajador.full_name || 'Sin nombre'}</p>
              <p className="text-sm text-muted-foreground">{caso.trabajador.email}</p>
              {caso.trabajador.phone && (
                <p className="text-sm text-muted-foreground">Tel: {caso.trabajador.phone}</p>
              )}
              {caso.trabajador.curp && (
                <p className="text-sm font-mono">CURP: {caso.trabajador.curp}</p>
              )}
              
              {!caso.trabajador.identificacion_verificada && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                  <p className="text-sm text-amber-800">
                    Este usuario aun no ha sido verificado. Puedes asignar el caso pero se recomienda verificar primero.
                  </p>
                  <Button variant="outline" size="sm" asChild className="mt-2 bg-transparent">
                    <Link href={`/oficina-virtual/verificar-usuario/${caso.trabajador.id}`}>
                      Verificar usuario
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Datos Financieros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Datos del Calculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Estimado Conciliacion</p>
                <p className="text-xl font-bold text-green-700">
                  ${(caso.calculo?.total_conciliacion || caso.monto_estimado || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Estimado Juicio</p>
                <p className="text-xl font-bold text-blue-700">
                  ${(caso.calculo?.total_juicio || 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            {caso.calculo && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Salario Diario</p>
                  <p className="font-semibold">${caso.calculo.salario_diario?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Antiguedad</p>
                  <p className="font-semibold">
                    {caso.calculo.antiguedad_anios || 0}a {caso.calculo.antiguedad_meses || 0}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha Despido</p>
                  <p className="font-semibold">
                    {caso.fecha_despido ? new Date(caso.fecha_despido).toLocaleDateString('es-MX') : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Hechos del Despido */}
        {caso.hechos_despido && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Hechos del Despido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {caso.hechos_despido}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Formulario de Asignacion */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Asignar Caso
            </CardTitle>
            <CardDescription>
              {isLawyer 
                ? 'Toma este caso para representar al trabajador'
                : 'Selecciona el abogado que llevara este caso'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Caso */}
            <div className="space-y-3">
              <Label>Tipo de Caso *</Label>
              <RadioGroup 
                value={tipoCaso} 
                onValueChange={(v) => setTipoCaso(v as 'despido' | 'rescision')}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer ${tipoCaso === 'despido' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="despido" id="despido" />
                  <Label htmlFor="despido" className="cursor-pointer flex-1">
                    <span className="font-medium">Despido</span>
                    <p className="text-xs text-muted-foreground">60 dias para prescripcion</p>
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer ${tipoCaso === 'rescision' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="rescision" id="rescision" />
                  <Label htmlFor="rescision" className="cursor-pointer flex-1">
                    <span className="font-medium">Rescision</span>
                    <p className="text-xs text-muted-foreground">30 dias para prescripcion</p>
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Indicador de Prescripcion */}
              {diasRestantes !== null && (
                <div className={`p-3 rounded-lg flex items-center gap-3 ${
                  diasRestantes <= 7 ? 'bg-red-50 border border-red-200' :
                  diasRestantes <= 15 ? 'bg-orange-50 border border-orange-200' :
                  diasRestantes <= 30 ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <Clock className={`w-5 h-5 ${
                    diasRestantes <= 7 ? 'text-red-600' :
                    diasRestantes <= 15 ? 'text-orange-600' :
                    diasRestantes <= 30 ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {diasRestantes > 0 
                        ? `${diasRestantes} dias restantes para prescripcion`
                        : diasRestantes === 0
                        ? 'PRESCRIBE HOY'
                        : `PRESCRITO hace ${Math.abs(diasRestantes)} dias`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fecha limite: {fechaLimite?.toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Seleccion de Abogado */}
            {canAssignOthers ? (
              <div className="space-y-2">
                <Label>Asignar a Abogado *</Label>
                <Select value={selectedAbogado} onValueChange={setSelectedAbogado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar abogado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {abogados.map((abogado) => (
                      <SelectItem key={abogado.id} value={abogado.id}>
                        {abogado.full_name || abogado.email}
                        {abogado.id === userId && ' (Yo)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : isLawyer ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Este caso sera asignado a tu cuenta.</span>
                  <br />
                  <span className="text-muted-foreground">
                    Como abogado, solo puedes tomar casos para ti mismo.
                  </span>
                </p>
              </div>
            ) : null}
            
            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas del caso (opcional)</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones iniciales, estrategia, etc..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Boton de Accion */}
        <div className="sticky bottom-4">
          <Button 
            className="w-full h-12 text-base"
            onClick={handleAsignar}
            disabled={saving || !selectedAbogado}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Briefcase className="w-5 h-5 mr-2" />
            )}
            {isLawyer ? 'Tomar este Caso' : 'Asignar Caso'}
          </Button>
        </div>
      </main>
    </div>
  )
}
