import { createClient } from '@/lib/supabase/server'

// Tipos de terminación laboral
export type TipoTerminacion = 'despido' | 'rescision' | 'renuncia_forzada'

// Datos del caso para generar solicitud
export interface DatosCasoSolicitud {
  casoId: string
  trabajadorNombre: string
  trabajadorCurp?: string
  trabajadorDomicilio?: string
  trabajadorTelefono?: string
  trabajadorEmail?: string
  empleadorNombre: string
  empleadorRfc?: string
  empleadorDomicilio?: string
  empleadorEstado: string
  fechaIngreso: string
  fechaTerminacion: string
  tipoTerminacion: TipoTerminacion
  salarioDiario: number
  puestoTrabajo?: string
  descripcionHechos?: string
  prestacionesReclamadas?: string[]
  montoEstimado?: number
}

// Resultado de la solicitud
export interface ResultadoSolicitud {
  success: boolean
  folioSolicitud?: string
  fechaCita?: string
  horaCita?: string
  sedeCcl?: string
  direccionSede?: string
  urlComprobante?: string
  instrucciones?: string[]
  error?: string
  portalUsado?: string
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

// Calcular días de prescripción según tipo de terminación
export function calcularPrescripcion(tipoTerminacion: TipoTerminacion, fechaTerminacion: string): {
  diasRestantes: number
  fechaLimite: string
  urgente: boolean
} {
  const fechaTerm = new Date(fechaTerminacion)
  const hoy = new Date()
  
  // Días de prescripción según tipo
  const diasPrescripcion = {
    despido: 60,      // Despido injustificado: 60 días
    rescision: 60,    // Rescisión por causa imputable al patrón: 60 días  
    renuncia_forzada: 60 // Renuncia forzada: 60 días
  }
  
  const diasTotales = diasPrescripcion[tipoTerminacion]
  const fechaLimite = new Date(fechaTerm)
  fechaLimite.setDate(fechaLimite.getDate() + diasTotales)
  
  const diasTranscurridos = Math.floor((hoy.getTime() - fechaTerm.getTime()) / (1000 * 60 * 60 * 24))
  const diasRestantes = diasTotales - diasTranscurridos
  
  return {
    diasRestantes: Math.max(0, diasRestantes),
    fechaLimite: fechaLimite.toISOString().split('T')[0],
    urgente: diasRestantes <= 15 && diasRestantes > 0
  }
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
    
    // Calcular fecha de cita (3-5 días hábiles después)
    const fechaCita = new Date()
    fechaCita.setDate(fechaCita.getDate() + 5) // 5 días hábiles aproximado
    
    // Registrar solicitud en base de datos
    const { data: solicitud, error: insertError } = await supabase
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
        estatus: 'generada',
        datos_solicitud: datos,
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
        ccl_estado: 'solicitud_generada',
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
      instrucciones: [
        `Tu solicitud ha sido registrada con folio ${folioGenerado}`,
        `Fecha de audiencia de conciliación: ${fechaCita.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Hora: 10:00 AM`,
        `Sede: ${portal.nombre}`,
        `Dirección: ${portal.direccion}`,
        `Presenta tu identificación oficial y comprobante de domicilio`,
        `Llega 30 minutos antes de tu cita`,
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

// Lista de estados de México para selector
export const ESTADOS_MEXICO = [
  { codigo: 'AGS', nombre: 'Aguascalientes' },
  { codigo: 'BC', nombre: 'Baja California' },
  { codigo: 'BCS', nombre: 'Baja California Sur' },
  { codigo: 'CAMP', nombre: 'Campeche' },
  { codigo: 'CHIS', nombre: 'Chiapas' },
  { codigo: 'CHIH', nombre: 'Chihuahua' },
  { codigo: 'CDMX', nombre: 'Ciudad de México' },
  { codigo: 'COAH', nombre: 'Coahuila' },
  { codigo: 'COL', nombre: 'Colima' },
  { codigo: 'DGO', nombre: 'Durango' },
  { codigo: 'GTO', nombre: 'Guanajuato' },
  { codigo: 'GRO', nombre: 'Guerrero' },
  { codigo: 'HGO', nombre: 'Hidalgo' },
  { codigo: 'JAL', nombre: 'Jalisco' },
  { codigo: 'MEX', nombre: 'Estado de México' },
  { codigo: 'MICH', nombre: 'Michoacán' },
  { codigo: 'MOR', nombre: 'Morelos' },
  { codigo: 'NAY', nombre: 'Nayarit' },
  { codigo: 'NL', nombre: 'Nuevo León' },
  { codigo: 'OAX', nombre: 'Oaxaca' },
  { codigo: 'PUE', nombre: 'Puebla' },
  { codigo: 'QRO', nombre: 'Querétaro' },
  { codigo: 'QROO', nombre: 'Quintana Roo' },
  { codigo: 'SLP', nombre: 'San Luis Potosí' },
  { codigo: 'SIN', nombre: 'Sinaloa' },
  { codigo: 'SON', nombre: 'Sonora' },
  { codigo: 'TAB', nombre: 'Tabasco' },
  { codigo: 'TAMPS', nombre: 'Tamaulipas' },
  { codigo: 'TLAX', nombre: 'Tlaxcala' },
  { codigo: 'VER', nombre: 'Veracruz' },
  { codigo: 'YUC', nombre: 'Yucatán' },
  { codigo: 'ZAC', nombre: 'Zacatecas' },
  { codigo: 'FEDERAL', nombre: 'Jurisdicción Federal' }
]
