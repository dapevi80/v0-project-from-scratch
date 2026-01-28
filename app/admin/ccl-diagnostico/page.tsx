'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Play, Pause, RotateCcw, CheckCircle2, XCircle, 
  AlertTriangle, Clock, Wifi, FileText, Map, BarChart3,
  Download, Sparkles, Shield, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  iniciarSesionDiagnostico, 
  generarUsuariosPrueba, 
  obtenerEstadoSesion,
  obtenerHistorialSesiones,
  type UsuarioPrueba 
} from '@/lib/ccl/diagnostico-service'
import { ejecutarPrueba } from '@/lib/ccl/portal-tester'

// Estados de México para el mapa
const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán', 'Morelos',
  'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala',
  'Veracruz', 'Yucatán', 'Zacatecas', 'Federal'
]

interface ResultadoPrueba {
  estado: string
  status: 'pendiente' | 'en_progreso' | 'exito' | 'parcial' | 'error' | 'no_accesible'
  conectividad: boolean
  formulario_detectado: boolean
  envio_exitoso: boolean
  pdf_obtenido: boolean
  tiempo_respuesta_ms: number
  error_mensaje?: string
  url_portal?: string
}

interface SesionDiagnostico {
  id: string
  estado: string
  total_portales: number
  portales_exitosos: number
  portales_fallidos: number
  portales_pendientes: number
  modo: string
  created_at: string
}

