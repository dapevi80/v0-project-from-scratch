'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RegeneratePDFResult {
  success: boolean
  error?: string
  newPaths?: {
    liquidacion?: string
    propuesta?: string
  }
}

// Obtener datos del abogado para incluir en PDFs
export async function obtenerDatosAbogado(lawyerId: string) {
  const supabase = await createClient()
  
  const { data: lawyerProfile, error } = await supabase
    .from('lawyer_profiles')
    .select('display_name, cedula_numero, whatsapp, firm_name')
    .eq('id', lawyerId)
    .single()
  
  if (error || !lawyerProfile) {
    return null
  }
  
  return {
    nombre: lawyerProfile.display_name,
    cedula: lawyerProfile.cedula_numero,
    whatsapp: lawyerProfile.whatsapp,
    firma: lawyerProfile.firm_name
  }
}

// Funcion para regenerar PDFs cuando se asigna un abogado a un caso
export async function regenerarPDFsConAbogado(
  casoId: string, 
  lawyerId: string
): Promise<RegeneratePDFResult> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    if (!adminClient) {
      return { success: false, error: 'Admin client no disponible' }
    }
    
    // 1. Obtener datos del caso
    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('id, folio, worker_id, metadata')
      .eq('id', casoId)
      .single()
    
    if (casoError || !caso) {
      return { success: false, error: 'Caso no encontrado' }
    }
    
    // 2. Obtener datos del abogado
    const datosAbogado = await obtenerDatosAbogado(lawyerId)
    if (!datosAbogado) {
      return { success: false, error: 'Abogado no encontrado' }
    }
    
    // 3. Buscar calculos guardados asociados al caso/trabajador
    // Los cálculos se guardan en documentos_boveda con categoria 'calculo_liquidacion'
    const { data: calculos, error: calculosError } = await supabase
      .from('documentos_boveda')
      .select('*')
      .eq('user_id', caso.worker_id)
      .eq('categoria', 'calculo_liquidacion')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (calculosError || !calculos || calculos.length === 0) {
      // No hay calculos que actualizar, pero no es un error
      return { success: true, newPaths: {} }
    }
    
    const calculo = calculos[0]
    
    // 4. Actualizar el registro del calculo con los datos del abogado
    const { error: updateError } = await supabase
      .from('documentos_boveda')
      .update({
        metadata: {
          ...(calculo.metadata as object || {}),
          abogado_asignado: {
            id: lawyerId,
            nombre: datosAbogado.nombre,
            cedula: datosAbogado.cedula,
            whatsapp: datosAbogado.whatsapp,
            fecha_asignacion: new Date().toISOString()
          },
          folio_caso: caso.folio
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', calculo.id)
    
    if (updateError) {
      console.error('Error actualizando calculo:', updateError)
      return { success: false, error: 'Error actualizando datos del calculo' }
    }
    
    // Nota: La regeneracion real de los PDFs se haria aqui si fuera necesario
    // Por ahora, los PDFs se generan dinamicamente con los datos del abogado
    // cuando el usuario los visualiza o descarga
    
    return { 
      success: true,
      newPaths: {
        liquidacion: calculo.archivo_path,
        propuesta: calculo.archivo_propuesta_path
      }
    }
    
  } catch (error) {
    console.error('Error regenerando PDFs:', error)
    return { success: false, error: 'Error inesperado regenerando PDFs' }
  }
}

// Funcion para actualizar PDFs al asignar abogado (llamada desde acciones de casos)
export async function actualizarPDFsAlAsignarAbogado(
  casoId: string,
  lawyerId: string
): Promise<{ success: boolean; message: string }> {
  const result = await regenerarPDFsConAbogado(casoId, lawyerId)
  
  if (result.success) {
    return {
      success: true,
      message: 'Documentos actualizados con datos del abogado asignado'
    }
  }
  
  return {
    success: false,
    message: result.error || 'Error actualizando documentos'
  }
}
