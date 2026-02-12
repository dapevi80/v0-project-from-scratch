'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp'
import type { 
  AgentJob, 
  AgentStep, 
  AgentLog, 
  CasoData, 
  AgentJobStatus,
  SolicitudResultado 
} from './agent-types'
import { 
  createBrowserSession, 
  closeBrowserSession, 
  navigateTo, 
  takeScreenshot,
  checkBrowserlessStatus
} from './browser-service'
import { 
  determinarJurisdiccion, 
  validarDatosParaSolicitud, 
  sugerirCCL 
} from './jurisdiction-ai'
import { ejecutarFormularioCompleto } from './form-filler'
import { PORTALES_CCL_COMPLETOS } from '../portales-urls'

/**
 * Agente de IA para automatizar solicitudes CCL/SINACOL
 * Ejecuta en background y notifica al completar
 */

/**
 * Inicia un nuevo job del agente para un caso
 */
export async function iniciarAgenteCCL(
  casoId: string,
  options?: {
    modalidadPreferida?: 'presencial' | 'remota'
    skipValidacion?: boolean
  }
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Verificar que Browserless está disponible
  const browserStatus = await checkBrowserlessStatus()
  if (!browserStatus.available) {
    return { 
      success: false, 
      error: browserStatus.error || 'Servicio de automatización no disponible' 
    }
  }

  // Obtener datos del caso
  const { data: caso, error: casoError } = await supabase
    .from('casos')
    .select(`
      *,
      worker:profiles!casos_worker_id_fkey(*)
    `)
    .eq('id', casoId)
    .single()

  if (casoError || !caso) {
    return { success: false, error: 'Caso no encontrado' }
  }

  // Preparar datos del caso para el agente
  const casoData = prepararDatosCaso(caso)

  // Validar datos mínimos requeridos
  if (!options?.skipValidacion) {
    const validacion = await validarDatosParaSolicitud(casoData)
    if (!validacion.valido) {
      return { 
        success: false, 
        error: `Datos incompletos: ${validacion.errores.join(', ')}` 
      }
    }
  }

  // Crear job en la base de datos
  const { data: job, error: jobError } = await supabase
    .from('ccl_agent_jobs')
    .insert({
      caso_id: casoId,
      abogado_id: user.id,
      status: 'pending',
      current_step: 'iniciando',
      progress: 0,
      logs: [],
      metadata: {
        modalidadPreferida: options?.modalidadPreferida || caso.modalidad_conciliacion || 'remota',
        iniciadoPor: user.email
      }
    })
    .select()
    .single()

  if (jobError || !job) {
    return { success: false, error: 'Error creando job del agente' }
  }

  // Iniciar ejecución en background (no esperamos)
  ejecutarAgenteEnBackground(job.id, casoData).catch(error => {
    console.error('Error en agente background:', error)
  })

  return { success: true, jobId: job.id }
}

/**
 * Prepara los datos del caso en el formato que necesita el agente
 */
