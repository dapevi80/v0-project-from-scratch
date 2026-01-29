'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  calcularPrescripcion as calcularPrescripcionSync, 
  ESTADOS_MEXICO as ESTADOS,
  type DatosCasoSolicitud, 
  type ResultadoSolicitud,
  type TipoTerminacion,
  type TipoPersonaCitado,
  type ModalidadConciliacionTipo
} from './solicitud-utils'

// Re-exportar solo tipos (permitido en 'use server')
export type { TipoTerminacion, TipoPersonaCitado, ModalidadConciliacionTipo, DatosCasoSolicitud, ResultadoSolicitud }

// Wrapper async para obtener estados (requerido por 'use server')
export async function getEstadosMexico() {
  return ESTADOS
}

// Wrapper async para la funcion sincrona (requerido por 'use server')
export async function calcularPrescripcion(tipoTerminacion: TipoTerminacion, fechaTerminacion: string) {
  return calcularPrescripcionSync(tipoTerminacion, fechaTerminacion)
}

// Obtener portal CCL por estado
export async function obtenerPortalCCL(estado: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ccl_portales')
    .select('*')
    .eq('estado', estado)
    .eq('activo', true)
    .single()
  
  if (error || !data) {
    // Buscar portal federal como fallback
    const { data: federal } = await supabase
      .from('ccl_portales')
      .select('*')
      .eq('codigo', 'FEDERAL')
      .single()
    
    return federal
  }
  
  return data
}

