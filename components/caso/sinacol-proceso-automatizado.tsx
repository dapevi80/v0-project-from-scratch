'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, Shield, Key, Mail, Lock, Database, 
  CheckCircle, ArrowRight, User, FileText, 
  Eye, EyeOff, Zap, Clock, AlertTriangle
} from 'lucide-react'

interface ProcesoAutomatizadoProps {
  estado?: string
  isAuthorized?: boolean
  emailGenerado?: string
  folioGenerado?: string
}

/**
 * Componente que explica el proceso técnico de automatización SINACOL
 * Describe cómo el agente inteligente genera credenciales y gestiona el caso
 */
export function SinacolProcesoAutomatizado({ 
  estado = 'Quintana Roo',
  isAuthorized = false,
  emailGenerado,
  folioGenerado
}: ProcesoAutomatizadoProps) {
  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Proceso de Automatización SINACOL</CardTitle>
              <CardDescription>
                Agente inteligente de MeCorrieron.mx
              </CardDescription>
            </div>
          </div>
          <Badge variant={isAuthorized ? 'default' : 'secondary'} className={isAuthorized ? 'bg-green-600' : ''}>
            {isAuthorized ? 'Autorizado' : 'Pendiente Autorización'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Descripción Principal */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Cuando el trabajador <strong className="text-foreground">autoriza explícitamente</strong> el 
            manejo de su caso a través de los términos de uso de la plataforma, el sistema activa un 
            <strong className="text-blue-600 dark:text-blue-400"> agente inteligente</strong> que automatiza 
            completamente el proceso de registro y gestión en el portal oficial SINACOL del gobierno mexicano.
          </p>
        </div>

        {/* Flujo del Proceso */}
        <div className="grid gap-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Proceso Automatizado en 4 Pasos
          </h4>
          
          <div className="grid gap-3">
            {/* Paso 1 */}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${isAuthorized ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/50 border-muted'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isAuthorized ? 'bg-green-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Autorización Explícita del Usuario</span>
                  {isAuthorized && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  El trabajador acepta los términos de uso que incluyen la autorización para que MeCorrieron.mx 
                  y su agente inteligente gestionen su caso. <strong>No hay limitaciones legales ni técnicas</strong> ya 
                  que el usuario autoriza expresamente este proceso.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${emailGenerado ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/50 border-muted'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${emailGenerado ? 'bg-green-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Generación de Email Real Asignado</span>
                  {emailGenerado && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  El sistema genera un <strong>correo electrónico real</strong> asignado por MeCorrieron 
                  (formato: nombre.apellido.ccl.estado.random@gmail.com). Este email se usa exclusivamente 
                  para el registro en SINACOL y recepción de notificaciones oficiales del CCL.
                </p>
                {emailGenerado && (
                  <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-mono">
                    {emailGenerado}
                  </div>
                )}
              </div>
            </div>

            {/* Paso 3 */}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${emailGenerado ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/50 border-muted'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${emailGenerado ? 'bg-green-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Creación Automática de Cuenta SINACOL</span>
                  {emailGenerado && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  El agente inteligente crea automáticamente una cuenta de usuario en el portal oficial 
                  SINACOL del estado correspondiente. La <strong>contraseña se genera aleatoriamente</strong> y 
                  se almacena de forma segura en nuestra base de datos.
                </p>
                
                {/* Aviso de seguridad de contraseña */}
                <Alert className="mt-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs">
                    <strong>Seguridad de Credenciales:</strong> La contraseña generada es 
                    <span className="text-red-600 dark:text-red-400 font-semibold"> visible únicamente para Superadmin</span>. 
                    NO se comparte con el cliente ni con el abogado asignado, garantizando la seguridad del proceso.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Paso 4 */}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${folioGenerado ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-muted/50 border-muted'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${folioGenerado ? 'bg-green-600 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Generación de Folio Único</span>
                  {folioGenerado && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  Basándose en las credenciales y datos proporcionados por MeCorrieron, el sistema genera 
                  un <strong>folio único de referencia interna</strong> que permite rastrear el caso. 
                  El folio oficial de SINACOL se obtiene al completar el registro en el portal gubernamental.
                </p>
                {folioGenerado && (
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm font-mono font-bold text-green-800 dark:text-green-300">
                    {folioGenerado}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información Técnica */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <h5 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Beneficios para el Trabajador
            </h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Cero llenado manual</strong> - El agente completa todos los formularios</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Eliminación de errores</strong> - Sin errores de captura de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Acceso inmediato</strong> - Cuenta SINACOL lista en minutos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Sin conocimiento técnico</strong> - Ideal para personas no expertas en tecnología</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Seguridad y Privacidad
            </h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Contraseña encriptada</strong> - Almacenada con AES-256</span>
              </li>
              <li className="flex items-start gap-2">
                <EyeOff className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Acceso restringido</strong> - Solo visible para Superadmin</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Autorización expresa</strong> - Cumple con LFPDPPP</span>
              </li>
              <li className="flex items-start gap-2">
                <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>Auditoría completa</strong> - Registro de todas las acciones</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Portal de acceso */}
        <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-600 rounded">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
            <div>
              <h5 className="font-semibold">Portal de Acceso SINACOL - {estado}</h5>
              <p className="text-xs text-muted-foreground">URL verificada y funcional</p>
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-950 rounded border font-mono text-sm break-all">
            {estado === 'Quintana Roo' 
              ? 'https://conciliacion.cclqroo.gob.mx/login'
              : `https://sinacol.${estado.toLowerCase().replace(/ /g, '')}.gob.mx/login`
            }
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            El agente inteligente accede a este portal para crear la cuenta y gestionar el caso del trabajador.
          </p>
        </div>

        {/* Nota legal */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Nota Legal:</strong> El proceso automatizado se ejecuta con los datos personales reales 
            del usuario, conforme a la autorización otorgada en los términos de uso de MeCorrieron.mx. 
            No existen limitaciones legales ni técnicas para este proceso ya que el cliente autoriza 
            expresamente la gestión automatizada de su caso. Después del pre-registro automatizado, 
            se requiere ratificación presencial en el CCL correspondiente dentro de 3-5 días hábiles.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
