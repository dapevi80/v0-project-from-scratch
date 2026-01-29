'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Save, 
  Mail, 
  Phone, 
  Loader2, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Camera,
  User,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Edit3,
  Trash2,
  ChevronRight,
  Building2,
  Briefcase,
  Scale,
  LogOut
} from 'lucide-react'
import { CasoCreadoCelebration } from '@/components/caso-creado-celebration'
import { crearCasoDesdeVerificacion } from '@/app/casos/actions'
import { createClient } from '@/lib/supabase/client'

// Datos extraidos de INE via OCR
interface DatosPersonalesINE {
  curp?: string
  claveElector?: string
  nombreCompleto?: string
  fechaNacimiento?: string
  sexo?: 'H' | 'M' | null
  domicilio?: {
    calle?: string
    colonia?: string
    codigoPostal?: string
    municipio?: string
    estado?: string
    domicilioCompleto?: string
  }
  vigencia?: string
}

interface ProfileData {
  id: string
  email: string
  fullName: string
  phone: string
  role: string
  codigoUsuario: string
  verificationStatus: string // 'none' | 'pending' | 'verified'
  // Datos de INE
  curp?: string
  tipoIdentificacion?: string
  numeroIdentificacion?: string
  fechaNacimiento?: string
  sexo?: string
  // Domicilio
  calle?: string
  colonia?: string
  codigoPostal?: string
  municipio?: string
  estado?: string
  // Contadores
  calculosCount: number
  tieneINE: boolean
}