export default function CCLDiagnosticoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Estado del diagnóstico
  const [sesionId, setSesionId] = useState<string | null>(null)
  const [modo, setModo] = useState<'dry_run' | 'live'>('dry_run')
  const [ejecutando, setEjecutando] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioPrueba[]>([])
  const [resultados, setResultados] = useState<Map<string, ResultadoPrueba>>(new Map())
  const [progreso, setProgreso] = useState(0)
  const [historial, setHistorial] = useState<SesionDiagnostico[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Verificar acceso superadmin
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
      
      setUserRole(profile.role)
      setUserId(user.id)
      
      // Cargar historial
      const hist = await obtenerHistorialSesiones(user.id)
      setHistorial(hist as SesionDiagnostico[])
      
      setLoading(false)
    }
    
    checkAccess()
  }, [router])
  
  // Iniciar nueva sesión de diagnóstico
  const iniciarDiagnostico = useCallback(async () => {
    if (!userId) return
    
    setError(null)
    setEjecutando(true)
    
    // Crear sesión
    const { sesionId: newSesionId, error: sesionError } = await iniciarSesionDiagnostico(userId)
    
    if (sesionError) {
      setError(sesionError)
      setEjecutando(false)
      return
    }
    
    setSesionId(newSesionId)
    
    // Generar usuarios de prueba
    const { usuarios: newUsuarios, error: usuariosError } = await generarUsuariosPrueba(newSesionId)
    
    if (usuariosError) {
      setError(usuariosError)
      setEjecutando(false)
      return
    }
    
    setUsuarios(newUsuarios)
    
    // Inicializar resultados como pendientes
    const initialResults = new Map<string, ResultadoPrueba>()
    for (const usuario of newUsuarios) {
      initialResults.set(usuario.estado, {
        estado: usuario.estado,
        status: 'pendiente',
        conectividad: false,
        formulario_detectado: false,
        envio_exitoso: false,
        pdf_obtenido: false,
        tiempo_respuesta_ms: 0
      })
    }
    setResultados(initialResults)
    
    // Ejecutar pruebas secuencialmente
    for (let i = 0; i < newUsuarios.length; i++) {
      if (pausado) {
        break
      }
      
      const usuario = newUsuarios[i]
      
      // Marcar como en progreso
      setResultados(prev => {
        const updated = new Map(prev)
        updated.set(usuario.estado, { ...prev.get(usuario.estado)!, status: 'en_progreso' })
        return updated
      })
      
      // Ejecutar prueba
      const resultado = await ejecutarPrueba(newSesionId, usuario, modo)
      
      // Actualizar resultado
      setResultados(prev => {
        const updated = new Map(prev)
        let status: ResultadoPrueba['status'] = 'error'
        if (resultado.pdf_obtenido) status = 'exito'
        else if (resultado.conectividad && resultado.formulario_detectado) status = 'parcial'
        else if (!resultado.conectividad) status = 'no_accesible'
        
        updated.set(usuario.estado, {
          estado: usuario.estado,
          status,
          conectividad: resultado.conectividad,
          formulario_detectado: resultado.formulario_detectado,
          envio_exitoso: resultado.envio_exitoso,
          pdf_obtenido: resultado.pdf_obtenido,
          tiempo_respuesta_ms: resultado.tiempo_respuesta_ms,
          error_mensaje: resultado.error_mensaje,
          url_portal: resultado.url_portal
        })
        return updated
      })
      
      setProgreso(Math.round(((i + 1) / newUsuarios.length) * 100))
      
      // Pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setEjecutando(false)
    
    // Actualizar historial
    if (userId) {
      const hist = await obtenerHistorialSesiones(userId)
      setHistorial(hist as SesionDiagnostico[])
    }
  }, [userId, modo, pausado])
  
  // Obtener estadísticas
  const stats = {
    total: resultados.size,
    exitosos: Array.from(resultados.values()).filter(r => r.status === 'exito').length,
    parciales: Array.from(resultados.values()).filter(r => r.status === 'parcial').length,
    fallidos: Array.from(resultados.values()).filter(r => r.status === 'error').length,
    noAccesibles: Array.from(resultados.values()).filter(r => r.status === 'no_accesible').length,
    pendientes: Array.from(resultados.values()).filter(r => r.status === 'pendiente').length,
    enProgreso: Array.from(resultados.values()).filter(r => r.status === 'en_progreso').length
  }
  
  const getStatusColor = (status: ResultadoPrueba['status']) => {
    switch (status) {
      case 'exito': return 'bg-green-500'
      case 'parcial': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'no_accesible': return 'bg-gray-500'
      case 'en_progreso': return 'bg-blue-500 animate-pulse'
      default: return 'bg-gray-300'
    }
  }
  
  const getStatusIcon = (status: ResultadoPrueba['status']) => {
    switch (status) {
      case 'exito': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'parcial': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      case 'no_accesible': return <Wifi className="w-4 h-4 text-gray-500" />
      case 'en_progreso': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }
  
  const getStatusBadge = (status: ResultadoPrueba['status']) => {
    switch (status) {
      case 'exito': return <Badge className="bg-green-100 text-green-800">PDF Obtenido</Badge>
      case 'parcial': return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case 'no_accesible': return <Badge className="bg-gray-100 text-gray-800">No Accesible</Badge>
      case 'en_progreso': return <Badge className="bg-blue-100 text-blue-800">Probando...</Badge>
      default: return <Badge variant="outline">Pendiente</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (userRole !== 'superadmin') {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Diagnóstico CCL
              </h1>
              <p className="text-sm text-muted-foreground">
                Prueba automatizada de 33 portales CCL
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Solo Superadmin
          </Badge>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Panel de Control */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Panel de Control
            </CardTitle>
            <CardDescription>
              Ejecuta pruebas secuenciales a los 33 portales CCL (32 estados + Federal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Selector de Modo */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Modo:</span>
                  <Button
                    variant={modo === 'dry_run' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModo('dry_run')}
                    disabled={ejecutando}
                    className={modo === 'dry_run' ? '' : 'bg-transparent'}
                  >
                    Dry Run
                  </Button>
                  <Button
                    variant={modo === 'live' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModo('live')}
                    disabled={ejecutando}
                    className={modo === 'live' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-transparent'}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Live Test
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground max-w-xs">
                  {modo === 'dry_run' 
                    ? 'Solo prueba conectividad y detecta formularios'
                    : 'Intenta enviar solicitud real y obtener PDF'
                  }
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="flex items-center gap-2">
                {!ejecutando ? (
                  <Button onClick={iniciarDiagnostico} className="gap-2">
                    <Play className="w-4 h-4" />
                    Iniciar Diagnóstico
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setPausado(!pausado)}
                      className="gap-2 bg-transparent"
                    >
                      {pausado ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {pausado ? 'Continuar' : 'Pausar'}
                    </Button>
                    <Button variant="destructive" onClick={() => {
                      setPausado(true)
                      setEjecutando(false)
                    }}>
                      Detener
                    </Button>
                  </>
                )}
                
                {stats.total > 0 && !ejecutando && (
                  <Button variant="outline" onClick={() => {
                    setResultados(new Map())
                    setProgreso(0)
                    setSesionId(null)
                    setUsuarios([])
                  }} className="gap-2 bg-transparent">
                    <RotateCcw className="w-4 h-4" />
                    Reiniciar
                  </Button>
                )}
              </div>
            </div>
            
            {/* Barra de Progreso */}
            {(ejecutando || progreso > 0) && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>{ejecutando ? 'Ejecutando pruebas...' : 'Completado'}</span>
                  <span>{progreso}%</span>
                </div>
                <Progress value={progreso} className="h-2" />
              </div>
            )}
            
            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Estadísticas */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.exitosos}</div>
                <div className="text-xs text-muted-foreground">Exitosos (PDF)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.parciales}</div>
                <div className="text-xs text-muted-foreground">Parciales</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.fallidos}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-600">{stats.noAccesibles}</div>
                <div className="text-xs text-muted-foreground">No Accesibles</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
                <div className="text-xs text-muted-foreground">En Progreso</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-400">{stats.pendientes}</div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Resultados por Estado */}
        <Tabs defaultValue="grid" className="mb-6">
          <TabsList>
            <TabsTrigger value="grid">Vista Grid</TabsTrigger>
            <TabsTrigger value="tabla">Vista Tabla</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Resultados por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ESTADOS_MEXICO.map(estado => {
                    const resultado = resultados.get(estado)
                    return (
                      <div 
                        key={estado}
                        className={`p-3 rounded-lg border transition-all ${
                          resultado?.status === 'exito' ? 'bg-green-50 border-green-200' :
                          resultado?.status === 'parcial' ? 'bg-yellow-50 border-yellow-200' :
                          resultado?.status === 'error' ? 'bg-red-50 border-red-200' :
                          resultado?.status === 'no_accesible' ? 'bg-gray-100 border-gray-300' :
                          resultado?.status === 'en_progreso' ? 'bg-blue-50 border-blue-200' :
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(resultado?.status || 'pendiente')}`} />
                          {getStatusIcon(resultado?.status || 'pendiente')}
                        </div>
                        <div className="text-xs font-medium truncate" title={estado}>
                          {estado === 'Ciudad de México' ? 'CDMX' : 
                           estado === 'Estado de México' ? 'EdoMéx' :
                           estado === 'Baja California Sur' ? 'BCS' :
                           estado === 'Baja California' ? 'BC' :
                           estado === 'San Luis Potosí' ? 'SLP' :
                           estado === 'Quintana Roo' ? 'QRoo' :
                           estado.length > 10 ? estado.slice(0, 8) + '...' : estado}
                        </div>
                        {resultado?.tiempo_respuesta_ms ? (
                          <div className="text-[10px] text-muted-foreground">
                            {resultado.tiempo_respuesta_ms}ms
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tabla">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Detalle de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Estado</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-center py-2 px-3">Conectividad</th>
                        <th className="text-center py-2 px-3">Formulario</th>
                        <th className="text-center py-2 px-3">Envío</th>
                        <th className="text-center py-2 px-3">PDF</th>
                        <th className="text-right py-2 px-3">Tiempo</th>
                        <th className="text-left py-2 px-3">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ESTADOS_MEXICO.map(estado => {
                        const resultado = resultados.get(estado)
                        return (
                          <tr key={estado} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium">{estado}</td>
                            <td className="py-2 px-3">{getStatusBadge(resultado?.status || 'pendiente')}</td>
                            <td className="py-2 px-3 text-center">
                              {resultado?.conectividad ? 
                                <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : 
                                <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                              }
                            </td>
                            <td className="py-2 px-3 text-center">
                              {resultado?.formulario_detectado ? 
                                <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : 
                                <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                              }
                            </td>
                            <td className="py-2 px-3 text-center">
                              {resultado?.envio_exitoso ? 
                                <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : 
                                <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                              }
                            </td>
                            <td className="py-2 px-3 text-center">
                              {resultado?.pdf_obtenido ? 
                                <FileText className="w-4 h-4 text-green-600 mx-auto" /> : 
                                <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                              }
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              {resultado?.tiempo_respuesta_ms ? `${resultado.tiempo_respuesta_ms}ms` : '-'}
                            </td>
                            <td className="py-2 px-3 text-xs text-red-600 max-w-[200px] truncate" title={resultado?.error_mensaje}>
                              {resultado?.error_mensaje || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sesiones</CardTitle>
                <CardDescription>Últimas 10 sesiones de diagnóstico</CardDescription>
              </CardHeader>
              <CardContent>
                {historial.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay sesiones previas
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historial.map(sesion => (
                      <div key={sesion.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            Sesión {new Date(sesion.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Modo: {sesion.modo === 'live' ? 'Live Test' : 'Dry Run'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600">{sesion.portales_exitosos} OK</span>
                          <span className="text-red-600">{sesion.portales_fallidos} Err</span>
                          <Badge variant="outline">
                            {sesion.estado === 'completado' ? 'Completado' : sesion.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Usuarios de Prueba (colapsable) */}
        {usuarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Usuarios de Prueba Generados</CardTitle>
              <CardDescription className="text-xs">
                Datos ficticios válidos en estructura pero no reales - Expiran en 8 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 px-2">Estado</th>
                      <th className="text-left py-1 px-2">Nombre</th>
                      <th className="text-left py-1 px-2">CURP</th>
                      <th className="text-left py-1 px-2">Empresa</th>
                      <th className="text-right py-1 px-2">Salario</th>
                      <th className="text-right py-1 px-2">Liquidación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-2">{u.estado}</td>
                        <td className="py-1 px-2">{u.nombre_completo}</td>
                        <td className="py-1 px-2 font-mono">{u.curp}</td>
                        <td className="py-1 px-2 truncate max-w-[150px]">{u.empresa_nombre}</td>
                        <td className="py-1 px-2 text-right">${u.salario_diario}/día</td>
                        <td className="py-1 px-2 text-right font-medium text-green-600">
                          ${u.monto_liquidacion.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
