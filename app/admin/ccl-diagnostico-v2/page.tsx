'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, CheckCircle2, XCircle, AlertTriangle, Activity, TrendingUp,
  MapPin, Zap, Clock, Server, Shield, Download, RefreshCw, Settings,
  BarChart3, PieChart, Target, Eye, Sparkles, Cpu, Globe
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Estados de México con coordenadas para mapa visual
const ESTADOS_GRID = [
  // Fila 1 (Norte)
  ['Baja California', 'Sonora', 'Chihuahua', 'Coahuila', 'Nuevo Leon', 'Tamaulipas'],
  // Fila 2
  ['Baja California Sur', 'Sinaloa', 'Durango', 'Zacatecas', 'San Luis Potosi', 'Veracruz'],
  // Fila 3
  ['Nayarit', 'Aguascalientes', 'Guanajuato', 'Queretaro', 'Hidalgo', 'Tlaxcala'],
  // Fila 4
  ['Jalisco', 'Colima', 'Michoacan', 'Estado de Mexico', 'Ciudad de Mexico', 'Puebla'],
  // Fila 5 (Sur)
  ['Guerrero', 'Morelos', 'Oaxaca', 'Veracruz', 'Tabasco', 'Campeche'],
  // Fila 6
  ['Chiapas', 'Yucatan', 'Quintana Roo']
]

interface EstadoStatus {
  nombre: string
  status: 'ok' | 'warning' | 'error' | 'unknown'
  ultimaPrueba: Date | null
  tasaExito: number
  tiempoPromedio: number
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [estadosStatus, setEstadosStatus] = useState<EstadoStatus[]>([])
  const [metricas, setMetricas] = useState({
    totalEstados: 33,
    estadosActivos: 0,
    tasaExitoGlobal: 0,
    tiempoPromedioGlobal: 0,
    pruebasHoy: 0,
    pruebasExitosas: 0,
    pruebasFallidas: 0
  })
  const [testEnProgreso, setTestEnProgreso] = useState(false)
  const [vistaActual, setVistaActual] = useState<'mapa' | 'lista' | 'metricas'>('mapa')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      // TODO: Cargar datos reales de Supabase
      // const supabase = createClient()
      // const { data } = await supabase.from('ccl_diagnostico_resultados').select('*')
      
      // Simulación de datos
      const estadosSimulados: EstadoStatus[] = [
        { nombre: 'Ciudad de Mexico', status: 'ok', ultimaPrueba: new Date(), tasaExito: 95, tiempoPromedio: 45 },
        { nombre: 'Jalisco', status: 'ok', ultimaPrueba: new Date(), tasaExito: 92, tiempoPromedio: 52 },
        { nombre: 'Nuevo Leon', status: 'warning', ultimaPrueba: new Date(), tasaExito: 75, tiempoPromedio: 68 },
        { nombre: 'Veracruz', status: 'error', ultimaPrueba: new Date(), tasaExito: 45, tiempoPromedio: 120 },
      ]
      