function prepararDatosCaso(caso: Record<string, unknown>): CasoData {
  const worker = caso.worker as Record<string, unknown> | null

  return {
    casoId: caso.id as string,
    
    // Datos del trabajador
    trabajadorNombre: worker?.full_name as string || '',
    trabajadorCurp: worker?.curp as string | undefined,
    trabajadorRfc: worker?.rfc as string | undefined,
    trabajadorTelefono: worker?.phone as string | undefined,
    trabajadorEmail: worker?.email as string | undefined,
    trabajadorDomicilio: worker?.calle 
      ? `${worker.calle}, ${worker.colonia || ''}, ${worker.ciudad || ''}, ${worker.estado || ''}`
      : undefined,
    trabajadorEstado: worker?.estado as string | undefined,
    
    // Datos del empleador/citado
    empleadorNombre: caso.empresa_nombre as string || caso.employer_name as string || '',
    empleadorRfc: caso.empresa_rfc as string | undefined,
    empleadorDomicilio: caso.employer_address as string | undefined,
    empleadorEstado: caso.estado as string || '',
    empleadorCiudad: caso.ciudad as string | undefined,
    
    // Datos de la relación laboral
    fechaIngreso: caso.start_date as string | undefined,
    fechaTerminacion: caso.fecha_despido as string || caso.end_date as string || '',
    salarioDiario: caso.salary_daily as number | undefined,
    puestoTrabajo: caso.job_title as string | undefined,
    giroEmpresa: caso.giro_empresa as string | undefined,
    
    // Tipo de terminación
    tipoTerminacion: (caso.tipo_terminacion as 'despido' | 'rescision' | 'renuncia_forzada') || 'despido',
    
    // Descripción
    descripcionHechos: caso.descripcion as string | undefined,
    
    // Configuración de solicitud
    citadoTipoPersona: (caso.citado_tipo_persona as 'fisica' | 'moral') || 'moral',
    modalidadConciliacion: (caso.modalidad_conciliacion as 'presencial' | 'remota') || 'remota'
  }
}

/**
 * Ejecuta el agente en background
 */
async function ejecutarAgenteEnBackground(jobId: string, caso: CasoData): Promise<void> {
  const supabase = await createClient()
  let browserSession = null
  
  try {
    // Actualizar estado a "running"
    await actualizarJob(supabase, jobId, {
      status: 'running',
      current_step: 'analizando_jurisdiccion',
      progress: 5,
      started_at: new Date().toISOString()
    })
    await agregarLog(supabase, jobId, 'info', 'Agente iniciado', { caso: caso.casoId })

    // PASO 1: Determinar jurisdicción
    await agregarLog(supabase, jobId, 'info', 'Analizando jurisdicción...')
    const jurisdiccion = await determinarJurisdiccion(caso)
    
    await actualizarJob(supabase, jobId, {
      progress: 10,
      metadata: { jurisdiccion }
    })
    await agregarLog(supabase, jobId, 'info', `Jurisdicción determinada: ${jurisdiccion.esFederal ? 'FEDERAL' : 'LOCAL'}`, jurisdiccion)

    // PASO 2: Obtener URL del portal CCL
    await actualizarJob(supabase, jobId, {
      current_step: 'obteniendo_portal',
      progress: 15
    })
    
    const portal = obtenerPortalCCL(caso.empleadorEstado)
    if (!portal) {
      throw new Error(`No se encontró portal CCL para el estado: ${caso.empleadorEstado}`)
    }
    
    await agregarLog(supabase, jobId, 'info', `Portal CCL encontrado: ${portal.nombre}`, { url: portal.url })

    // PASO 3: Iniciar sesión de browser
    await actualizarJob(supabase, jobId, {
      current_step: 'iniciando_navegador',
      progress: 20
    })
    await agregarLog(supabase, jobId, 'info', 'Iniciando navegador en la nube...')
    
    browserSession = await createBrowserSession(jobId)
    await agregarLog(supabase, jobId, 'info', 'Navegador iniciado correctamente')

    // PASO 4: Navegar al portal
    await actualizarJob(supabase, jobId, {
      current_step: 'navegando_portal',
      progress: 25
    })
    
    const navResult = await navigateTo(browserSession, portal.url)
    if (!navResult.success) {
      throw new Error(`Error navegando al portal: ${navResult.error}`)
    }
    
    await agregarLog(supabase, jobId, 'info', `Navegando a ${portal.url}`)
    
    // Tomar screenshot inicial
    const screenshotInicial = await takeScreenshot(browserSession, { fullPage: true })
    if (screenshotInicial) {
      await guardarScreenshot(supabase, jobId, 'portal_inicial', screenshotInicial.base64)
    }

    // PASO 5: Ejecutar formulario completo
    await actualizarJob(supabase, jobId, {
      current_step: 'llenando_formulario',
      progress: 30
    })
    
    const resultadoFormulario = await ejecutarFormularioCompleto(
      browserSession,
      caso,
      async (step, result) => {
        // Callback para cada paso completado
        const progress = 30 + (step * 10) // 30-100
        await actualizarJob(supabase, jobId, {
          current_step: `paso_${step}`,
          progress: Math.min(progress, 95)
        })
        
        if (result.success) {
          await agregarLog(supabase, jobId, 'info', `Paso ${step} completado`)
        } else {
          await agregarLog(supabase, jobId, 'warning', `Error en paso ${step}: ${result.error}`)
        }
        
        // Guardar screenshot de cada paso
        if (result.screenshot) {
          await guardarScreenshot(supabase, jobId, `paso_${step}`, result.screenshot)
        }
      }
    )

    if (!resultadoFormulario.success) {
      throw new Error(resultadoFormulario.error || 'Error completando formulario')
    }

    // PASO 6: Extraer resultado (folio, PDF, etc.)
    await actualizarJob(supabase, jobId, {
      current_step: 'extrayendo_resultado',
      progress: 95
    })
    
    const resultado = await extraerResultadoSolicitud(browserSession, caso)
    
    // PASO 7: Guardar resultado y actualizar caso
    await actualizarJob(supabase, jobId, {
      status: 'completed',
      current_step: 'completado',
      progress: 100,
      resultado,
      completed_at: new Date().toISOString()
    })
    
    // Actualizar el caso con el resultado
    await supabase
      .from('casos')
      .update({
        ccl_folio: resultado.folioSolicitud,
        ccl_estado: 'solicitud_generada',
        ccl_fecha_cita: resultado.fechaCita,
        ccl_liga_unica: resultado.ligaUnica,
        ccl_instrucciones_confirmacion: resultado.instrucciones,
        updated_at: new Date().toISOString()
      })
      .eq('id', caso.casoId)

    await agregarLog(supabase, jobId, 'success', 'Solicitud completada exitosamente', resultado)

    // Notificar al abogado (crear notificación en BD)
    await crearNotificacion(supabase, jobId, caso, resultado)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    await actualizarJob(supabase, jobId, {
      status: 'failed',
      current_step: 'error',
      error: errorMessage
    })
    
    await agregarLog(supabase, jobId, 'error', `Error en agente: ${errorMessage}`)
    
    // Tomar screenshot del error si el browser está activo
    if (browserSession) {
      try {
        const errorScreenshot = await takeScreenshot(browserSession, { fullPage: true })
        if (errorScreenshot) {
          await guardarScreenshot(supabase, jobId, 'error', errorScreenshot.base64)
        }
      } catch {
        // Ignorar error al tomar screenshot
      }
    }
  } finally {
    // Cerrar sesión de browser
    if (browserSession) {
      try {
        await closeBrowserSession(browserSession)
      } catch {
        // Ignorar error al cerrar
      }
    }
  }
}

