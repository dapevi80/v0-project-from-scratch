'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Clock,
  FileText,
  Video,
  MapPin,
  RefreshCw,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react'

interface AgentLog {
  id: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  data?: Record<string, unknown>
  created_at: string
}

interface AgentJob {
  id: string
  casoId: string
  caso?: {
    id: string
    folio: string
    empresa_nombre: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  currentStep: string
  progress: number
  error?: string
  resultado?: {
    success: boolean
    folioSolicitud?: string
    fechaCita?: string
    horaCita?: string
    modalidad?: string
    ligaUnica?: string
    fechaLimiteConfirmacion?: string
    instrucciones?: string[]
    pdfUrl?: string
  }
  startedAt?: string
  completedAt?: string
}

interface AgentProgressModalProps {
  open: boolean
  onClose: () => void
  jobId: string | null
  onJobComplete?: (resultado: AgentJob['resultado']) => void
}

const STEP_LABELS: Record<string, string> = {
  'iniciando': 'Iniciando agente...',
  'analizando_jurisdiccion': 'Analizando jurisdiccion...',
  'obteniendo_portal': 'Obteniendo portal CCL...',
  'iniciando_navegador': 'Iniciando navegador...',
  'navegando_portal': 'Navegando al portal...',
  'llenando_formulario': 'Llenando formulario...',
  'paso_1': 'Paso 1: Industria o servicio',
  'paso_2': 'Paso 2: Datos de solicitud',
  'paso_3': 'Paso 3: Datos del trabajador',
  'paso_4': 'Paso 4: Datos del empleador',
  'paso_5': 'Paso 5: Descripcion de hechos',
  'paso_6': 'Paso 6: Tipo de atencion',
  'paso_7': 'Paso 7: Resumen y envio',
  'extrayendo_resultado': 'Extrayendo resultado...',
  'completado': 'Proceso completado',
  'error': 'Error en el proceso',
  'cancelado': 'Proceso cancelado'
}

export function AgentProgressModal({ open, onClose, jobId, onJobComplete }: AgentProgressModalProps) {
  const [job, setJob] = useState<AgentJob | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  // Función para obtener el estado del job
  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/ccl/agent/status/${jobId}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
        setLogs(data.logs || [])

        // Si el job terminó, notificar
        if (['completed', 'failed', 'cancelled'].includes(data.job.status)) {
          setPolling(false)
          if (data.job.status === 'completed' && data.job.resultado) {
            onJobComplete?.(data.job.resultado)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching job status:', error)
    }
  }, [jobId, onJobComplete])

  // Polling mientras el job está activo
  useEffect(() => {
    if (!open || !jobId) return

    setPolling(true)
    fetchJobStatus()

    const interval = setInterval(() => {
      if (polling) {
        fetchJobStatus()
      }
    }, 2000) // Polling cada 2 segundos

    return () => {
      clearInterval(interval)
      setPolling(false)
    }
  }, [open, jobId, polling, fetchJobStatus])

  // Cancelar job
  const handleCancel = async () => {
    if (!jobId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/ccl/agent/status/${jobId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchJobStatus()
      }
    } catch (error) {
      console.error('Error cancelling job:', error)
    } finally {
      setLoading(false)
    }
  }

  // Copiar folio al portapapeles
  const copyFolio = () => {
    if (job?.resultado?.folioSolicitud) {
      navigator.clipboard.writeText(job.resultado.folioSolicitud)
    }
  }

  const getStatusIcon = () => {
    switch (job?.status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />
      case 'running':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'cancelled':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />
      default:
        return <Bot className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (job?.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">En espera</Badge>
      case 'running':
        return <Badge className="bg-blue-500">En proceso</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>
      case 'failed':
        return <Badge variant="destructive">Error</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Cancelado</Badge>
      default:
        return null
    }
  }

  const getLogIcon = (level: AgentLog['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Bot className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon()}
            <span>Agente de Solicitud CCL</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            {job?.caso?.empresa_nombre && (
              <span>Caso: {job.caso.folio} - {job.caso.empresa_nombre}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Progreso */}
          {job && ['pending', 'running'].includes(job.status) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {STEP_LABELS[job.currentStep] || job.currentStep}
                </span>
                <span className="font-medium">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          )}

          {/* Resultado exitoso */}
          {job?.status === 'completed' && job.resultado?.success && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Solicitud generada exitosamente</span>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Folio:</span>
                    <div className="flex items-center gap-2">
                      <Badge className="text-base px-3 py-1 bg-green-600">
                        {job.resultado.folioSolicitud}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={copyFolio}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Modalidad:</span>
                    <Badge className={job.resultado.modalidad === 'remota' ? 'bg-blue-500' : 'bg-green-500'}>
                      {job.resultado.modalidad === 'remota' ? (
                        <><Video className="h-3 w-3 mr-1" /> Remota</>
                      ) : (
                        <><MapPin className="h-3 w-3 mr-1" /> Presencial</>
                      )}
                    </Badge>
                  </div>

                  {job.resultado.fechaLimiteConfirmacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmar antes de:</span>
                      <span className="font-medium text-amber-600">
                        {new Date(job.resultado.fechaLimiteConfirmacion).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  )}

                  {job.resultado.ligaUnica && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 block mb-1">Liga para audiencia:</span>
                      <a 
                        href={job.resultado.ligaUnica} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm flex items-center gap-1"
                      >
                        {job.resultado.ligaUnica}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {job.resultado.pdfUrl && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={job.resultado.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar acuse PDF
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {job.resultado.instrucciones && job.resultado.instrucciones.length > 0 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Siguientes pasos</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        {job.resultado.instrucciones.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {job?.status === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error en el proceso</AlertTitle>
              <AlertDescription>
                {job.error || 'Ocurrio un error inesperado durante el proceso.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Logs */}
          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${polling ? 'animate-spin' : ''}`} />
              Registro de actividad
            </h4>
            <ScrollArea className="h-48 border rounded-md p-3 bg-muted/30">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Esperando actividad del agente...
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-sm">
                      {getLogIcon(log.level)}
                      <div className="flex-1">
                        <span className={
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warning' ? 'text-yellow-600' :
                          log.level === 'success' ? 'text-green-600' :
                          'text-foreground'
                        }>
                          {log.message}
                        </span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {new Date(log.created_at).toLocaleTimeString('es-MX')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {job && ['pending', 'running'].includes(job.status) && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancelar proceso
            </Button>
          )}
          <Button onClick={onClose}>
            {job?.status === 'completed' ? 'Cerrar' : 'Ejecutar en segundo plano'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
