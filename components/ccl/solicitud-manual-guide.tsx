'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, Copy, Check, ExternalLink, Download, 
  ClipboardList, User, Building2, MapPin, Phone,
  Calendar, DollarSign, Briefcase, CheckCircle2,
  ArrowRight, Video, Users
} from 'lucide-react'

interface DatosSolicitud {
  // Datos del solicitante (trabajador)
  trabajadorNombre: string
  trabajadorCurp?: string
  trabajadorDomicilio?: string
  trabajadorTelefono?: string
  trabajadorEmail?: string
  // Datos del citado (empleador)
  empleadorNombre: string
  empleadorRfc?: string
  empleadorDomicilio?: string
  empleadorEstado: string
  // Datos del empleo
  fechaIngreso?: string
  fechaTerminacion: string
  salarioDiario?: number
  puestoTrabajo?: string
  // Tipo de caso
  tipoTerminacion: string
  tipoPersonaCitado: 'fisica' | 'moral'
  modalidadConciliacion: 'presencial' | 'remota'
  descripcionHechos?: string
  montoEstimado?: number
  // Portal CCL
  portalUrl?: string
  portalNombre?: string
  portalDireccion?: string
  portalTelefono?: string
}

interface SolicitudManualGuideProps {
  datos: DatosSolicitud
  onComplete?: () => void
}

// Pasos del formulario SINACOL
const PASOS_SINACOL = [
  {
    numero: 1,
    titulo: 'Industria o servicio',
    descripcion: 'Seleccionar el sector de la industria donde laboraba el trabajador',
    campos: ['Industria/Servicio del empleador']
  },
  {
    numero: 2,
    titulo: 'Datos de la solicitud',
    descripcion: 'Informacion general sobre el tipo de solicitud',
    campos: ['Tipo de conflicto', 'Pretensiones']
  },
  {
    numero: 3,
    titulo: 'Datos del solicitante',
    descripcion: 'Informacion personal del trabajador',
    campos: ['Nombre completo', 'CURP', 'Domicilio', 'Telefono', 'Email']
  },
  {
    numero: 4,
    titulo: 'Datos del citado',
    descripcion: 'Informacion del empleador o empresa demandada',
    campos: ['Nombre/Razon social', 'RFC', 'Domicilio', 'Tipo de persona']
  },
  {
    numero: 5,
    titulo: 'Descripcion de los hechos',
    descripcion: 'Relato breve de lo sucedido',
    campos: ['Fecha de ingreso', 'Fecha de terminacion', 'Salario', 'Descripcion']
  },
  {
    numero: 6,
    titulo: 'Tipo de atencion',
    descripcion: 'Elegir modalidad presencial o remota',
    campos: ['Modalidad de conciliacion', 'Cargar identificacion (si es remota)']
  },
  {
    numero: 7,
    titulo: 'Resumen',
    descripcion: 'Revisar y confirmar la solicitud',
    campos: ['Verificar todos los datos', 'Enviar solicitud']
  }
]