// Generar solicitud en el portal CCL (simulación preparada para integración real)
export async function generarSolicitudCCL(datos: DatosCasoSolicitud): Promise<ResultadoSolicitud> {
  const supabase = await createClient()
  
  // Verificar usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado' }
  }
  
  // Verificar rol de abogado
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['lawyer', 'guestlawyer', 'admin', 'superadmin'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para generar solicitudes CCL' }
  }
  
  // Obtener portal CCL del estado
  const portal = await obtenerPortalCCL(datos.empleadorEstado)
  if (!portal) {
    return { success: false, error: `No se encontró portal CCL para ${datos.empleadorEstado}` }
  }
  
  // Calcular prescripción
  const prescripcion = calcularPrescripcion(datos.tipoTerminacion, datos.fechaTerminacion)
  
  if (prescripcion.diasRestantes <= 0) {
    return { 
      success: false, 
      error: `El plazo de prescripción ha vencido. La fecha límite era ${prescripcion.fechaLimite}` 
    }
  }
  
  try {
    // AQUÍ VA LA INTEGRACIÓN REAL CON EL PORTAL CCL
    // Por ahora generamos un folio de prueba para demostración
    
    const folioGenerado = `CCL-${portal.codigo}-${Date.now().toString(36).toUpperCase()}`
    const modalidad = datos.modalidadConciliacion || 'remota'
    
    // Calcular fecha límite de confirmación (3 días hábiles)
    const fechaLimiteConfirmacion = new Date()
    fechaLimiteConfirmacion.setDate(fechaLimiteConfirmacion.getDate() + 3)
    
    // Calcular fecha de cita (5-7 días hábiles después de confirmar)
    const fechaCita = new Date()
    fechaCita.setDate(fechaCita.getDate() + 7) // 7 días hábiles aproximado
    
    // Liga única para audiencias remotas (simulación)
    const ligaUnica = modalidad === 'remota' 
      ? `https://conciliacion.${portal.codigo.toLowerCase()}.gob.mx/audiencia/${folioGenerado}`
      : undefined
    
    // Generar instrucciones específicas según modalidad
    const instruccionesConfirmacion = modalidad === 'remota'
      ? [
          `1. Llama al CCL de ${datos.empleadorEstado} para agendar tu cita de confirmación por videollamada`,
          `2. Teléfono: ${portal.telefono || 'Consulta en el acuse de solicitud'}`,
          `3. Ten a la mano: Folio ${folioGenerado}, tu INE/IFE escaneada, CURP`,
          `4. En la videollamada confirmarás tu solicitud con el oficial de partes`,
          `5. Se te asignará fecha y hora de audiencia de conciliación virtual`,
          `6. Recibirás una liga única para tu audiencia por videollamada`,
          `7. IMPORTANTE: Tienes 3 días hábiles para confirmar tu solicitud`
        ]
      : [
          `1. Acude personalmente al CCL de ${datos.empleadorEstado}`,
          `2. Dirección: ${portal.direccion || 'Consulta en el acuse de solicitud'}`,
          `3. Lleva: Folio ${folioGenerado}, INE/IFE original, comprobante de domicilio`,
          `4. Horario de atención: ${portal.horario || 'Lunes a Viernes 8:00-15:00'}`,
          `5. Confirmarás tu solicitud con el oficial de partes`,
          `6. Se te asignará fecha y hora de audiencia presencial`,
          `7. IMPORTANTE: Tienes 3 días hábiles para confirmar tu solicitud`
        ]
    
    // Registrar solicitud en base de datos
    const { error: insertError } = await supabase
      .from('ccl_solicitudes_automaticas')
      .insert({
        caso_id: datos.casoId,
        abogado_id: user.id,
        portal_id: portal.id,
        estado: datos.empleadorEstado,
        tipo_terminacion: datos.tipoTerminacion,
        folio_solicitud: folioGenerado,
        fecha_cita: fechaCita.toISOString().split('T')[0],
        hora_cita: '10:00',
        sede_ccl: portal.nombre,
        direccion_sede: portal.direccion,
        estatus: 'pendiente_confirmacion', // Nueva: pendiente de confirmar
        datos_solicitud: {
          ...datos,
          modalidad,
          citadoTipoPersona: datos.citadoTipoPersona || 'moral'
        },
        prescripcion_dias_restantes: prescripcion.diasRestantes
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error registrando solicitud:', insertError)
      return { success: false, error: 'Error al registrar la solicitud' }
    }
    
    // Actualizar el caso con la información de la solicitud
    await supabase
      .from('casos')
      .update({
        ccl_folio: folioGenerado,
        ccl_fecha_cita: fechaCita.toISOString().split('T')[0],
        ccl_estado: 'pendiente_confirmacion',
        modalidad_conciliacion: modalidad,
        ccl_liga_unica: ligaUnica,
        ccl_fecha_limite_confirmacion: fechaLimiteConfirmacion.toISOString().split('T')[0],
        ccl_instrucciones_confirmacion: instruccionesConfirmacion,
        updated_at: new Date().toISOString()
      })
      .eq('id', datos.casoId)
    
    return {
      success: true,
      folioSolicitud: folioGenerado,
      fechaCita: fechaCita.toISOString().split('T')[0],
      horaCita: '10:00',
      sedeCcl: portal.nombre,
      direccionSede: portal.direccion,
      urlComprobante: portal.url_portal,
      portalUsado: portal.nombre,
      modalidad,
      ligaUnica,
      fechaLimiteConfirmacion: fechaLimiteConfirmacion.toISOString().split('T')[0],
      telefonoConfirmacion: portal.telefono,
      instruccionesConfirmacion,
      instrucciones: [
        `Tu solicitud ha sido registrada con folio ${folioGenerado}`,
        `Tipo de persona demandada: ${datos.citadoTipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral (empresa)'}`,
        `Modalidad elegida: Conciliación ${modalidad === 'remota' ? 'REMOTA (videollamada)' : 'PRESENCIAL'}`,
        '',
        `SIGUIENTE PASO: Confirmar solicitud antes del ${fechaLimiteConfirmacion.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        '',
        ...instruccionesConfirmacion,
        '',
        prescripcion.urgente ? `URGENTE: Solo quedan ${prescripcion.diasRestantes} días antes de que prescriba tu derecho` : ''
      ].filter(Boolean)
    }
    
  } catch (error) {
    console.error('Error generando solicitud CCL:', error)
    return { success: false, error: 'Error al conectar con el portal CCL' }
  }
}

// Obtener solicitudes de un abogado
export async function obtenerSolicitudesAbogado() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('ccl_solicitudes_automaticas')
    .select(`
      *,
      portal:ccl_portales(nombre, estado, url_portal)
    `)
    .eq('abogado_id', user.id)
    .order('created_at', { ascending: false })
  
  return data || []
}
