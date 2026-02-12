'use server'

import { createClient } from '@/lib/supabase/server'
import {
  calcularPrescripcion as calcularPrescripcionSync,
  ESTADOS_MEXICO as ESTADOS,
  type DatosCasoSolicitud,
  type ResultadoSolicitud,
  type TipoTerminacion,
  type TipoPersonaCitado,
  type ModalidadConciliacionTipo,
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
export async function generarSolicitudCCL(_: DatosCasoSolicitud): Promise<ResultadoSolicitud> {
  return {
    success: false,
    error: 'La generación automática por simulación fue removida. Usa el agente de IA para solicitudes reales.',
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
