'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Shield, FileText, ExternalLink, CheckCircle, AlertTriangle,
  Scale, User, Building2, Calendar
} from 'lucide-react'

interface SinacolAuthorizationProps {
  casoId: string
  trabajador: {
    nombre: string
    curp: string
    telefono?: string
    email?: string
  }
  empresa: {
    razonSocial: string
    rfc?: string
    direccion?: string
  }
  estado: string
  urlSinacol: string
  onAuthorized: (authData: AuthorizationData) => void
  existingAuth?: AuthorizationData | null
}

export interface AuthorizationData {
  id?: string
  caso_id: string
  autoriza_mecorrieron: boolean
  autoriza_abogado: boolean
  autoriza_sinacol: boolean
  autoriza_notificaciones: boolean
  fecha_autorizacion: string
  ip_autorizacion?: string
  firma_electronica?: string
  terminos_aceptados: boolean
}

const DISCLOSURES = [
  {
    id: 'mecorrieron',
    field: 'autoriza_mecorrieron',
    title: 'Autorización a MeCorrieron.mx',
    description: 'Autorizo a MeCorrieron.mx a gestionar mi caso de conciliación laboral, incluyendo el acceso a mis datos personales (CURP, nombre, datos laborales) para la preparación de mi solicitud ante el Centro de Conciliación Laboral.',
    required: true
  },
  {
    id: 'abogado',
    field: 'autoriza_abogado',
    title: 'Autorización al Abogado Asignado',
    description: 'Autorizo al abogado asignado por MeCorrieron.mx a representarme en el proceso de conciliación laboral, actuar en mi nombre y recibir notificaciones relacionadas con mi caso.',
    required: true
  },
  {
    id: 'sinacol',
    field: 'autoriza_sinacol',
    title: 'Autorización para Registro en SINACOL',
    description: 'Autorizo a MeCorrieron.mx y al abogado asignado a crear y gestionar mi solicitud de conciliación laboral en el portal oficial SINACOL (Sistema Nacional de Conciliación Laboral), utilizando mi CURP y datos personales.',
    required: true
  },
  {
    id: 'notificaciones',
    field: 'autoriza_notificaciones',
    title: 'Autorización para Notificaciones',
    description: 'Autorizo recibir notificaciones por correo electrónico, SMS y WhatsApp sobre el estado de mi caso, citas de conciliación, y documentos relacionados.',
    required: false
  }
]

