'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Key, Mail, User, Copy, LogIn, ExternalLink, RefreshCw, 
  CheckCircle, AlertTriangle, Clock, FileText, Bell, Loader2, Shield
} from 'lucide-react'
import { SinacolAuthorization } from './sinacol-authorization'
import { SinacolAutomationInfo } from './sinacol-automation-info'

interface CCLAccount {
  id: string
  estado: string
  email_portal: string | null // SINACOL no usa email
  password_portal: string | null // SINACOL no usa password
  url_portal: string
  url_login: string // URL real de SINACOL
  url_buzon: string
  url_sinacol?: string // URL directa al formulario SINACOL
  folio_solicitud: string // Referencia interna (no folio oficial)
  status: string
  buzon_activo: boolean
  ultimo_check_buzon: string | null
  notificaciones_pendientes: number
  created_at: string
  notas?: string
}

interface CCLPortalTabProps {
  casoId: string
  caso: any
  worker: any
  onRefresh: () => void
}

export function CCLPortalTab({ casoId, caso, worker, onRefresh }: CCLPortalTabProps) {
  const [accounts, setAccounts] = useState<CCLAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [hasAuthorization, setHasAuthorization] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)

  useEffect(() => {
    loadAccounts()
    checkAuthorization()
  }, [casoId])
  
  async function checkAuthorization() {
    try {
      const res = await fetch(`/api/ccl/authorization?casoId=${casoId}`)
      const data = await res.json()
      setHasAuthorization(data.authorized === true)
    } catch (err) {
      console.error('[v0] Error checking authorization:', err)
    }
  }

  async function loadAccounts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ccl/accounts?casoId=${casoId}`)
      const data = await res.json()
      if (data.accounts) {
        setAccounts(data.accounts)
      }
    } catch (err) {
      console.error('[v0] Error loading CCL accounts:', err)
    }
    setLoading(false)
  }

  async function createAccount() {
    if (!worker?.full_name || !worker?.curp) {
      alert('El trabajador debe tener nombre completo y CURP para crear cuenta en el portal CCL')
      return
    }

    setCreating(true)
    try {
      const estado = caso.direccion_trabajo_estado || caso.estado || 'Ciudad de Mexico'
      
      const datosTrabajador = {
        nombre_completo: worker.full_name,
        curp: worker.curp,
        rfc: worker.rfc || worker.curp?.slice(0, 10) + 'XXX',
        fecha_nacimiento: worker.fecha_nacimiento || '1990-01-01',
        sexo: worker.sexo === 'femenino' ? 'M' : 'H',
        email_personal: worker.email || '',
        telefono: worker.phone || '',
        direccion: `${worker.calle || ''} ${worker.numero_exterior || ''}`.trim() || 'Sin direccion',
        ciudad: worker.municipio || caso.ciudad || estado,
        codigo_postal: worker.codigo_postal || '00000',
        empresa_nombre: caso.empresa_nombre || 'Empresa',
        puesto: caso.puesto_trabajo || 'Empleado',
        salario_diario: caso.calculo?.salario_diario || 500,
        fecha_ingreso: caso.calculo?.fecha_ingreso || '2020-01-01',
        fecha_despido: caso.calculo?.fecha_salida || new Date().toISOString().split('T')[0]
      }

      const res = await fetch('/api/ccl/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado,
          datosTrabajador,
          opciones: {
            casoId,
            userId: worker.id,
            esPrueba: false
          }
        })
      })

      const result = await res.json()
      
      if (result.exito) {
        await loadAccounts()
        onRefresh()
      } else {
        alert(result.error || 'Error al crear cuenta CCL')
      }
    } catch (err) {
      console.error('[v0] Error creating CCL account:', err)
      alert('Error al crear la cuenta en el portal CCL')
    }
    setCreating(false)
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const mainAccount = accounts[0]

  return (
    <div className="space-y-4">
      {/* Acceso a SINACOL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="h-4 w-4" />
            Portal SINACOL - Centro de Conciliacion
          </CardTitle>
          <CardDescription>
            Enlace al portal oficial SINACOL para iniciar solicitud de conciliacion laboral
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mainAccount ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge className={
                  mainAccount.status === 'activa' ? 'bg-green-600' :
                  mainAccount.status === 'pendiente_sinacol' ? 'bg-yellow-600' :
                  mainAccount.status === 'error' ? 'bg-red-600' : 'bg-gray-600'
                }>
                  {mainAccount.status === 'activa' ? 'Solicitud Completada' :
                   mainAccount.status === 'pendiente_sinacol' ? 'Pendiente en SINACOL' :
                   mainAccount.status === 'error' ? 'Error' : mainAccount.status}
                </Badge>
                {mainAccount.buzon_activo && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    <Bell className="h-3 w-3 mr-1" />
                    Buzon Activo
                  </Badge>
                )}
                {mainAccount.notificaciones_pendientes > 0 && (
                  <Badge className="bg-orange-600">
                    {mainAccount.notificaciones_pendientes} notificacion(es)
                  </Badge>
                )}
              </div>

              {/* Referencia Interna */}
              {mainAccount.folio_solicitud && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Referencia Interna (Mecorrieron.mx):</p>
                  <p className="font-mono font-bold text-sm text-blue-800 dark:text-blue-300">
                    {mainAccount.folio_solicitud}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    Nota: El folio oficial de SINACOL se genera al completar la solicitud en el portal.
                  </p>
                </div>
              )}

              {/* Informacion SINACOL */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Datos para Solicitud SINACOL
                </p>
                
                {/* CURP */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> CURP del trabajador:
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(worker?.curp || '', 'curp')}
                    >
                      {copiedField === 'curp' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="block p-2 bg-white dark:bg-black rounded text-lg font-mono font-bold select-all text-center tracking-wider">
                    {worker?.curp || 'Sin CURP'}
                  </code>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                    SINACOL cargara automaticamente los datos del trabajador con su CURP
                  </p>
                </div>

                {/* Aviso importante */}
                <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900 rounded text-xs text-amber-800 dark:text-amber-300">
                  <strong>Nota:</strong> El portal SINACOL es el sistema oficial del gobierno. 
                  Despues del pre-registro en linea, se requiere ratificacion presencial con 
                  identificacion oficial vigente.
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => window.open(mainAccount.url_login, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir a SINACOL
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(mainAccount.url_buzon, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Info CCL
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={loadAccounts}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Info Portal */}
              <div className="text-xs text-muted-foreground">
                <p>Portal: {mainAccount.url_portal}</p>
                <p>Estado: {mainAccount.estado}</p>
                <p>Creada: {new Date(mainAccount.created_at).toLocaleDateString('es-MX')}</p>
                {mainAccount.ultimo_check_buzon && (
                  <p>Ultimo check buzon: {new Date(mainAccount.ultimo_check_buzon).toLocaleString('es-MX')}</p>
                )}
              </div>
            </div>
          ) : showAuthForm ? (
            /* Formulario de autorizacion */
            <SinacolAuthorization
              casoId={casoId}
              caso={caso}
              worker={worker}
              onAuthorized={() => {
                setHasAuthorization(true)
                setShowAuthForm(false)
                checkAuthorization()
              }}
              onCancel={() => setShowAuthForm(false)}
            />
          ) : !hasAuthorization ? (
            /* Paso 1: Solicitar autorizacion */
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Autorizacion Requerida</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Para gestionar tu solicitud en el portal SINACOL, necesitamos tu autorizacion 
                expresa conforme a la Ley Federal del Trabajo.
              </p>
              <Button onClick={() => setShowAuthForm(true)} className="mb-4">
                <Shield className="h-4 w-4 mr-2" />
                Autorizar Gestion SINACOL
              </Button>
              
              {/* Info de lo que se autoriza */}
              <div className="mt-4 p-3 bg-muted rounded-lg text-left text-sm max-w-md mx-auto">
                <p className="font-medium mb-2">Al autorizar, permites que:</p>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>MeCorrieron.mx te guie en el proceso de conciliacion</li>
                  <li>El abogado asignado te represente ante el CCL</li>
                  <li>Se genere tu solicitud en el portal SINACOL oficial</li>
                  <li>Recibas notificaciones sobre tu caso</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Paso 2: Ya autorizado - mostrar boton para obtener enlace */
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <Badge className="mb-3 bg-green-600">Autorizado</Badge>
              <p className="text-muted-foreground mb-4">
                Ya tienes autorizacion para gestionar tu solicitud SINACOL
              </p>
              <Button onClick={createAccount} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparando enlace...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Obtener Enlace a SINACOL
                  </>
                )}
              </Button>
              
              {/* Requisitos */}
              <div className="mt-4 p-3 bg-muted rounded-lg text-left text-sm max-w-md mx-auto">
                <p className="font-medium mb-2">Verificacion de datos:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    {worker?.full_name ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                    Nombre: {worker?.full_name || 'Pendiente'}
                  </li>
                  <li className="flex items-center gap-2">
                    {worker?.curp ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                    CURP: {worker?.curp || 'Pendiente'}
                  </li>
                  <li className="flex items-center gap-2">
                    {caso?.estado || caso?.direccion_trabajo_estado ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                    Estado: {caso?.direccion_trabajo_estado || caso?.estado || 'Pendiente'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informacion del Agente Inteligente */}
      <SinacolAutomationInfo 
        isAuthorized={hasAuthorization}
        hasAccount={accounts.length > 0}
        folioGenerado={mainAccount?.folio_solicitud}
        currentStep={
          !hasAuthorization ? 0 :
          hasAuthorization && accounts.length === 0 ? 1 :
          accounts.length > 0 && !mainAccount?.folio_solicitud ? 2 :
          3
        }
      />

      {/* Descripcion detallada del proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Descripcion del Proceso Automatizado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Automatizacion con Agente Inteligente
            </h4>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Cuando el trabajador <strong>autoriza explicitamente</strong> el manejo de su caso, 
              nuestro sistema activa un <strong>agente inteligente</strong> que se encarga de:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Generar automaticamente un folio unico</strong> basado en las credenciales y datos proporcionados por el sistema de MeCorrieron, asegurando trazabilidad completa del caso.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Crear automaticamente un usuario con contrasena</strong> en el portal oficial SINACOL del gobierno mexicano, eliminando la necesidad de que el trabajador llene formularios manualmente.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Preparar y enviar la solicitud de conciliacion</strong> con todos los datos laborales, prestaciones reclamadas y datos de la empresa demandada, reduciendo errores de captura.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Gestionar el caso de forma continua</strong>, monitoreando notificaciones del CCL, sincronizando actualizaciones y alertando sobre citas de audiencia.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-medium text-green-800 dark:text-green-300 text-sm mb-1">
                Beneficios para el Trabajador
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Ahorro de hasta 90% del tiempo de llenado</li>
                <li>Eliminacion de errores en datos personales</li>
                <li>Acceso inmediato al portal SINACOL</li>
                <li>Seguimiento automatico del caso</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h5 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-1">
                Tecnologia Utilizada
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Agente de IA para llenado automatico</li>
                <li>Validacion de CURP con RENAPO</li>
                <li>Firma electronica avanzada</li>
                <li>Integracion directa con SINACOL</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Nota Legal:</strong> La automatizacion cumple con la Ley Federal del Trabajo, 
              la Ley Federal de Proteccion de Datos Personales y los lineamientos del Sistema Nacional 
              de Conciliacion Laboral. El trabajador conserva el control total y puede revocar la 
              autorizacion en cualquier momento. Despues del registro automatizado, se requiere 
              ratificacion presencial en el CCL dentro de 5 dias habiles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
