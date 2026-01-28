'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TEST_USERS } from '@/lib/types'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, Shield, Scale, Loader2, Home, Calculator, AlertTriangle } from 'lucide-react'
import { registrarUsuarioGuest, loginUsuario } from './actions'
import { AyudaUrgenteFlow } from '@/components/ayuda-urgente-flow'
import { createClient } from '@/lib/supabase/client'

// Key para guardar credenciales guest en localStorage
const GUEST_CREDENTIALS_KEY = 'mc_guest_credentials'

interface GuestCredentials {
  email: string
  password: string
  nombre: string
  codigoUsuario: string
  createdAt: number
}

export default function AccesoPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'login' | 'registro'>('login')
  const [quickLoginLoading, setQuickLoginLoading] = useState(false)
  const [savedGuest, setSavedGuest] = useState<GuestCredentials | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [autoLoggingIn, setAutoLoggingIn] = useState(false)
  const [savedGuestName, setSavedGuestName] = useState<string | null>(null)
  const [showInactivityAlert, setShowInactivityAlert] = useState(false)
  
  // Verificar si viene de logout por inactividad
  useEffect(() => {
    if (searchParams.get('reason') === 'inactivity') {
      setShowInactivityAlert(true)
      // Limpiar el parametro de la URL sin recargar
      window.history.replaceState({}, '', '/acceso')
    }
    // Abrir tab de registro si viene con parametro tab=registro
    const tab = searchParams.get('tab')
    if (tab === 'registro') {
      setActiveTab('registro')
      // Limpiar parametro de URL
      window.history.replaceState({}, '', '/acceso')
    }
  }, [searchParams])
  
  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Registro rapido state (solo nombre para cuenta anonima)
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [codigoReferido, setCodigoReferido] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const [emailRegistrado, setEmailRegistrado] = useState('')
  const [showAyudaUrgente, setShowAyudaUrgente] = useState(false)
  
  // Estado para notificaciones de simulacion
  const [simulationResult, setSimulationResult] = useState<{
    show: boolean
    type: 'leads' | 'abogados' | 'usuarios' | null
    success: boolean
    data?: Record<string, unknown>
    error?: string
  }>({ show: false, type: null, success: false })
  const [simulationLoading, setSimulationLoading] = useState<'leads' | 'abogados' | 'usuarios' | null>(null)

  const router = useRouter()

  // Verificar si ya hay sesion activa (solo redirige si hay sesion, NO auto-login)
  useEffect(() => {
    let isMounted = true
    
    const checkSession = async () => {
      try {
        const supabase = createClient()
        
        // Verificar si ya hay sesion activa
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (session) {
          window.location.href = '/dashboard'
          return
        }
        
        // Verificar si hay credenciales guardadas (para mostrar boton de acceso rapido)
        const saved = localStorage.getItem(GUEST_CREDENTIALS_KEY)
        if (saved) {
          const credentials: GuestCredentials = JSON.parse(saved)
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
          if (Date.now() - credentials.createdAt < thirtyDaysMs) {
            setSavedGuest(credentials)
            setSavedGuestName(credentials.nombre)
            setAutoLoggingIn(true)
          } else {
            localStorage.removeItem(GUEST_CREDENTIALS_KEY)
          }
        }
      } catch (err) {
        // Ignorar errores de abort cuando el componente se desmonta
        if (err instanceof Error && err.name === 'AbortError') return
        if (isMounted) console.error('Session check error:', err)
      } finally {
        if (isMounted) setCheckingSession(false)
      }
    }
    
    checkSession()
    
    return () => { isMounted = false }
  }, [])

  // Funcion para acceso rapido con cuenta guardada
  const handleQuickLogin = async () => {
    if (!savedGuest) return
    
    setQuickLoginLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email: savedGuest.email,
        password: savedGuest.password
      })
      
      if (!error) {
        window.location.href = '/dashboard'
        return
      } else {
        localStorage.removeItem(GUEST_CREDENTIALS_KEY)
        setSavedGuest(null)
        setError('La sesion guardada ha expirado. Por favor crea una nueva cuenta.')
      }
    } catch (err) {
      console.error('Quick login error:', err)
      setError('Error al iniciar sesion. Intenta de nuevo.')
    } finally {
      setQuickLoginLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await loginUsuario(email, password)

      if (result.error) {
        if (result.error.includes('Failed to fetch') || result.error.includes('NetworkError')) {
          setError('Error de conexion. Por favor verifica tu internet e intenta de nuevo.')
        } else {
          setError(result.error)
        }
        setLoading(false)
      } else if (result.redirectTo) {
        window.location.href = result.redirectTo
      } else {
        setLoading(false)
      }
    } catch {
      setError('Error de conexion. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await registrarUsuarioGuest({
        nombre: regNombre,
        codigoReferido: codigoReferido || undefined
      })

      if (result.error) {
        // Traducir errores comunes
        if (result.error.includes('Failed to fetch') || result.error.includes('NetworkError')) {
          setError('Error de conexion. Por favor verifica tu internet e intenta de nuevo.')
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }

      if (result.data?.success) {
        // Guardar credenciales en localStorage para auto-login futuro
        if (result.data.guestCredentials) {
          const credentialsToSave: GuestCredentials = {
            ...result.data.guestCredentials,
            createdAt: Date.now()
          }
          localStorage.setItem(GUEST_CREDENTIALS_KEY, JSON.stringify(credentialsToSave))
        }
        
        // Redirigir directamente al dashboard
        window.location.href = result.data.redirectTo || '/dashboard'
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Error de conexion. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  // Mientras verifica sesion, mostrar pantalla de carga breve
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="text-center text-white">
          <Scale className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <Scale className="w-10 h-10" />
            <span className="text-2xl font-bold">MeCorrieron.mx</span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Calcula tu liquidacion laboral en minutos
          </h1>
          
          <p className="text-blue-100 text-lg mb-8">
            Conoce cuanto te corresponde legalmente y pelea por lo que es tuyo.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Calculo preciso</p>
                <p className="text-blue-200 text-sm">Basado en la Ley Federal del Trabajo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">100% confidencial</p>
                <p className="text-blue-200 text-sm">Tus datos estan protegidos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scale className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Asesoria legal</p>
                <p className="text-blue-200 text-sm">Abogados especialistas a tu disposicion</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formularios */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-white">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MeCorrieron.mx</span>
          </div>

          {/* Acceso rapido si hay cuenta guardada */}
          {savedGuest && (
            <Card className="border-0 shadow-lg mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {savedGuest.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{savedGuest.nombre}</p>
                    <p className="text-xs text-gray-500">Cuenta guardada en este dispositivo</p>
                  </div>
                </div>
                <Button 
                  onClick={handleQuickLogin}
                  disabled={quickLoginLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {quickLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Continuar como {savedGuest.nombre}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  O usa otra cuenta abajo
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl">
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'login' | 'registro')
              setError(null)
              setLoading(false)
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-0 rounded-b-none">
                <TabsTrigger value="login">Iniciar sesion</TabsTrigger>
                <TabsTrigger value="registro">Crear cuenta</TabsTrigger>
              </TabsList>

{/* Tab Login */}
  <TabsContent value="login" className="mt-0">
  <CardHeader className="pb-4">
    <CardTitle className="text-xl">Bienvenido de vuelta</CardTitle>
    <CardDescription>
      Ingresa tus credenciales para acceder
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Alerta de sesion cerrada por inactividad */}
    {showInactivityAlert && (
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Tu sesion fue cerrada por inactividad. Por seguridad, los usuarios verificados deben iniciar sesion nuevamente.
        </AlertDescription>
      </Alert>
    )}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electronico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={email || ''}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contrasena</Label>
                        <Link href="/recuperar" className="text-xs text-primary hover:underline">
                          Olvidaste tu contrasena?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tu contrasena"
                          value={password || ''}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Ingresando...
                        </>
                      ) : (
                        'Iniciar sesion'
                      )}
                    </Button>
                  </form>

                  {/* Test users section */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Usuarios de prueba (desarrollo)
                    </p>
<div className="grid grid-cols-3 gap-2">
                      {TEST_USERS.map((user) => (
                        <Button
                          key={user.email}
                          variant="outline"
                          size="sm"
                          className={`text-xs bg-transparent ${
                            user.role === 'superadmin' ? 'border-red-300 text-red-600 hover:bg-red-50' :
                            user.role === 'admin' ? 'border-purple-300 text-purple-600 hover:bg-purple-50' :
                            user.role === 'lawyer' ? 'border-blue-300 text-blue-600 hover:bg-blue-50' :
                            user.role === 'guestlawyer' ? 'border-cyan-300 text-cyan-600 hover:bg-cyan-50' :
                            user.role === 'worker' ? 'border-green-300 text-green-600 hover:bg-green-50' :
                            'border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            setEmail(user.email)
                            setPassword(user.password)
                          }}
                        >
                          {user.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Password: Cancun2026
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/dev/init-test-users', { method: 'POST' })
                          const data = await res.json()
                          if (data.results) {
                            alert('Usuarios de prueba inicializados. Revisa la consola para detalles.')
                          }
                        } catch {
                          alert('Error al inicializar usuarios')
                        }
                      }}
                    >
                      Inicializar usuarios de prueba
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      disabled={simulationLoading !== null}
                      onClick={async () => {
                        setSimulationLoading('leads')
                        try {
                          const res = await fetch('/api/dev/create-simulation-data', { method: 'POST' })
                          const data = await res.json()
                          setSimulationResult({
                            show: true,
                            type: 'leads',
                            success: data.success,
                            data: data.data,
                            error: data.error
                          })
                        } catch {
                          setSimulationResult({
                            show: true,
                            type: 'leads',
                            success: false,
                            error: 'Error de conexion'
                          })
                        } finally {
                          setSimulationLoading(null)
                        }
                      }}
                    >
                      {simulationLoading === 'leads' ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Creando leads...</>
                      ) : 'Crear 100 leads de simulacion'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      disabled={simulationLoading !== null}
                      onClick={async () => {
                        setSimulationLoading('abogados')
                        try {
                          const res = await fetch('/api/dev/create-lawyers-simulation', { method: 'POST' })
                          const data = await res.json()
                          setSimulationResult({
                            show: true,
                            type: 'abogados',
                            success: data.success,
                            data: data.data,
                            error: data.error
                          })
                        } catch {
                          setSimulationResult({
                            show: true,
                            type: 'abogados',
                            success: false,
                            error: 'Error de conexion'
                          })
                        } finally {
                          setSimulationLoading(null)
                        }
                      }}
                    >
                      {simulationLoading === 'abogados' ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Creando abogados...</>
                      ) : 'Crear 20 abogados de simulacion'}
                    </Button>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No tienes cuenta?{' '}
                      <button 
                        onClick={() => setActiveTab('registro')}
                        className="text-primary font-medium hover:underline"
                      >
                        Crear una gratis
                      </button>
                    </p>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Tab Registro Rapido - Solo nombre */}
              <TabsContent value="registro" className="mt-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Empieza en 10 segundos</CardTitle>
                  <CardDescription>
                    Solo necesitas tu nombre. Sin correo, sin contrasena.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegistro} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="regNombre">Como te llamas?</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="regNombre"
                          type="text"
                          placeholder="Tu primer nombre"
                          value={regNombre || ''}
                          onChange={(e) => setRegNombre(e.target.value)}
                          className="pl-10 h-12 text-lg"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigoReferido">Codigo de quien te refirio (opcional)</Label>
                      <Input
                        id="codigoReferido"
                        type="text"
                        placeholder="MC-XXXXXX"
                        value={codigoReferido || ''}
                        onChange={(e) => setCodigoReferido(e.target.value.toUpperCase())}
                        className="uppercase"
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Checkbox de aceptacion de terminos */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
                      <input 
                        type="checkbox" 
                        id="aceptaTerminos"
                        required
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="aceptaTerminos" className="text-sm text-gray-700 leading-relaxed">
                        He leido y acepto los{' '}
                        <Link href="/legal" target="_blank" className="text-primary font-medium hover:underline">
                          Terminos y Condiciones
                        </Link>
                        {' '}incluyendo el contrato de servicios legales, asi como el{' '}
                        <Link href="/legal?tab=privacidad" target="_blank" className="text-primary font-medium hover:underline">
                          Aviso de Privacidad
                        </Link>
                      </label>
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          Entrar como invitado
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-blue-800 text-sm">
                        Crea tu contrasena y verifica tu cuenta mas tarde desde tu perfil
                      </p>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Ya tienes cuenta?{' '}
                      <button 
                        onClick={() => setActiveTab('login')}
                        className="text-primary font-medium hover:underline"
                      >
                        Iniciar sesion
                      </button>
                    </p>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                <Home className="w-4 h-4" />
                Inicio
              </Button>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/calculadora?modo=basico">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                <Calculator className="w-4 h-4" />
                Calculadora
              </Button>
            </Link>
            <span className="text-muted-foreground">|</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 font-semibold"
              onClick={() => setShowAyudaUrgente(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              Ayuda Urgente
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Ayuda Urgente */}
      <AyudaUrgenteFlow
        open={showAyudaUrgente}
        onOpenChange={setShowAyudaUrgente}
      />

      {/* Modal de notificacion de simulacion */}
      {simulationResult.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-0">
            <CardHeader className={`pb-3 ${simulationResult.success ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'} text-white rounded-t-lg`}>
              <div className="flex items-center gap-3">
                {simulationResult.success ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
                <div>
                  <CardTitle className="text-lg">
                    {simulationResult.success ? 'Simulacion Creada' : 'Error en Simulacion'}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {simulationResult.type === 'leads' && 'Datos de leads y cotizaciones'}
                    {simulationResult.type === 'abogados' && 'Abogados pendientes de verificar'}
                    {simulationResult.type === 'usuarios' && 'Usuarios de prueba'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              {simulationResult.success ? (
                <div className="space-y-4">
                  {simulationResult.type === 'leads' && simulationResult.data && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-amber-600">{String(simulationResult.data.cotizaciones_creadas || 0)}</div>
                          <div className="text-xs text-amber-700 mt-1">Cotizaciones creadas</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-blue-600">{String(simulationResult.data.casos_creados || 0)}</div>
                          <div className="text-xs text-blue-700 mt-1">Casos generados</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Los leads estan listos para asignar desde el panel de admin o abogado.
                      </p>
                    </>
                  )}
                  {simulationResult.type === 'abogados' && simulationResult.data && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-blue-600">{String(simulationResult.data.profiles_creados || 0)}</div>
                          <div className="text-xs text-blue-700 mt-1">Perfiles creados</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-purple-600">{String(simulationResult.data.lawyer_profiles_creados || 0)}</div>
                          <div className="text-xs text-purple-700 mt-1">Lawyer profiles</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Password comun:</span>
                          <code className="bg-slate-200 px-2 py-0.5 rounded text-xs font-mono">
                            {String(simulationResult.data.password_comun || 'SimulacionAbogado2026')}
                          </code>
                        </div>
                        <div className="text-xs text-slate-500">
                          <span className="text-emerald-600 font-medium">10 con documentos completos</span> (pendientes revision)<br/>
                          <span className="text-amber-600 font-medium">10 con perfil incompleto</span> (sin documentos)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-600 font-medium">{simulationResult.error || 'Error desconocido'}</p>
                  <p className="text-sm text-muted-foreground mt-2">Revisa la consola para mas detalles.</p>
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6">
              <Button 
                className="w-full" 
                onClick={() => setSimulationResult({ show: false, type: null, success: false })}
              >
                Entendido
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