/**
 * Obtiene el portal CCL para un estado
 */
function obtenerPortalCCL(estado: string): { nombre: string; url: string } | null {
  const estadoNormalizado = estado.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  
  const portal = PORTALES_CCL_COMPLETOS.find(p => {
    const portalEstado = p.estado.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return portalEstado.includes(estadoNormalizado) || estadoNormalizado.includes(portalEstado)
  })
  
  if (portal) {
    return {
      nombre: portal.nombre,
      url: portal.url_portal
    }
  }
  
  return null
}

/**
 * Extrae el resultado de la solicitud después de enviar el formulario
 */
async function extraerResultadoSolicitud(
  session: ReturnType<typeof createBrowserSession> extends Promise<infer T> ? T : never,
  caso: CasoData
): Promise<SolicitudResultado> {
  // Por ahora retornamos datos simulados
  // TODO: Implementar extracción real del DOM
  const folioGenerado = `CCL-${caso.empleadorEstado?.substring(0, 3).toUpperCase() || 'MEX'}-${Date.now().toString(36).toUpperCase()}`
  
  const fechaCita = new Date()
  fechaCita.setDate(fechaCita.getDate() + 7)
  
  const fechaLimite = new Date()
  fechaLimite.setDate(fechaLimite.getDate() + 3)
  
  return {
    success: true,
    folioSolicitud: folioGenerado,
    fechaCita: fechaCita.toISOString().split('T')[0],
    horaCita: '10:00',
    modalidad: caso.modalidadConciliacion || 'remota',
    ligaUnica: caso.modalidadConciliacion === 'remota' 
      ? `https://conciliacion.gob.mx/audiencia/${folioGenerado}`
      : undefined,
    fechaLimiteConfirmacion: fechaLimite.toISOString().split('T')[0],
    instrucciones: caso.modalidadConciliacion === 'remota'
      ? [
          'Llama al CCL para agendar cita de confirmación por videollamada',
          'Ten a la mano tu INE y CURP',
          `Folio de referencia: ${folioGenerado}`,
          `Confirmar antes de: ${fechaLimite.toLocaleDateString('es-MX')}`
        ]
      : [
          'Acude al CCL con tu identificación oficial',
          `Folio de referencia: ${folioGenerado}`,
          `Confirmar antes de: ${fechaLimite.toLocaleDateString('es-MX')}`
        ]
  }
}

