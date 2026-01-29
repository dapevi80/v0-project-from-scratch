'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, FileText, ExternalLink, CheckCircle, AlertTriangle,
  Scale, User, Building2, Loader2
} from 'lucide-react'
import { PORTALES_CCL } from '@/lib/ccl/account-service'

interface SinacolAuthorizationProps {
  casoId: string
  caso?: {
    empresa_nombre?: string
    empresa_rfc?: string
    direccion_trabajo?: string
    direccion_trabajo_estado?: string
    estado?: string
  }
  worker?: {
    full_name?: string
    curp?: string
    phone?: string
    email?: string
  }
  onAuthorized: () => void
  onCancel?: () => void
}

const DISCLOSURES = [
  {
    id: 'mecorrieron',
    field: 'autoriza_mecorrieron',
    title: 'Autorizacion a MeCorrieron.mx',
    description: 'Autorizo a MeCorrieron.mx a gestionar mi caso de conciliacion laboral, incluyendo el acceso a mis datos personales (CURP, nombre, datos laborales) para la preparacion de mi solicitud ante el Centro de Conciliacion Laboral.',
    required: true,
    icon: Scale
  },
  {
    id: 'abogado',
    field: 'autoriza_abogado',
    title: 'Autorizacion al Abogado Asignado',
    description: 'Autorizo al abogado asignado por MeCorrieron.mx a representarme en el proceso de conciliacion laboral, actuar en mi nombre y recibir notificaciones relacionadas con mi caso.',
    required: true,
    icon: User
  },
  {
    id: 'sinacol',
    field: 'autoriza_sinacol',
    title: 'Autorizacion para Registro en SINACOL',
    description: 'Autorizo a MeCorrieron.mx y al abogado asignado a crear y gestionar mi solicitud de conciliacion laboral en el portal oficial SINACOL (Sistema Nacional de Conciliacion Laboral), utilizando mi CURP y datos personales.',
    required: true,
    icon: FileText
  },
  {
    id: 'notificaciones',
    field: 'autoriza_notificaciones',
    title: 'Autorizacion para Notificaciones',
    description: 'Autorizo recibir notificaciones por correo electronico, SMS y WhatsApp sobre el estado de mi caso, citas de conciliacion, y documentos relacionados.',
    required: false,
    icon: ExternalLink
  }
]

export function SinacolAuthorization({
  casoId,
  caso,
  worker,
  onAuthorized,
  onCancel
}: SinacolAuthorizationProps) {
  const [authorizations, setAuthorizations] = useState({
    autoriza_mecorrieron: false,
    autoriza_abogado: false,
    autoriza_sinacol: false,
    autoriza_notificaciones: true,
    terminos_aceptados: false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const estado = caso?.direccion_trabajo_estado || caso?.estado || 'Ciudad de Mexico'
  const portal = PORTALES_CCL[estado]

  const allRequiredAccepted = 
    authorizations.autoriza_mecorrieron && 
    authorizations.autoriza_abogado && 
    authorizations.autoriza_sinacol &&
    authorizations.terminos_aceptados

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setAuthorizations(prev => ({ ...prev, [field]: checked }))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!allRequiredAccepted) {
      setError('Debe aceptar todas las autorizaciones obligatorias')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ccl/authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casoId,
          autorizaMecorrieron: authorizations.autoriza_mecorrieron,
          autorizaAbogado: authorizations.autoriza_abogado,
          autorizaSinacol: authorizations.autoriza_sinacol,
          autorizaNotificaciones: authorizations.autoriza_notificaciones,
          terminosAceptados: authorizations.terminos_aceptados,
          curpFirmante: worker?.curp || '',
          nombreFirmante: worker?.full_name || '',
          empresaRazonSocial: caso?.empresa_nombre || '',
          empresaRfc: caso?.empresa_rfc || '',
          estadoCcl: estado,
          urlSinacol: portal?.urlSinacol || ''
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onAuthorized()
      } else {
        setError(result.error || 'Error al guardar la autorizacion')
      }
    } catch (err) {
      console.error('[v0] Error saving authorization:', err)
      setError('Error de conexion. Intente nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-base">
          <Shield className="h-5 w-5" />
          Autorizacion Legal SINACOL
        </CardTitle>
        <CardDescription>
          Para gestionar tu caso ante el Centro de Conciliacion Laboral, necesitamos tu autorizacion expresa 
          conforme a la Ley Federal del Trabajo y la Ley Federal de Proteccion de Datos Personales.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Datos del caso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white dark:bg-black rounded-lg border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trabajador</p>
            <p className="font-medium text-sm">{worker?.full_name || 'No especificado'}</p>
            <p className="text-xs text-muted-foreground font-mono">{worker?.curp || 'Sin CURP'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Empresa Demandada</p>
            <p className="font-medium text-sm">{caso?.empresa_nombre || 'No especificada'}</p>
            <p className="text-xs text-muted-foreground">Estado: {estado}</p>
          </div>
        </div>

        {/* Autorizaciones */}
        <div className="space-y-3">
          {DISCLOSURES.map((disclosure) => {
            const Icon = disclosure.icon
            const isChecked = authorizations[disclosure.field as keyof typeof authorizations]
            
            return (
              <div 
                key={disclosure.id} 
                className={`p-3 rounded-lg border transition-colors ${
                  isChecked 
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' 
                    : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={disclosure.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleCheckboxChange(disclosure.field, checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={disclosure.id} 
                      className="flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Icon className="h-4 w-4 text-amber-600" />
                      {disclosure.title}
                      {disclosure.required && (
                        <span className="text-red-500 text-xs">*Obligatorio</span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {disclosure.description}
                    </p>
                  </div>
                  {isChecked && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            )
          })}

          {/* Terminos y condiciones */}
          <div 
            className={`p-3 rounded-lg border transition-colors ${
              authorizations.terminos_aceptados 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700' 
                : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="terminos"
                checked={authorizations.terminos_aceptados}
                onCheckedChange={(checked) => handleCheckboxChange('terminos_aceptados', checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="terminos" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Scale className="h-4 w-4 text-amber-600" />
                  Acepto los Terminos y Condiciones
                  <span className="text-red-500 text-xs">*Obligatorio</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  He leido y acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-blue-600 underline">
                    Terminos de Servicio
                  </a>{' '}
                  y el{' '}
                  <a href="/privacidad" target="_blank" className="text-blue-600 underline">
                    Aviso de Privacidad
                  </a>{' '}
                  de MeCorrieron.mx. Entiendo que esta autorizacion tiene efectos legales.
                </p>
              </div>
              {authorizations.terminos_aceptados && (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Aviso legal */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Aviso Legal:</strong> Al firmar esta autorizacion, usted otorga consentimiento expreso 
            para que MeCorrieron.mx y el abogado asignado actuen en su representacion ante el Centro de 
            Conciliacion Laboral de {estado}. Esta autorizacion se registra con firma electronica 
            conforme a la legislacion mexicana vigente.
          </AlertDescription>
        </Alert>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent" disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!allRequiredAccepted || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Firmar Autorizacion
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
