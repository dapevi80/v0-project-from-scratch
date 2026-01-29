'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, Award as IdCard, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { verifyUserAccount } from '../../actions'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  calle: string | null
  numero_exterior: string | null
  colonia: string | null
  ciudad: string | null
  estado: string | null
  codigo_postal: string | null
  curp: string | null
  tipo_identificacion: string | null
  numero_identificacion: string | null
  identificacion_verificada: boolean
  verification_status: string | null
  created_at: string
}

export default function VerificarUsuarioPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<Array<{id: string, doc_type: string, file_url: string, status: string}>>([])
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [curp, setCurp] = useState('')
  const [tipoId, setTipoId] = useState<string>('')
  const [numeroId, setNumeroId] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    loadUser()
  }, [id])

  async function loadUser() {
    setLoading(true)
    const supabase = createClient()
    
    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (profileError || !profile) {
      setError('Usuario no encontrado')
      setLoading(false)
      return
    }
    
    setUser(profile)
    
    // Pre-llenar campos si ya existen
    if (profile.curp) setCurp(profile.curp)
    if (profile.tipo_identificacion) setTipoId(profile.tipo_identificacion)
    if (profile.numero_identificacion) setNumeroId(profile.numero_identificacion)
    
    // Obtener documentos del usuario
    const { data: docs } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    
    if (docs) {
      setDocuments(docs)
    }
    
    setLoading(false)
  }

  async function handleVerify(aprobado: boolean) {
    if (aprobado && (!curp || !tipoId || !numeroId)) {
      setError('Debes completar CURP, tipo y numero de identificacion para aprobar')
      return
    }
    
    setSaving(true)
    setError(null)
    
    const result = await verifyUserAccount(id, {
      curp,
      tipo_identificacion: tipoId as 'ine' | 'pasaporte' | 'cedula_profesional' | 'cartilla_militar',
      numero_identificacion: numeroId,
      aprobado,
      notas: notas || undefined
    })
    
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    
    router.push('/oficina-virtual?tab=verificaciones')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Usuario no encontrado</h2>
            <Button asChild>
              <Link href="/oficina-virtual">Volver</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/oficina-virtual" className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">Verificar Usuario</h1>
              <p className="text-xs text-muted-foreground">Revision de identidad</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
        
        {/* Datos del Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">{user.full_name || 'No registrado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefono</p>
                  <p className="font-medium">{user.phone || 'No registrado'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Registro</p>
                  <p className="font-medium text-sm">
                    {new Date(user.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            </div>
            
            {(user.calle || user.colonia || user.ciudad) && (
              <div className="flex items-start gap-2 pt-2 border-t">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Direccion</p>
                  <p className="font-medium text-sm">
                    {[user.calle, user.numero_exterior, user.colonia, user.ciudad, user.estado, user.codigo_postal]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge className={user.role === 'worker' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                {user.role === 'worker' ? 'Trabajador' : user.role === 'guest' ? 'Invitado' : user.role}
              </Badge>
              <Badge className={
                user.identificacion_verificada 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }>
                {user.identificacion_verificada ? 'Verificado' : 'Pendiente'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Documentos Subidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos Subidos
            </CardTitle>
            <CardDescription>
              Revisa los documentos de identidad del usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay documentos subidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <IdCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium capitalize">{doc.doc_type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          Estado: {doc.status === 'pending' ? 'Pendiente' : doc.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-transparent">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        Ver documento
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Formulario de Verificacion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Datos de Verificacion
            </CardTitle>
            <CardDescription>
              Completa los datos de identidad verificados en el documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="curp">CURP *</Label>
              <Input
                id="curp"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                placeholder="XXXX000000XXXXXX00"
                maxLength={18}
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                18 caracteres alfanumericos
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_id">Tipo de Identificacion *</Label>
                <Select value={tipoId} onValueChange={setTipoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ine">INE / IFE</SelectItem>
                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="cedula_profesional">Cedula Profesional</SelectItem>
                    <SelectItem value="cartilla_militar">Cartilla Militar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numero_id">Numero de Identificacion *</Label>
                <Input
                  id="numero_id"
                  value={numeroId}
                  onChange={(e) => setNumeroId(e.target.value)}
                  placeholder="Numero del documento"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones sobre la verificacion..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Botones de Accion */}
        <div className="flex gap-3 sticky bottom-4">
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={() => handleVerify(false)}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Rechazar
          </Button>
          
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleVerify(true)}
            disabled={saving || !curp || !tipoId || !numeroId}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Aprobar y Verificar
          </Button>
        </div>
      </main>
    </div>
  )
}