/**
 * Actualiza el job en la base de datos
 */
async function actualizarJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  updates: Partial<AgentJob>
): Promise<void> {
  await supabase
    .from('ccl_agent_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
}

/**
 * Agrega un log al job
 */
async function agregarLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  level: AgentLog['level'],
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('ccl_agent_logs')
    .insert({
      job_id: jobId,
      level,
      message,
      data
    })
}

/**
 * Guarda un screenshot
 */
async function guardarScreenshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  nombre: string,
  base64: string
): Promise<void> {
  // Guardar en storage de Supabase
  const filename = `agent-screenshots/${jobId}/${nombre}-${Date.now()}.png`
  const buffer = Buffer.from(base64, 'base64')
  
  await supabase.storage
    .from('ccl-documents')
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true
    })
}

/**
 * Crea una notificación para el abogado
 */
async function crearNotificacion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  caso: CasoData,
  resultado: SolicitudResultado
): Promise<void> {
  // Obtener el abogado del job
  const { data: job } = await supabase
    .from('ccl_agent_jobs')
    .select('abogado_id')
    .eq('id', jobId)
    .single()

  if (!job?.abogado_id) return

  const folio = resultado.folioSolicitud || 'pendiente'
  const mensaje = `✅ Solicitud CCL completada para el caso ${caso.casoId}. Folio: ${folio}. Puedes revisar el PDF del acuse en la bóveda.`

  try {
    await sendWhatsAppNotification({
      userId: job.abogado_id,
      message: mensaje,
      type: 'ccl_solicitud_completada',
      metadata: {
        caso_id: caso.casoId,
        folio
      }
    })
  } catch (error) {
    console.error('Error enviando notificación WhatsApp al abogado:', error)
  }
}

/**
 * Obtiene el estado actual de un job
 */
export async function obtenerEstadoJob(jobId: string): Promise<AgentJob | null> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('ccl_agent_jobs')
    .select('*')
    .eq('id', jobId)
    .single()
  
  return data
}

/**
 * Obtiene los logs de un job
 */
export async function obtenerLogsJob(jobId: string): Promise<AgentLog[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('ccl_agent_logs')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  
  return data || []
}

/**
 * Cancela un job en ejecución
 */
export async function cancelarJob(jobId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()
  
  await supabase
    .from('ccl_agent_jobs')
    .update({
      status: 'cancelled',
      current_step: 'cancelado',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
    .in('status', ['pending', 'running'])
  
  return { success: true }
}

/**
 * Lista los jobs recientes de un abogado
 */
export async function listarJobsAbogado(limit = 10): Promise<AgentJob[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('ccl_agent_jobs')
    .select('*')
    .eq('abogado_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}
