'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight,
  Scale, 
  Building2, 
  User, 
  CheckCircle2,
  Loader2,
  Shield,
  Briefcase,
  Eye,
  EyeOff,
  Ticket,
  FileCheck,
  Clock,
  Users
} from 'lucide-react'
import { registrarGuestAbogado } from './actions'

type Fase = 'inicio' | 'registro' | 'preview' | 'completado'

export default function RegistroAbogadosPage() {
  const router = useRouter()
  const [fase, setFase] = useState<Fase>('inicio')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Codigo de referido
  const [codigoReferido, setCodigoReferido] = useState('')
  const [tieneReferido, setTieneReferido] = useState(false)
  
  // Tipo de registro
  const [tipoRegistro, setTipoRegistro] = useState<'abogado' | 'despacho' | null>(null)
  
  // Form datos basicos
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    cedula: '',
    universidad: '',
    estado: 'Ciudad de Mexico',
    codigoPostal: ''
  })
  
  // Aceptacion de terminos
  const [aceptaTerminos, setAceptaTerminos] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aceptaTerminos) {
      setError('Debes aceptar los terminos y condiciones')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const result = await registrarGuestAbogado({
      ...formData,
      codigoReferido: tieneReferido ? codigoReferido : undefined,
      tipoRegistro: tipoRegistro || 'abogado'
    })
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setFase('completado')
      setLoading(false)
    }
  }

  // Fase 1: Inicio - Bienvenida y codigo de referido
  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Portal de Abogados</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Unete a Me corrieron!</h1>
            <p className="text-muted-foreground text-lg">
              Conecta con trabajadores que necesitan asesoria legal especializada
            </p>
          </div>

          {/* Beneficios */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Card className="text-center p-4">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Casos verificados</p>
              <p className="text-xs text-muted-foreground">Trabajadores reales</p>
            </Card>
            <Card className="text-center p-4">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Plataforma segura</p>
              <p className="text-xs text-muted-foreground">Datos protegidos</p>
            </Card>
            <Card className="text-center p-4">
              <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Herramientas</p>
              <p className="text-xs text-muted-foreground">Gestion de casos</p>
            </Card>
          </div>

          {/* Codigo de referido */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">Codigo de referido</CardTitle>
              </div>
              <CardDescription>
                Si un despacho te invito, ingresa su codigo para vincularte automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="tieneReferido"
                  checked={tieneReferido}
                  onChange={(e) => setTieneReferido(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="tieneReferido" className="text-sm cursor-pointer">
                  Tengo un codigo de referido
                </Label>
              </div>
              
              {tieneReferido && (
                <Input
                  placeholder="Ingresa el codigo (ej: DESP-ABC123)"
                  value={codigoReferido}
                  onChange={(e) => setCodigoReferido(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              )}
            </CardContent>
          </Card>

          {/* Tipo de registro */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tipo de registro</CardTitle>
              <CardDescription>
                Selecciona como deseas registrarte en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setTipoRegistro('abogado')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  tipoRegistro === 'abogado' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <User className={`w-5 h-5 mt-0.5 ${tipoRegistro === 'abogado' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Abogado independiente</p>
                    <p className="text-sm text-muted-foreground">
                      Registrate como abogado individual para recibir casos directamente
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setTipoRegistro('despacho')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  tipoRegistro === 'despacho' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Building2 className={`w-5 h-5 mt-0.5 ${tipoRegistro === 'despacho' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Despacho o firma</p>
                    <p className="text-sm text-muted-foreground">
                      Registra tu despacho y genera codigos para invitar a tu equipo
                    </p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Boton continuar */}
          <Button 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            disabled={!tipoRegistro}
            onClick={() => setFase('registro')}
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Ya tengo cuenta */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Ya tienes cuenta?{' '}
            <Link href="/acceso" className="text-blue-600 hover:underline font-medium">
              Iniciar sesion
            </Link>
          </p>
        </main>
      </div>
    )
  }

  // Fase 2: Registro - Crear cuenta guestabogado
  if (fase === 'registro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => setFase('inicio')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atras</span>
            </button>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Crear cuenta</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
            <div className="w-12 h-1 bg-blue-600 rounded" />
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">2</div>
            <div className="w-12 h-1 bg-gray-200 rounded" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">3</div>
          </div>

          <Card>
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {tipoRegistro === 'despacho' ? (
                  <Building2 className="w-6 h-6 text-blue-600" />
                ) : (
                  <User className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <CardTitle>
                {tipoRegistro === 'despacho' ? 'Registrar despacho' : 'Datos del abogado'}
              </CardTitle>
              <CardDescription>
                Crea tu cuenta para acceder a la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nombre">Nombre(s)</Label>
                    <Input
                      id="nombre"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                      placeholder="Perez Lopez"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="abogado@email.com"
                  />
                </div>

                {/* Telefono */}
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="55 1234 5678"
                  />
                </div>

                {/* Cedula */}
                <div>
                  <Label htmlFor="cedula">Cedula profesional</Label>
                  <Input
                    id="cedula"
                    required
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    placeholder="12345678"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sera verificada en el Registro Nacional de Profesionistas
                  </p>
                </div>

                {/* Universidad */}
                <div>
                  <Label htmlFor="universidad">Universidad de egreso</Label>
                  <Input
                    id="universidad"
                    value={formData.universidad}
                    onChange={(e) => setFormData({...formData, universidad: e.target.value})}
                    placeholder="UNAM, IPN, UAM..."
                  />
                </div>

                {/* Estado y Codigo Postal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <select
                      id="estado"
                      required
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="Aguascalientes">Aguascalientes</option>
                      <option value="Baja California">Baja California</option>
                      <option value="Baja California Sur">Baja California Sur</option>
                      <option value="Campeche">Campeche</option>
                      <option value="Chiapas">Chiapas</option>
                      <option value="Chihuahua">Chihuahua</option>
                      <option value="Ciudad de Mexico">Ciudad de Mexico</option>
                      <option value="Coahuila">Coahuila</option>
                      <option value="Colima">Colima</option>
                      <option value="Durango">Durango</option>
                      <option value="Estado de Mexico">Estado de Mexico</option>
                      <option value="Guanajuato">Guanajuato</option>
                      <option value="Guerrero">Guerrero</option>
                      <option value="Hidalgo">Hidalgo</option>
                      <option value="Jalisco">Jalisco</option>
                      <option value="Michoacan">Michoacan</option>
                      <option value="Morelos">Morelos</option>
                      <option value="Nayarit">Nayarit</option>
                      <option value="Nuevo Leon">Nuevo Leon</option>
                      <option value="Oaxaca">Oaxaca</option>
                      <option value="Puebla">Puebla</option>
                      <option value="Queretaro">Queretaro</option>
                      <option value="Quintana Roo">Quintana Roo</option>
                      <option value="San Luis Potosi">San Luis Potosi</option>
                      <option value="Sinaloa">Sinaloa</option>
                      <option value="Sonora">Sonora</option>
                      <option value="Tabasco">Tabasco</option>
                      <option value="Tamaulipas">Tamaulipas</option>
                      <option value="Tlaxcala">Tlaxcala</option>
                      <option value="Veracruz">Veracruz</option>
                      <option value="Yucatan">Yucatan</option>
                      <option value="Zacatecas">Zacatecas</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="codigoPostal">Codigo postal</Label>
                    <Input
                      id="codigoPostal"
                      required
                      maxLength={5}
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({...formData, codigoPostal: e.target.value.replace(/\D/g, '')})}
                      placeholder="77500"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Contrasena</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Minimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referido badge */}
                {tieneReferido && codigoReferido && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Ticket className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Codigo de referido: <span className="font-mono font-medium">{codigoReferido}</span>
                    </span>
                  </div>
                )}

                {/* Terminos */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
                  <input 
                    type="checkbox" 
                    id="terminos"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terminos" className="text-sm text-gray-700 leading-relaxed">
                    Acepto los{' '}
                    <Link href="/legal" target="_blank" className="text-blue-600 font-medium hover:underline">
                      Terminos y Condiciones
                    </Link>
                    {' '}y el{' '}
                    <Link href="/legal?tab=privacidad" target="_blank" className="text-blue-600 font-medium hover:underline">
                      Aviso de Privacidad
                    </Link>
                  </label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear cuenta
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info cuenta invitado */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 text-sm">Cuenta de previsualizacion</p>
                <p className="text-xs text-blue-700 mt-1">
                  Tu cuenta iniciara como <strong>invitado</strong> con acceso limitado. 
                  Podras ver las funciones de la plataforma mientras verificamos tu cedula profesional.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Fase 3: Completado
  if (fase === 'completado') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Cuenta creada exitosamente</CardTitle>
            <CardDescription className="text-base">
              Tu solicitud ha sido enviada para verificación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 justify-center mb-2">
                <FileCheck className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-900">En proceso de verificación</span>
              </div>
              <p className="text-sm text-amber-800">
                Un administrador verificará tu cédula profesional. 
                Mientras tanto, puedes acceder a la plataforma con funciones limitadas.
              </p>
            </div>

            {/* Qué sigue */}
            <div className="text-left space-y-3">
              <p className="font-medium text-sm">Próximos pasos:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <p className="text-muted-foreground">Verificaremos tu cédula en el Registro Nacional de Profesionistas</p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <p className="text-muted-foreground">Recibirás un correo cuando tu cuenta sea verificada</p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <p className="text-muted-foreground">Podrás recibir casos y generar tu cédula digital</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push('/acceso')}
              >
                Iniciar sesion
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={() => router.push('/')}
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