      setEstadosStatus(estadosSimulados)
      setMetricas({
        totalEstados: 33,
        estadosActivos: 28,
        tasaExitoGlobal: 85,
        tiempoPromedioGlobal: 58,
        pruebasHoy: 142,
        pruebasExitosas: 121,
        pruebasFallidas: 21
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function ejecutarDiagnosticoGlobal() {
    setTestEnProgreso(true)
    // TODO: Implementar ejecución real
    setTimeout(() => {
      setTestEnProgreso(false)
      cargarDatos()
    }, 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok': return <Badge className="bg-green-600">✓ Operativo</Badge>
      case 'warning': return <Badge className="bg-yellow-600">⚠ Degradado</Badge>
      case 'error': return <Badge className="bg-red-600">✗ Caído</Badge>
      default: return <Badge variant="secondary">? Sin datos</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  CCL Diagnostic Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Monitor en tiempo real de 33 portales CCL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                disabled={testEnProgreso}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${testEnProgreso ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={ejecutarDiagnosticoGlobal}
                disabled={testEnProgreso}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {testEnProgreso ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-pulse" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Global
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Tasa de Éxito Global */}
          <Card className="border-2 border-green-200 dark:border-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Tasa Éxito Global</h3>
              <p className="text-3xl font-bold text-green-600">{metricas.tasaExitoGlobal}%</p>
              <Progress value={metricas.tasaExitoGlobal} className="mt-2 h-2" />
            </CardContent>
          </Card>

          {/* Estados Activos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="secondary">{metricas.estadosActivos}/{metricas.totalEstados}</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Estados Activos</h3>
              <p className="text-3xl font-bold">{metricas.estadosActivos}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metricas.totalEstados - metricas.estadosActivos} inactivos
              </p>
            </CardContent>
          </Card>

          {/* Tiempo Promedio */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Tiempo Promedio</h3>
              <p className="text-3xl font-bold">{metricas.tiempoPromedioGlobal}s</p>
              <p className="text-xs text-green-600 mt-1">↓ 12% vs ayer</p>
            </CardContent>
          </Card>

          {/* Pruebas Hoy */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950">
                  <Activity className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-right text-xs">
                  <div className="text-green-600">✓ {metricas.pruebasExitosas}</div>
                  <div className="text-red-600">✗ {metricas.pruebasFallidas}</div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Pruebas Hoy</h3>
              <p className="text-3xl font-bold">{metricas.pruebasHoy}</p>
              <Progress 
                value={(metricas.pruebasExitosas / metricas.pruebasHoy) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Selector de Vista */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={vistaActual === 'mapa' ? 'default' : 'outline'}
            onClick={() => setVistaActual('mapa')}
            size="sm"
          >
            <Globe className="w-4 h-4 mr-2" />
            Mapa
          </Button>
          <Button
            variant={vistaActual === 'lista' ? 'default' : 'outline'}
            onClick={() => setVistaActual('lista')}
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={vistaActual === 'metricas' ? 'default' : 'outline'}
            onClick={() => setVistaActual('metricas')}
            size="sm"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Métricas
          </Button>
        </div>

        {/* Vista de Mapa */}
        {vistaActual === 'mapa' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Mapa de Estados
              </CardTitle>
              <CardDescription>
                Status en tiempo real de todos los portales CCL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {ESTADOS_GRID.map((fila, filaIdx) => (
                  <div key={filaIdx} className="contents">
                    {fila.map((estado, colIdx) => {
                      const status = estadosStatus.find(e => e.nombre === estado)
                      return (
                        <button
                          key={`${filaIdx}-${colIdx}`}
                          className={`
                            aspect-square rounded-lg border-2 p-2 text-xs font-medium
                            transition-all hover:scale-105 hover:shadow-lg
                            ${status ? getStatusColor(status.status) : 'bg-gray-200 dark:bg-gray-800'}
                            ${status ? 'text-white' : 'text-gray-400'}
                          `}
                          title={`${estado} - ${status?.tasaExito || 0}%`}
                        >
                          {estado.slice(0, 3).toUpperCase()}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              
              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Operativo (≥90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Degradado (70-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span>Caído (&lt;70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400"></div>
                  <span>Sin datos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista de Lista */}
        {vistaActual === 'lista' && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles por Estado</CardTitle>
              <CardDescription>
                Información detallada de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estadosStatus.map((estado) => (
                  <div
                    key={estado.nombre}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(estado.status)}`}></div>
                      <div>
                        <p className="font-medium">{estado.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Última prueba: {estado.ultimaPrueba?.toLocaleString() || 'Nunca'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{estado.tasaExito}%</p>
                        <p className="text-xs text-muted-foreground">Éxito</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{estado.tiempoPromedio}s</p>
                        <p className="text-xs text-muted-foreground">Promedio</p>
                      </div>
                      {getStatusBadge(estado.status)}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista de Métricas */}
        {vistaActual === 'metricas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        Operativos
                      </span>
                      <span className="font-medium">24 estados</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-500"></div>
                        Degradados
                      </span>
                      <span className="font-medium">4 estados</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        Caídos
                      </span>
                      <span className="font-medium">5 estados</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Mejores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { nombre: 'Ciudad de Mexico', exito: 95 },
                    { nombre: 'Jalisco', exito: 92 },
                    { nombre: 'Nuevo Leon', exito: 90 },
                    { nombre: 'Queretaro', exito: 88 },
                    { nombre: 'Guanajuato', exito: 85 },
                  ].map((estado, idx) => (
                    <div key={estado.nombre} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{estado.nombre}</p>
                        <Progress value={estado.exito} className="h-1.5 mt-1" />
                      </div>
                      <span className="text-sm font-medium text-green-600">{estado.exito}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