export function SolicitudManualGuide({ datos, onComplete }: SolicitudManualGuideProps) {
  const [pasosCompletados, setPasosCompletados] = useState<number[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Error copiando:', err)
    }
  }

  const togglePaso = (paso: number) => {
    setPasosCompletados(prev => 
      prev.includes(paso) 
        ? prev.filter(p => p !== paso)
        : [...prev, paso]
    )
  }

  const progreso = Math.round((pasosCompletados.length / PASOS_SINACOL.length) * 100)

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2"
      onClick={() => copyToClipboard(text, fieldName)}
    >
      {copiedField === fieldName ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      {/* Header con progreso */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Guia para completar solicitud manualmente</h3>
          <p className="text-sm text-muted-foreground">
            Sigue los pasos y copia los datos para llenar el formulario SINACOL
          </p>
        </div>
        <Badge variant={progreso === 100 ? 'default' : 'secondary'} className="text-sm">
          {progreso}% completado
        </Badge>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* Boton para abrir portal */}
      {datos.portalUrl && (
        <Alert className="border-blue-200 bg-blue-50">
          <ExternalLink className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-800">
              Portal CCL de {datos.empleadorEstado}: <strong>{datos.portalNombre}</strong>
            </span>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-4 bg-transparent"
              onClick={() => window.open(datos.portalUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Portal
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Datos listos para copiar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Datos para copiar al formulario
          </CardTitle>
          <CardDescription>
            Haz clic en el icono de copiar junto a cada campo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Datos del Solicitante */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Datos del Solicitante (Trabajador)
            </h4>
            <div className="grid gap-2 pl-6">
              <DataRow label="Nombre completo" value={datos.trabajadorNombre} onCopy={copyToClipboard} copiedField={copiedField} />
              {datos.trabajadorCurp && (
                <DataRow label="CURP" value={datos.trabajadorCurp} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              {datos.trabajadorDomicilio && (
                <DataRow label="Domicilio" value={datos.trabajadorDomicilio} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              {datos.trabajadorTelefono && (
                <DataRow label="Telefono" value={datos.trabajadorTelefono} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              {datos.trabajadorEmail && (
                <DataRow label="Email" value={datos.trabajadorEmail} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
            </div>
          </div>

          <Separator />

          {/* Datos del Citado */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Datos del Citado (Empleador)
            </h4>
            <div className="grid gap-2 pl-6">
              <DataRow label="Nombre/Razon social" value={datos.empleadorNombre} onCopy={copyToClipboard} copiedField={copiedField} />
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Tipo de persona:</span>
                <Badge variant="outline">
                  {datos.tipoPersonaCitado === 'moral' ? 'Persona Moral (empresa)' : 'Persona Fisica'}
                </Badge>
              </div>
              {datos.empleadorRfc && (
                <DataRow label="RFC" value={datos.empleadorRfc} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              {datos.empleadorDomicilio && (
                <DataRow label="Domicilio" value={datos.empleadorDomicilio} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              <DataRow label="Estado" value={datos.empleadorEstado} onCopy={copyToClipboard} copiedField={copiedField} />
            </div>
          </div>

          <Separator />

          {/* Datos del Empleo */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Datos del Empleo
            </h4>
            <div className="grid gap-2 pl-6">
              {datos.fechaIngreso && (
                <DataRow label="Fecha de ingreso" value={datos.fechaIngreso} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              <DataRow label="Fecha de terminacion" value={datos.fechaTerminacion} onCopy={copyToClipboard} copiedField={copiedField} />
              {datos.salarioDiario && (
                <DataRow 
                  label="Salario diario" 
                  value={`$${datos.salarioDiario.toFixed(2)}`} 
                  onCopy={copyToClipboard} 
                  copiedField={copiedField} 
                />
              )}
              {datos.puestoTrabajo && (
                <DataRow label="Puesto" value={datos.puestoTrabajo} onCopy={copyToClipboard} copiedField={copiedField} />
              )}
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Tipo de terminacion:</span>
                <Badge variant="outline">
                  {datos.tipoTerminacion === 'despido' ? 'Despido injustificado' :
                   datos.tipoTerminacion === 'rescision' ? 'Rescision' : 'Renuncia forzada'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Modalidad */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              {datos.modalidadConciliacion === 'remota' ? (
                <Video className="h-4 w-4 text-blue-500" />
              ) : (
                <MapPin className="h-4 w-4 text-green-500" />
              )}
              Modalidad de Conciliacion
            </h4>
            <div className="pl-6">
              <Badge className={datos.modalidadConciliacion === 'remota' ? 'bg-blue-500' : 'bg-green-500'}>
                {datos.modalidadConciliacion === 'remota' ? 'CONCILIACION REMOTA (Videollamada)' : 'CONCILIACION PRESENCIAL'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {datos.modalidadConciliacion === 'remota' 
                  ? 'Selecciona "Acepto llevar la conciliacion de manera virtual" en el paso 6'
                  : 'Selecciona "No, prefiero continuar con la conciliacion presencial" en el paso 6'}
              </p>
            </div>
          </div>

          {/* Descripcion de hechos */}
          {datos.descripcionHechos && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Descripcion de los Hechos
                </h4>
                <div className="pl-6">
                  <div className="relative">
                    <p className="text-sm bg-muted p-3 rounded-md pr-10">
                      {datos.descripcionHechos}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 px-2"
                      onClick={() => copyToClipboard(datos.descripcionHechos!, 'descripcion')}
                    >
                      {copiedField === 'descripcion' ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Checklist de pasos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist de pasos en el portal SINACOL</CardTitle>
          <CardDescription>
            Marca cada paso conforme lo vayas completando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PASOS_SINACOL.map((paso) => (
              <div 
                key={paso.numero}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  pasosCompletados.includes(paso.numero) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  id={`paso-${paso.numero}`}
                  checked={pasosCompletados.includes(paso.numero)}
                  onCheckedChange={() => togglePaso(paso.numero)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={`paso-${paso.numero}`}
                    className={`font-medium cursor-pointer flex items-center gap-2 ${
                      pasosCompletados.includes(paso.numero) ? 'text-green-700 line-through' : ''
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                      {pasosCompletados.includes(paso.numero) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        paso.numero
                      )}
                    </span>
                    {paso.titulo}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1 ml-8">
                    {paso.descripcion}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2 ml-8">
                    {paso.campos.map((campo) => (
                      <Badge key={campo} variant="outline" className="text-xs">
                        {campo}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones post-solicitud */}
      <Alert className={datos.modalidadConciliacion === 'remota' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'}>
        <ArrowRight className={`h-4 w-4 ${datos.modalidadConciliacion === 'remota' ? 'text-blue-600' : 'text-green-600'}`} />
        <AlertDescription className={datos.modalidadConciliacion === 'remota' ? 'text-blue-800' : 'text-green-800'}>
          <strong>Despues de enviar la solicitud:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            {datos.modalidadConciliacion === 'remota' ? (
              <>
                <li>Descarga e imprime el acuse de solicitud (PDF)</li>
                <li>Llama al CCL para agendar tu cita de confirmacion por videollamada</li>
                <li>Ten lista tu INE/IFE escaneada para cargarla</li>
                <li>Tienes 3 dias habiles para confirmar tu solicitud</li>
              </>
            ) : (
              <>
                <li>Descarga e imprime el acuse de solicitud (PDF)</li>
                <li>Acude al CCL en {datos.portalDireccion || 'la direccion indicada'}</li>
                <li>Lleva INE/IFE original y copia</li>
                <li>Tienes 3 dias habiles para confirmar tu solicitud</li>
              </>
            )}
          </ul>
        </AlertDescription>
      </Alert>

      {/* Boton de completado */}
      {progreso === 100 && (
        <div className="flex justify-center">
          <Button onClick={onComplete} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Solicitud Completada
          </Button>
        </div>
      )}
    </div>
  )
}

// Componente auxiliar para filas de datos
function DataRow({ 
  label, 
  value, 
  onCopy, 
  copiedField 
}: { 
  label: string
  value: string
  onCopy: (text: string, field: string) => void
  copiedField: string | null
}) {
  const fieldKey = label.toLowerCase().replace(/\s/g, '-')
  
  return (
    <div className="flex items-center justify-between text-sm py-1 hover:bg-muted/50 rounded px-2 -mx-2">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1">
        <span className="font-medium">{value}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={() => onCopy(value, fieldKey)}
        >
          {copiedField === fieldKey ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )
}
