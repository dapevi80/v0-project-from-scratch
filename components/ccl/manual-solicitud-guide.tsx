'use client'

import { useState } from 'react'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ExternalLink, Copy, CheckCircle2, FileText, User, Building2,
  MapPin, Phone, Calendar, Clock, ArrowRight, Download, Printer,
  Globe, Video, ClipboardList
} from 'lucide-react'

interface ManualSolicitudGuideProps {
  caso: {
    id: string
    folio: string
    worker?: {
      full_name?: string
      curp?: string
      phone?: string
      email?: string
      calle?: string
      ciudad?: string
      estado?: string
      codigo_postal?: string
    }
    employer_name: string
    employer_address?: string
    salary_daily?: number
    start_date?: string
    job_title?: string
  }
  portal: {
    nombre: string
    url_portal: string
    direccion?: string
    telefono?: string
    horario?: string
    codigo: string
  }
  estadoEmpleador: string
  tipoTerminacion: 'despido' | 'rescision' | 'renuncia_forzada'
  tipoPersonaCitado: 'fisica' | 'moral'
  modalidadConciliacion: 'presencial' | 'remota'
  fechaTerminacion: string
  descripcionHechos?: string
}

export function ManualSolicitudGuide({
  caso,
  portal,
  estadoEmpleador,
  tipoTerminacion,
  tipoPersonaCitado,
  modalidadConciliacion,
  fechaTerminacion,
  descripcionHechos
}: ManualSolicitudGuideProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-6 px-2"
    >
      {copiedField === field ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )

  const tipoTerminacionTexto = {
    despido: 'Despido Injustificado',
    rescision: 'Rescision de Contrato',
    renuncia_forzada: 'Renuncia Forzada'
  }

  const printGuide = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="text-center print:mb-4">
        <h2 className="text-2xl font-bold">Guia para Solicitud Manual CCL</h2>
        <p className="text-muted-foreground">
          Caso: {caso.folio} | Estado: {estadoEmpleador}
        </p>
      </div>

      {/* Acciones rapidas */}
      <div className="flex gap-2 justify-center print:hidden">
        <Button onClick={printGuide} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Guia
        </Button>
        <Button asChild>
          <a href={portal.url_portal} target="_blank" rel="noopener noreferrer">
            <Globe className="h-4 w-4 mr-2" />
            Abrir Portal CCL
          </a>
        </Button>
      </div>

      {/* Alerta de modalidad */}
      <Alert className={modalidadConciliacion === 'remota' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'}>
        {modalidadConciliacion === 'remota' ? (
          <Video className="h-4 w-4 text-blue-600" />
        ) : (
          <MapPin className="h-4 w-4 text-green-600" />
        )}
        <AlertTitle>
          Modalidad: {modalidadConciliacion === 'remota' ? 'Conciliacion Remota' : 'Conciliacion Presencial'}
        </AlertTitle>
        <AlertDescription>
          {modalidadConciliacion === 'remota' 
            ? 'La audiencia sera por videollamada. Deberas subir identificacion del trabajador.' 
            : 'El trabajador debera acudir presencialmente al CCL a confirmar la solicitud.'}
        </AlertDescription>
      </Alert>

      {/* Datos del Portal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Portal CCL - {portal.nombre}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">URL del Portal:</span>
            <div className="flex items-center gap-2">
              <a 
                href={portal.url_portal} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {portal.url_portal}
              </a>
              <CopyButton text={portal.url_portal} field="url" />
            </div>
          </div>
          {portal.direccion && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Direccion:</span>
              <span className="text-sm">{portal.direccion}</span>
            </div>
          )}
          {portal.telefono && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Telefono:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{portal.telefono}</span>
                <CopyButton text={portal.telefono} field="telefono" />
              </div>
            </div>
          )}
          {portal.horario && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Horario:</span>
              <span className="text-sm">{portal.horario}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pasos del formulario */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Pasos del Formulario SINACOL
          </CardTitle>
          <CardDescription>
            Sigue estos pasos en el portal CCL. Los datos ya estan preparados para copiar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Paso 1: Industria */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">01</Badge>
              <h4 className="font-semibold">Industria o Servicio</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Selecciona la industria que mejor describa la actividad del empleador.
            </p>
            <div className="bg-muted/50 p-3 rounded text-sm">
              <p><strong>Tip:</strong> Si no estas seguro, selecciona "Otros servicios" o "Comercio"</p>
            </div>
          </div>

          {/* Paso 2: Datos de la solicitud */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">02</Badge>
              <h4 className="font-semibold">Datos de la Solicitud</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span className="text-sm">Tipo de terminacion:</span>
                <div className="flex items-center gap-2">
                  <Badge>{tipoTerminacionTexto[tipoTerminacion]}</Badge>
                  <CopyButton text={tipoTerminacionTexto[tipoTerminacion]} field="tipoTerm" />
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span className="text-sm">Fecha de terminacion:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fechaTerminacion}</span>
                  <CopyButton text={fechaTerminacion} field="fechaTerm" />
                </div>
              </div>
            </div>
          </div>

          {/* Paso 3: Datos del solicitante (trabajador) */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">03</Badge>
              <h4 className="font-semibold">Datos del Solicitante (Trabajador)</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span className="text-sm">Nombre completo:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{caso.worker?.full_name || 'No disponible'}</span>
                  {caso.worker?.full_name && <CopyButton text={caso.worker.full_name} field="nombre" />}
                </div>
              </div>
              {caso.worker?.curp && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">CURP:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{caso.worker.curp}</span>
                    <CopyButton text={caso.worker.curp} field="curp" />
                  </div>
                </div>
              )}
              {caso.worker?.phone && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Telefono:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{caso.worker.phone}</span>
                    <CopyButton text={caso.worker.phone} field="workerPhone" />
                  </div>
                </div>
              )}
              {caso.worker?.email && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{caso.worker.email}</span>
                    <CopyButton text={caso.worker.email} field="email" />
                  </div>
                </div>
              )}
              {caso.worker?.calle && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Domicilio:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-right text-xs">
                      {caso.worker.calle}, {caso.worker.ciudad}, {caso.worker.estado} {caso.worker.codigo_postal}
                    </span>
                    <CopyButton 
                      text={`${caso.worker.calle}, ${caso.worker.ciudad}, ${caso.worker.estado} ${caso.worker.codigo_postal}`} 
                      field="domicilio" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Paso 4: Datos del citado (empleador) */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">04</Badge>
              <h4 className="font-semibold">Datos del Citado (Empleador)</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span className="text-sm">Tipo de persona:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {tipoPersonaCitado === 'moral' ? 'Persona Moral (Empresa)' : 'Persona Fisica'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                <span className="text-sm">Nombre/Razon social:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{caso.employer_name}</span>
                  <CopyButton text={caso.employer_name} field="empleador" />
                </div>
              </div>
              {caso.employer_address && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Domicilio del trabajo:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-right text-xs">{caso.employer_address}</span>
                    <CopyButton text={caso.employer_address} field="empleadorDir" />
                  </div>
                </div>
              )}
              {caso.salary_daily && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Salario diario:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${caso.salary_daily.toFixed(2)}</span>
                    <CopyButton text={caso.salary_daily.toString()} field="salario" />
                  </div>
                </div>
              )}
              {caso.start_date && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Fecha de ingreso:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{caso.start_date}</span>
                    <CopyButton text={caso.start_date} field="fechaIngreso" />
                  </div>
                </div>
              )}
              {caso.job_title && (
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                  <span className="text-sm">Puesto:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{caso.job_title}</span>
                    <CopyButton text={caso.job_title} field="puesto" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Paso 5: Descripcion de hechos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">05</Badge>
              <h4 className="font-semibold">Descripcion de los Hechos</h4>
            </div>
            {descripcionHechos ? (
              <div className="bg-muted/30 p-3 rounded">
                <p className="text-sm whitespace-pre-wrap">{descripcionHechos}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(descripcionHechos, 'hechos')}
                  className="mt-2"
                >
                  {copiedField === 'hechos' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar descripcion
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Describe brevemente como ocurrio el despido/terminacion. Este campo es obligatorio.
              </p>
            )}
          </div>

          {/* Paso 6: Tipo de atencion */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full">06</Badge>
              <h4 className="font-semibold">Tipo de Atencion</h4>
            </div>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border-2 ${modalidadConciliacion === 'remota' ? 'border-blue-500 bg-blue-50' : 'border-muted'}`}>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Conciliacion Remota (Virtual)</span>
                  {modalidadConciliacion === 'remota' && <Badge className="bg-blue-500">Seleccionar</Badge>}
                </div>
                {modalidadConciliacion === 'remota' && (
                  <p className="text-sm text-blue-700 mt-2">
                    Selecciona esta opcion. Deberas subir la identificacion oficial del trabajador.
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg border-2 ${modalidadConciliacion === 'presencial' ? 'border-green-500 bg-green-50' : 'border-muted'}`}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Conciliacion Presencial</span>
                  {modalidadConciliacion === 'presencial' && <Badge className="bg-green-500">Seleccionar</Badge>}
                </div>
                {modalidadConciliacion === 'presencial' && (
                  <p className="text-sm text-green-700 mt-2">
                    Selecciona esta opcion. El trabajador debera acudir al CCL a confirmar.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Paso 7: Resumen y envio */}
          <div className="border rounded-lg p-4 border-primary">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="rounded-full bg-primary text-primary-foreground">07</Badge>
              <h4 className="font-semibold">Resumen y Envio</h4>
            </div>
            <div className="space-y-2 text-sm">
              <p>1. Revisa que todos los datos sean correctos</p>
              <p>2. Haz clic en "Validar y Continuar"</p>
              <p>3. Confirma el envio de la solicitud</p>
              <p className="font-semibold text-primary">4. IMPORTANTE: Descarga o imprime el PDF del acuse</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Despues de enviar */}
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
            <Clock className="h-5 w-5" />
            Despues de Enviar la Solicitud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {modalidadConciliacion === 'remota' ? (
            <>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Guarda el PDF del acuse</p>
                  <p className="text-sm text-amber-700">Contiene el folio y la liga unica para tu proceso</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">Llama al CCL en maximo 3 dias habiles</p>
                  <p className="text-sm text-amber-700">
                    Telefono: {portal.telefono || 'Ver en el acuse'} - Agenda cita para confirmar por videollamada
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Confirma la solicitud con el oficial de partes</p>
                  <p className="text-sm text-amber-700">
                    En la videollamada se activara el buzon electronico y se asignara fecha de audiencia
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Imprime el PDF del acuse</p>
                  <p className="text-sm text-amber-700">El trabajador lo necesita para confirmar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">El trabajador acude al CCL en maximo 3 dias habiles</p>
                  <p className="text-sm text-amber-700">
                    Direccion: {portal.direccion || 'Ver en el acuse'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-amber-600 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Lleva identificacion oficial y comprobante de domicilio</p>
                  <p className="text-sm text-amber-700">
                    INE/IFE vigente + recibo de luz/agua/telefono reciente
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Boton final */}
      <div className="flex justify-center print:hidden">
        <Button size="lg" asChild>
          <a href={portal.url_portal} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-5 w-5 mr-2" />
            Ir al Portal CCL y Crear Solicitud
          </a>
        </Button>
      </div>

      {/* Estilos de impresion */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:space-y-4, .print\\:space-y-4 * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