type EditMode = 'none' | 'personal' | 'contact' | 'address'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [showCelebration, setShowCelebration] = useState(false)
  const [creatingCaso, setCreatingCaso] = useState(false)
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  
  // Campos editables
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCalle, setEditCalle] = useState('')
  const [editColonia, setEditColonia] = useState('')
  const [editCP, setEditCP] = useState('')
  const [editMunicipio, setEditMunicipio] = useState('')
  const [editEstado, setEditEstado] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/acceso')
        return
      }

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Contar calculos
      const { count: calculosCount } = await supabase
        .from('documentos_boveda')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('categoria', 'calculo_liquidacion')
        .eq('estado', 'activo')

      // Verificar si tiene INE
      const { count: ineCount } = await supabase
        .from('documentos_boveda')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('categoria', ['ine_frente', 'ine_reverso', 'pasaporte'])
        .eq('estado', 'activo')

      const profile: ProfileData = {
        id: user.id,
        email: profileData?.email || user.email || '',
        fullName: profileData?.full_name || '',
        phone: profileData?.phone || '',
        role: profileData?.role || 'guest',
        codigoUsuario: profileData?.codigo_usuario || '',
        verificationStatus: profileData?.verification_status || 'none',
        curp: profileData?.curp,
        tipoIdentificacion: profileData?.tipo_identificacion,
        numeroIdentificacion: profileData?.numero_identificacion,
        fechaNacimiento: profileData?.fecha_nacimiento,
        sexo: profileData?.sexo,
        calle: profileData?.calle,
        colonia: profileData?.colonia,
        codigoPostal: profileData?.codigo_postal,
        municipio: profileData?.municipio,
        estado: profileData?.estado,
        calculosCount: calculosCount || 0,
        tieneINE: (ineCount || 0) > 0
      }

      setProfile(profile)
      
      // Inicializar campos editables
      setEditFullName(profile.fullName)
      setEditPhone(profile.phone)
      setEditEmail(profile.email)
      setEditCalle(profile.calle || '')
      setEditColonia(profile.colonia || '')
      setEditCP(profile.codigoPostal || '')
      setEditMunicipio(profile.municipio || '')
      setEditEstado(profile.estado || '')

    } catch (error) {
      console.error('Error loading profile:', error)
      toast({ title: 'Error', description: 'No se pudo cargar el perfil', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    try {
      const supabase = createClient()
      
      const updateData: Record<string, string | null> = {}
      
      if (editMode === 'personal' || editMode === 'contact') {
        updateData.full_name = editFullName || null
        updateData.phone = editPhone || null
        updateData.email = editEmail || null
      }
      
      if (editMode === 'address') {
        updateData.calle = editCalle || null
        updateData.colonia = editColonia || null
        updateData.codigo_postal = editCP || null
        updateData.municipio = editMunicipio || null
        updateData.estado = editEstado || null
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (error) throw error

      // Actualizar estado local
      setProfile({
        ...profile,
        fullName: editFullName,
        phone: editPhone,
        email: editEmail,
        calle: editCalle,
        colonia: editColonia,
        codigoPostal: editCP,
        municipio: editMunicipio,
        estado: editEstado
      })

      setEditMode('none')
      toast({ title: 'Guardado', description: 'Perfil actualizado correctamente' })

    } catch (error) {
      console.error('Error saving:', error)
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSolicitarVerificacion = async () => {
    if (!profile) return
    setCreatingCaso(true)

    try {
      const supabase = createClient()

      // Obtener calculo para crear caso
      const { data: calculo } = await supabase
        .from('documentos_boveda')
        .select('id, nombre, metadata')
        .eq('user_id', profile.id)
        .eq('categoria', 'calculo_liquidacion')
        .eq('estado', 'activo')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (calculo) {
        const meta = calculo.metadata as { nombreEmpresa?: string } | null
        setNombreEmpresa(meta?.nombreEmpresa || calculo.nombre || '')
        
        await crearCasoDesdeVerificacion(profile.id, calculo.id)
      }

      // Actualizar status
      await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          caso_creado: true
        })
        .eq('id', profile.id)

      setShowCelebration(true)
      setProfile({ ...profile, verificationStatus: 'pending' })

    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la solicitud', variant: 'destructive' })
    } finally {
      setCreatingCaso(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/acceso')
  }

  // Determinar estado de verificacion
  const getVerificationState = () => {
    if (!profile) return { status: 'loading', color: 'gray', icon: Loader2 }
    
    if (profile.verificationStatus === 'verified' || profile.role === 'worker') {
      return { status: 'verified', color: 'green', icon: CheckCircle, label: 'Cuenta Verificada' }
    }
    if (profile.verificationStatus === 'pending') {
      return { status: 'pending', color: 'amber', icon: AlertTriangle, label: 'Verificacion Pendiente' }
    }
    
    // Verificar requisitos
    const tieneNombre = !!profile.fullName
    const tienePhone = !!profile.phone
    const tieneCalculo = profile.calculosCount > 0
    const tieneINE = profile.tieneINE
    
    const puedeVerificar = tieneNombre && tienePhone && tieneCalculo && tieneINE
    
    return { 
      status: puedeVerificar ? 'ready' : 'incomplete', 
      color: puedeVerificar ? 'blue' : 'gray', 
      icon: puedeVerificar ? Shield : XCircle,
      label: puedeVerificar ? 'Listo para Verificar' : 'Completa tu Perfil',
      requisitos: { tieneNombre, tienePhone, tieneCalculo, tieneINE }
    }
  }

  const verification = getVerificationState()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) return null

  // Check if user is lawyer
  const isLawyer = ['lawyer', 'admin', 'superadmin', 'guestlawyer'].includes(profile.role)

  return (
    <div className="min-h-screen bg-background">
      {/* Header compacto */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">Mi Perfil</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        
        {/* 1. ESTADO DE VERIFICACION - Siempre primero y prominente */}
        <Card className={`border-2 ${
          verification.color === 'green' ? 'border-green-500 bg-green-50' :
          verification.color === 'amber' ? 'border-amber-500 bg-amber-50' :
          verification.color === 'blue' ? 'border-blue-500 bg-blue-50' :
          'border-gray-300 bg-gray-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                verification.color === 'green' ? 'bg-green-100' :
                verification.color === 'amber' ? 'bg-amber-100' :
                verification.color === 'blue' ? 'bg-blue-100' :
                'bg-gray-100'
              }`}>
                <verification.icon className={`w-7 h-7 ${
                  verification.color === 'green' ? 'text-green-600' :
                  verification.color === 'amber' ? 'text-amber-600' :
                  verification.color === 'blue' ? 'text-blue-600' :
                  'text-gray-500'
                }`} />
              </div>
              <div className="flex-1">
                <h2 className={`font-bold text-lg ${
                  verification.color === 'green' ? 'text-green-800' :
                  verification.color === 'amber' ? 'text-amber-800' :
                  verification.color === 'blue' ? 'text-blue-800' :
                  'text-gray-700'
                }`}>
                  {verification.label}
                </h2>
                
                {verification.status === 'verified' && (
                  <p className="text-sm text-green-700 mt-1">
                    Tu cuenta esta verificada. Tienes acceso completo a todas las funciones.
                  </p>
                )}
                
                {verification.status === 'pending' && (
                  <p className="text-sm text-amber-700 mt-1">
                    Un abogado esta revisando tu documentacion. Te contactaremos pronto.
                  </p>
                )}
                
                {verification.status === 'ready' && (
                  <>
                    <p className="text-sm text-blue-700 mt-1">
                      Tienes todo listo. Solicita la verificacion para acceder a un abogado.
                    </p>
                    <Button 
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
                      onClick={handleSolicitarVerificacion}
                      disabled={creatingCaso}
                    >
                      {creatingCaso ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      Solicitar Verificacion
                    </Button>
                  </>
                )}
                
                {verification.status === 'incomplete' && 'requisitos' in verification && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 uppercase font-medium">Requisitos pendientes:</p>
                    <div className="space-y-1.5">
                      <RequisitoItem 
                        cumplido={verification.requisitos.tieneNombre} 
                        texto="Nombre completo"
                        accion={!verification.requisitos.tieneNombre ? () => setEditMode('personal') : undefined}
                      />
                      <RequisitoItem 
                        cumplido={verification.requisitos.tienePhone} 
                        texto="Telefono WhatsApp"
                        accion={!verification.requisitos.tienePhone ? () => setEditMode('contact') : undefined}
                      />
                      <RequisitoItem 
                        cumplido={verification.requisitos.tieneCalculo} 
                        texto="Calculo de liquidacion"
                        link={!verification.requisitos.tieneCalculo ? '/calculadora' : undefined}
                      />
                      <RequisitoItem 
                        cumplido={verification.requisitos.tieneINE} 
                        texto="INE o identificacion"
                        link={!verification.requisitos.tieneINE ? '/boveda' : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. CODIGO DE USUARIO */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Tu Codigo</p>
                <p className="font-mono text-xl font-bold text-primary">{profile.codigoUsuario}</p>
              </div>
              <Badge variant={profile.role === 'guest' ? 'secondary' : 'default'}>
                {profile.role === 'guest' ? 'Invitado' : 
                 profile.role === 'worker' ? 'Trabajador' : 
                 profile.role === 'lawyer' ? 'Abogado' : 
                 profile.role === 'admin' ? 'Admin' : profile.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3. DATOS PERSONALES (de INE/OCR) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Datos Personales
              </CardTitle>
              {editMode !== 'personal' && (
                <Button variant="ghost" size="sm" onClick={() => setEditMode('personal')}>
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {profile.curp && (
              <p className="text-xs text-muted-foreground">Datos extraidos de tu INE</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {editMode === 'personal' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Nombre completo</Label>
                  <Input 
                    value={editFullName} 
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditMode('none')}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DataRow icon={User} label="Nombre" value={profile.fullName || 'Sin registrar'} muted={!profile.fullName} />
                {profile.curp && <DataRow icon={CreditCard} label="CURP" value={profile.curp} />}
                {profile.fechaNacimiento && (
                  <DataRow icon={Calendar} label="Nacimiento" value={profile.fechaNacimiento} />
                )}
                {profile.sexo && (
                  <DataRow icon={User} label="Sexo" value={profile.sexo === 'H' ? 'Hombre' : 'Mujer'} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. DATOS DE CONTACTO */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contacto
              </CardTitle>
              {editMode !== 'contact' && (
                <Button variant="ghost" size="sm" onClick={() => setEditMode('contact')}>
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editMode === 'contact' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Telefono WhatsApp</Label>
                  <Input 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+52 000 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Correo electronico (opcional)</Label>
                  <Input 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="tu@email.com"
                    type="email"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditMode('none')}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DataRow icon={Phone} label="WhatsApp" value={profile.phone || 'Sin registrar'} muted={!profile.phone} />
                <DataRow icon={Mail} label="Email" value={profile.email || 'Sin registrar'} muted={!profile.email} />
              </>
            )}
          </CardContent>
        </Card>

        {/* 5. DOMICILIO (de INE) */}
        {(profile.calle || profile.colonia || profile.codigoPostal) && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Domicilio
                </CardTitle>
                {editMode !== 'address' && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode('address')}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Extraido de tu INE</p>
            </CardHeader>
            <CardContent>
              {editMode === 'address' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Calle y numero</Label>
                      <Input value={editCalle} onChange={(e) => setEditCalle(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Colonia</Label>
                      <Input value={editColonia} onChange={(e) => setEditColonia(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">C.P.</Label>
                      <Input value={editCP} onChange={(e) => setEditCP(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Municipio</Label>
                      <Input value={editMunicipio} onChange={(e) => setEditMunicipio(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estado</Label>
                      <Input value={editEstado} onChange={(e) => setEditEstado(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditMode('none')}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {[profile.calle, profile.colonia, profile.codigoPostal, profile.municipio, profile.estado]
                    .filter(Boolean).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 6. IDENTIFICACION */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Identificacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.tieneINE ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">INE registrada</p>
                    {profile.numeroIdentificacion && (
                      <p className="text-xs text-muted-foreground">Clave: {profile.numeroIdentificacion}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/boveda">
                    Ver <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="w-5 h-5" />
                  <p className="text-sm">Sin identificacion</p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/boveda">
                    <Camera className="w-4 h-4 mr-2" />
                    Escanear INE
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. ACCESO RAPIDO - Para abogados */}
        {isLawyer && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Panel de Abogado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Accede a tu oficina virtual para gestionar casos y clientes.
              </p>
              <Button asChild className="w-full">
                <Link href="/oficina-virtual">
                  Ir a Oficina Virtual
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info footer */}
        <p className="text-xs text-center text-muted-foreground px-4">
          Tu informacion esta protegida y solo se comparte con abogados verificados para tu caso.
        </p>
      </main>

      {/* Celebracion */}
      {showCelebration && profile && (
        <CasoCreadoCelebration
          userName={profile.fullName || profile.codigoUsuario}
          nombreEmpresa={nombreEmpresa}
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </div>
  )
}

// Componente para mostrar fila de datos
function DataRow({ icon: Icon, label, value, muted = false }: { 
  icon: React.ComponentType<{ className?: string }>, 
  label: string, 
  value: string,
  muted?: boolean 
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${muted ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${muted ? 'text-muted-foreground italic' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

// Componente para requisitos
function RequisitoItem({ cumplido, texto, accion, link }: { 
  cumplido: boolean, 
  texto: string,
  accion?: () => void,
  link?: string
}) {
  const content = (
    <div className={`flex items-center gap-2 text-sm ${!cumplido ? 'cursor-pointer hover:bg-gray-100 rounded p-1 -m-1' : ''}`}>
      {cumplido ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={cumplido ? 'text-gray-700' : 'text-gray-500'}>{texto}</span>
      {!cumplido && <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />}
    </div>
  )

  if (link && !cumplido) {
    return <Link href={link}>{content}</Link>
  }
  
  if (accion && !cumplido) {
    return <button type="button" onClick={accion} className="w-full text-left">{content}</button>
  }

  return content
}
