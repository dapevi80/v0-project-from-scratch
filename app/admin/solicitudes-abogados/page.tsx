'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, User, Mail, Phone, FileText, CheckCircle2, XCircle, Clock, ExternalLink, Shield, Award, Loader2, Search, RefreshCw, MapPin, GraduationCap, Briefcase, Calendar, Award as IdCard, FileCheck, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { aprobarAbogado, rechazarAbogado } from './upgrade-actions'

interface LawyerProfile {
  id: string
  user_id: string
  display_name: string
  cedula_profesional: string | null
  universidad: string | null
  especialidades: string[] | null
  estados_operacion: string[] | null
  anos_experiencia: number | null
  verification_status: string
  is_available: boolean
  bio: string | null
  firm_name: string | null
  whatsapp: string | null
  horario_atencion: string | null
  curp: string | null
  rfc: string | null
  ine_url: string | null
  cedula_url: string | null
  titulo_url: string | null
  constancia_fiscal_url: string | null
  foto_perfil_url: string | null
  documentos_completos: boolean | null
  fecha_envio_documentos: string | null
  created_at: string
  profiles?: {
    email: string
    phone: string
    full_name: string
  }
}

export default function SolicitudesAbogadosPage() {
  const [abogados, setAbogados] = useState<LawyerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'incomplete' | 'verified' | 'all'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAbogado, setSelectedAbogado] = useState<LawyerProfile | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [notasRechazo, setNotasRechazo] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    loadAbogados()
  }, [filter])

  const checkAccess = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/acceso')
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      router.push('/dashboard')
      return
    }
    
    setIsSuperAdmin(profile.role === 'superadmin')
  }

  const loadAbogados = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    
    let query = supabase
      .from('lawyer_profiles')
      .select(`
        *,
        profiles!inner(email, phone, full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (filter === 'pending') {
      query = query.eq('verification_status', 'pending').eq('documentos_completos', true)
    } else if (filter === 'incomplete') {
      query = query.or('verification_status.eq.incomplete,documentos_completos.is.null,documentos_completos.eq.false')
    } else if (filter === 'verified') {
      query = query.eq('verification_status', 'verified')
    }
    
    const { data, error: queryError } = await query
    
    if (queryError) {
      setError(queryError.message)
    } else {
      setAbogados(data || [])
    }
    setLoading(false)
  }

  const handleAprobar = async () => {
    if (!selectedAbogado) return
    
    setProcessing(true)
    setError(null)
    
    // Usar la accion de upgrade que registra todo el tracking
    const result = await aprobarAbogado(selectedAbogado.user_id)
    
    if (result.error) {
      setError(result.error)
      setProcessing(false)
      return
    }
    
    setSuccess(`Abogado ${selectedAbogado.display_name} verificado exitosamente. Upgrade: ${result.previousRole} -> ${result.newRole}`)
    setShowApproveDialog(false)
    setSelectedAbogado(null)
    loadAbogados()
    setProcessing(false)
    
    setTimeout(() => setSuccess(null), 5000)
  }

  const handleRechazar = async () => {
    if (!selectedAbogado) return
    
    setProcessing(true)
    setError(null)
    
    // Usar la accion de rechazo que registra el downgrade si aplica
    const result = await rechazarAbogado(
      selectedAbogado.user_id,
      notasRechazo,
      true // forzar downgrade
    )
    
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`Solicitud de ${selectedAbogado.display_name} rechazada${result.wasDowngraded ? '. Cuenta degradada.' : ''}`)
      setShowRejectDialog(false)
      setSelectedAbogado(null)
      setNotasRechazo('')
      loadAbogados()
    }
    setProcessing(false)
    
    setTimeout(() => setSuccess(null), 5000)
  }

  const filteredAbogados = abogados.filter(a => 
    a.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cedula_profesional?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string, docsCompletos: boolean | null) => {
    if (status === 'verified') {
      return <Badge className="bg-green-100 text-green-700">Verificado</Badge>
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-700">Rechazado</Badge>
    }
    if (status === 'pending' && docsCompletos) {
      return <Badge className="bg-amber-100 text-amber-700">Pendiente Revision</Badge>
    }
    return <Badge className="bg-slate-100 text-slate-600">Docs Incompletos</Badge>
  }

  const stats = {
    pendientes: abogados.filter(a => a.verification_status === 'pending' && a.documentos_completos).length,
    incompletos: abogados.filter(a => !a.documentos_completos || a.verification_status === 'incomplete').length,
    verificados: abogados.filter(a => a.verification_status === 'verified').length
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Verificacion de Abogados</h1>
                <p className="text-sm text-slate-500">
                  Revisar documentos y aprobar solicitudes
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={loadAbogados} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-700">{stats.pendientes}</div>
              <div className="text-sm text-amber-600">Pendientes de Revision</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-slate-700">{stats.incompletos}</div>
              <div className="text-sm text-slate-600">Docs Incompletos</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{stats.verificados}</div>
              <div className="text-sm text-green-600">Verificados</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o cedula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="w-4 h-4" />
                Pendientes ({stats.pendientes})
              </TabsTrigger>
              <TabsTrigger value="incomplete" className="gap-1">
                <FileText className="w-4 h-4" />
                Incompletos ({stats.incompletos})
              </TabsTrigger>
              <TabsTrigger value="verified" className="gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Verificados
              </TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de abogados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAbogados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-600">No hay solicitudes</p>
              <p className="text-slate-400">
                {filter === 'pending' 
                  ? 'No hay abogados pendientes de verificar'
                  : 'No se encontraron abogados con los filtros aplicados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAbogados.map((abogado) => (
              <Card key={abogado.id} className={`
                transition-all hover:shadow-md
                ${abogado.verification_status === 'pending' && abogado.documentos_completos ? 'border-amber-300 bg-amber-50/30' : ''}
                ${abogado.verification_status === 'verified' ? 'border-green-300 bg-green-50/30' : ''}
              `}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
                        ${abogado.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {abogado.display_name?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-800">{abogado.display_name}</h3>
                          {getStatusBadge(abogado.verification_status, abogado.documentos_completos)}
                          {abogado.firm_name && (
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="w-3 h-3" />
                              {abogado.firm_name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {abogado.profiles?.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {abogado.profiles?.phone || abogado.whatsapp}
                          </span>
                          {abogado.cedula_profesional && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Cedula: {abogado.cedula_profesional}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                          {abogado.universidad && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {abogado.universidad}
                            </span>
                          )}
                          {abogado.anos_experiencia && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {abogado.anos_experiencia} años exp.
                            </span>
                          )}
                          {abogado.estados_operacion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {abogado.estados_operacion.slice(0, 2).join(', ')}
                              {abogado.estados_operacion.length > 2 && ` +${abogado.estados_operacion.length - 2}`}
                            </span>
                          )}
                        </div>

                        {/* Especialidades */}
                        <div className="flex flex-wrap gap-1">
                          {abogado.especialidades?.slice(0, 4).map((esp, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                          {(abogado.especialidades?.length || 0) > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(abogado.especialidades?.length || 0) - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(abogado.created_at).toLocaleDateString('es-MX', { 
                          day: 'numeric', month: 'short', year: 'numeric' 
                        })}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedAbogado(abogado)
                            setShowDetailDialog(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                        
                        {abogado.verification_status === 'pending' && abogado.documentos_completos && isSuperAdmin && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => {
                                setSelectedAbogado(abogado)
                                setShowRejectDialog(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedAbogado(abogado)
                                setShowApproveDialog(true)
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Verificar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Documentos (solo si tiene) */}
                  {abogado.documentos_completos && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-green-600" />
                        Documentos enviados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {abogado.ine_url && (
                          <a href={abogado.ine_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                              <IdCard className="w-3 h-3" />
                              INE
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                        {abogado.cedula_url && (
                          <a href={abogado.cedula_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                              <Award className="w-3 h-3" />
                              Cedula
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                        {abogado.titulo_url && (
                          <a href={abogado.titulo_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                              <GraduationCap className="w-3 h-3" />
                              Titulo
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                        {abogado.constancia_fiscal_url && (
                          <a href={abogado.constancia_fiscal_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                              <FileText className="w-3 h-3" />
                              Constancia Fiscal
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                      </div>
                      {abogado.curp && (
                        <p className="text-xs text-slate-500 mt-2">
                          <strong>CURP:</strong> {abogado.curp} | <strong>RFC:</strong> {abogado.rfc}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog de Detalles */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Detalles del Abogado
            </DialogTitle>
          </DialogHeader>
          
          {selectedAbogado && (
            <div className="space-y-6">
              {/* Header con foto y nombre */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {selectedAbogado.display_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedAbogado.display_name}</h3>
                  <p className="text-slate-500">{selectedAbogado.profiles?.email}</p>
                  {selectedAbogado.firm_name && (
                    <p className="text-sm text-purple-600 font-medium">{selectedAbogado.firm_name}</p>
                  )}
                </div>
              </div>
              
              {/* Datos personales */}
              <div>
                <h4 className="font-semibold mb-3 text-slate-800">Datos de Identificacion</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Cedula Profesional:</span>
                    <p className="font-medium">{selectedAbogado.cedula_profesional || 'No proporcionada'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">CURP:</span>
                    <p className="font-medium">{selectedAbogado.curp || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">RFC:</span>
                    <p className="font-medium">{selectedAbogado.rfc || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Universidad:</span>
                    <p className="font-medium">{selectedAbogado.universidad || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              
              {/* Experiencia */}
              <div>
                <h4 className="font-semibold mb-3 text-slate-800">Experiencia Profesional</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Anos de Experiencia:</span>
                    <p className="font-medium">{selectedAbogado.anos_experiencia || 0} años</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Horario de Atencion:</span>
                    <p className="font-medium">{selectedAbogado.horario_atencion || 'No especificado'}</p>
                  </div>
                </div>
                
                {selectedAbogado.especialidades && selectedAbogado.especialidades.length > 0 && (
                  <div className="mt-3">
                    <span className="text-slate-500 text-sm">Especialidades:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAbogado.especialidades.map((esp, i) => (
                        <Badge key={i} variant="secondary">{esp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAbogado.estados_operacion && selectedAbogado.estados_operacion.length > 0 && (
                  <div className="mt-3">
                    <span className="text-slate-500 text-sm">Estados donde opera:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAbogado.estados_operacion.map((estado, i) => (
                        <Badge key={i} variant="outline">{estado}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bio */}
              {selectedAbogado.bio && (
                <div>
                  <h4 className="font-semibold mb-2 text-slate-800">Biografia</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedAbogado.bio}</p>
                </div>
              )}
              
              {/* Documentos */}
              {selectedAbogado.documentos_completos && (
                <div>
                  <h4 className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-600" />
                    Documentos de Verificacion
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedAbogado.ine_url && (
                      <a href={selectedAbogado.ine_url} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <IdCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">INE / Identificacion</p>
                          <p className="text-xs text-slate-500">Click para ver</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                      </a>
                    )}
                    {selectedAbogado.cedula_url && (
                      <a href={selectedAbogado.cedula_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <Award className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-sm">Cedula Profesional</p>
                          <p className="text-xs text-slate-500">Click para ver</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                      </a>
                    )}
                    {selectedAbogado.titulo_url && (
                      <a href={selectedAbogado.titulo_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-sm">Titulo Universitario</p>
                          <p className="text-xs text-slate-500">Click para ver</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                      </a>
                    )}
                    {selectedAbogado.constancia_fiscal_url && (
                      <a href={selectedAbogado.constancia_fiscal_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">Constancia Fiscal</p>
                          <p className="text-xs text-slate-500">Click para ver</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
            {selectedAbogado?.verification_status === 'pending' && selectedAbogado?.documentos_completos && isSuperAdmin && (
              <>
                <Button 
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 bg-transparent"
                  onClick={() => {
                    setShowDetailDialog(false)
                    setShowRejectDialog(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rechazar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailDialog(false)
                    setShowApproveDialog(true)
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Verificar Abogado
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aprobacion */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Verificar Abogado
            </DialogTitle>
            <DialogDescription>
              Al verificar, el abogado podra recibir casos y atender clientes en la plataforma.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAbogado && (
            <div className="py-4 space-y-3">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-medium text-green-800 mb-2">
                  Verificar a: {selectedAbogado.display_name}
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>- Su rol cambiara a abogado verificado</li>
                  <li>- Podra recibir asignacion de casos</li>
                  <li>- Aparecera en el directorio de abogados</li>
                  <li>- Podra usar todas las herramientas</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAprobar}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Confirmar Verificacion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rechazo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rechazar Solicitud
            </DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para que el abogado pueda corregir y volver a enviar sus documentos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="notas">Motivo del rechazo</Label>
            <Textarea
              id="notas"
              placeholder="Ej: La imagen de la cedula profesional no es legible, favor de subir una foto mas clara..."
              value={notasRechazo}
              onChange={(e) => setNotasRechazo(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRechazar}
              disabled={processing || !notasRechazo.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Rechazar Solicitud'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