export function SinacolAuthorization({
  casoId,
  trabajador,
  empresa,
  estado,
  urlSinacol,
  onAuthorized,
  existingAuth
}: SinacolAuthorizationProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [authorizations, setAuthorizations] = useState({
    autoriza_mecorrieron: existingAuth?.autoriza_mecorrieron || false,
    autoriza_abogado: existingAuth?.autoriza_abogado || false,
    autoriza_sinacol: existingAuth?.autoriza_sinacol || false,
    autoriza_notificaciones: existingAuth?.autoriza_notificaciones || false,
    terminos_aceptados: existingAuth?.terminos_aceptados || false
  })
  const [saving, setSaving] = useState(false)

  const allRequiredAccepted = 
    authorizations.autoriza_mecorrieron && 
    authorizations.autoriza_abogado && 
    authorizations.autoriza_sinacol &&
    authorizations.terminos_aceptados

  const handleSubmit = async () => {
    if (!allRequiredAccepted) return
    
    setSaving(true)
    try {
      const authData: AuthorizationData = {
        caso_id: casoId,
        ...authorizations,
        fecha_autorizacion: new Date().toISOString()
      }
      
      await onAuthorized(authData)
      setShowDialog(false)
    } catch (error) {
      console.error('[v0] Error saving authorization:', error)
    } finally {
      setSaving(false)
    }
  }

  // Si ya tiene autorización completa, mostrar resumen
  if (existingAuth && existingAuth.autoriza_sinacol) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base">
            <CheckCircle className="h-5 w-5" />
            Autorización SINACOL Completada
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Autorizado el {new Date(existingAuth.fecha_autorizacion).toLocaleDateString('es-MX', { 
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {existingAuth.autoriza_mecorrieron && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" /> MeCorrieron.mx
              </Badge>
            )}
            {existingAuth.autoriza_abogado && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" /> Abogado
              </Badge>
            )}
            {existingAuth.autoriza_sinacol && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" /> SINACOL
              </Badge>
            )}
          </div>
          
          <Button 
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            onClick={() => window.open(urlSinacol, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir a SINACOL - {estado}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Shield className="h-5 w-5" />
            Autorización Requerida
          </CardTitle>
          <CardDescription>
            Para iniciar tu solicitud de conciliación laboral en SINACOL, necesitamos tu autorización explícita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Importante:</strong> Al autorizar, MeCorrieron.mx y tu abogado podrán crear tu solicitud 
              de conciliación laboral en el portal oficial SINACOL usando tu CURP.
            </AlertDescription>
          </Alert>

          {/* Resumen del caso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Trabajador</p>
                <p className="font-medium text-sm">{trabajador.nombre}</p>
                <p className="font-mono text-xs">{trabajador.curp}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Empresa Demandada</p>
                <p className="font-medium text-sm">{empresa.razonSocial}</p>
                {empresa.rfc && <p className="font-mono text-xs">{empresa.rfc}</p>}
              </div>
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={() => setShowDialog(true)}
          >
            <Scale className="h-4 w-4 mr-2" />
            Revisar y Firmar Autorización
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de autorización detallada */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Autorización para Conciliación Laboral
            </DialogTitle>
            <DialogDescription>
              Lee cuidadosamente y acepta cada autorización para continuar con tu solicitud SINACOL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Datos del caso */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Datos de la Solicitud
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trabajador:</span>
                  <p className="font-medium">{trabajador.nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CURP:</span>
                  <p className="font-mono font-medium">{trabajador.curp}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Empresa:</span>
                  <p className="font-medium">{empresa.razonSocial}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado CCL:</span>
                  <p className="font-medium">{estado}</p>
                </div>
              </div>
            </div>

            {/* Disclosures */}
            <div className="space-y-4">
              {DISCLOSURES.map((disclosure) => (
                <div 
                  key={disclosure.id}
                  className={`p-4 rounded-lg border ${
                    authorizations[disclosure.field as keyof typeof authorizations]
                      ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={disclosure.id}
                      checked={authorizations[disclosure.field as keyof typeof authorizations]}
                      onCheckedChange={(checked) => 
                        setAuthorizations(prev => ({
                          ...prev,
                          [disclosure.field]: checked
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={disclosure.id} 
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {disclosure.title}
                        {disclosure.required && (
                          <Badge variant="secondary" className="text-xs">Requerido</Badge>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {disclosure.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Términos y condiciones */}
              <div 
                className={`p-4 rounded-lg border ${
                  authorizations.terminos_aceptados
                    ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terminos"
                    checked={authorizations.terminos_aceptados}
                    onCheckedChange={(checked) => 
                      setAuthorizations(prev => ({
                        ...prev,
                        terminos_aceptados: checked as boolean
                      }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="terminos" className="font-medium cursor-pointer flex items-center gap-2">
                      Acepto los Términos y Condiciones
                      <Badge variant="secondary" className="text-xs">Requerido</Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      He leído y acepto los{' '}
                      <a href="/terminos" target="_blank" className="text-primary underline">
                        Términos y Condiciones
                      </a>
                      {' '}y el{' '}
                      <a href="/privacidad" target="_blank" className="text-primary underline">
                        Aviso de Privacidad
                      </a>
                      {' '}de MeCorrieron.mx. Entiendo que este es un proceso legal real 
                      y que debo ratificar mi solicitud en persona ante el CCL.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso legal */}
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Aviso Legal:</strong> Esta autorización tiene validez legal conforme a la 
                Ley Federal del Trabajo y la normatividad del Centro de Conciliación Laboral. 
                Al firmar, usted acepta que MeCorrieron.mx actúe como intermediario en su 
                proceso de conciliación laboral. La ratificación presencial sigue siendo 
                obligatoria conforme a la ley.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!allRequiredAccepted || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>Guardando...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Firmar Autorización
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
