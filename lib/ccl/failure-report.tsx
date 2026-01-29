'use server'

import { createClient } from '@/lib/supabase/server'
import { generarHTMLReporteFallo, type DatosFalloCCL } from './failure-report-utils'

// NOTA: Los tipos y funciones utilitarias se importan desde './failure-report-utils'
// No re-exportamos aqui para evitar conflictos con 'use server'
export type { DatosFalloCCL }

// Guardar reporte de fallo en la base de datos y storage
export async function guardarReporteFallo(datos: DatosFalloCCL): Promise<{
  success: boolean
  reporteUrl?: string
  screenshotUrl?: string
  error?: string
}> {
  const supabase = await createClient()
  
  try {
    // Generar HTML del reporte
    const htmlReporte = generarHTMLReporteFallo(datos)
    
    // Subir HTML como archivo (se puede convertir a PDF con un servicio externo)
    const reportePath = `reportes-fallo/${datos.estado}/${datos.folio}-${Date.now()}.html`
    
    const { error: uploadError } = await supabase.storage
      .from('documentos-ccl')
      .upload(reportePath, new Blob([htmlReporte], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Error subiendo reporte:', uploadError)
    }
    
    // Subir screenshot si existe
    let screenshotPath: string | undefined
    if (datos.screenshotBase64) {
      screenshotPath = `screenshots-fallo/${datos.estado}/${datos.folio}-${Date.now()}.png`
      
      // Convertir base64 a buffer
      const screenshotBuffer = Buffer.from(datos.screenshotBase64, 'base64')
      
      const { error: ssError } = await supabase.storage
        .from('documentos-ccl')
        .upload(screenshotPath, screenshotBuffer, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (ssError) {
        console.error('Error subiendo screenshot:', ssError)
      }
    }
    
    // Actualizar la solicitud con los datos del fallo
    const { error: updateError } = await supabase
      .from('solicitudes_ccl')
      .update({
        status: 'requiere_intervencion',
        reporte_fallo_url: reportePath,
        screenshot_fallo_url: screenshotPath,
        paso_fallo: datos.pasoFallo,
        error_mensaje: datos.errorMensaje,
        tiempo_proceso_ms: datos.tiempoProceso,
        credito_debitado: false, // NO debitar en caso de fallo
        updated_at: new Date().toISOString()
      })
      .eq('id', datos.solicitudId)
    
    if (updateError) {
      console.error('Error actualizando solicitud:', updateError)
      return { success: false, error: updateError.message }
    }
    
    // Obtener URLs publicas
    const { data: reporteUrlData } = await supabase.storage
      .from('documentos-ccl')
      .createSignedUrl(reportePath, 60 * 60 * 24 * 7) // 7 dias
    
    let screenshotUrl: string | undefined
    if (screenshotPath) {
      const { data: ssUrlData } = await supabase.storage
        .from('documentos-ccl')
        .createSignedUrl(screenshotPath, 60 * 60 * 24 * 7)
      screenshotUrl = ssUrlData?.signedUrl
    }
    
    return {
      success: true,
      reporteUrl: reporteUrlData?.signedUrl,
      screenshotUrl
    }
    
  } catch (error) {
    console.error('Error guardando reporte de fallo:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

// Obtener reportes de fallo pendientes (para admin)
export async function obtenerReportesFalloPendientes(): Promise<{
  success: boolean
  reportes?: Array<{
    id: string
    folio: string
    estado: string
    pasoFallo: string
    errorMensaje: string
    fecha: string
    reporteUrl?: string
    screenshotUrl?: string
  }>
  error?: string
}> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('solicitudes_ccl')
    .select('id, folio, estado, paso_fallo, error_mensaje, reporte_fallo_url, screenshot_fallo_url, created_at')
    .eq('status', 'requiere_intervencion')
    .order('created_at', { ascending: false })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  const reportes = (data || []).map(r => ({
    id: r.id,
    folio: r.folio || '',
    estado: r.estado,
    pasoFallo: r.paso_fallo || 'Desconocido',
    errorMensaje: r.error_mensaje || 'Sin detalle',
    fecha: r.created_at,
    reporteUrl: r.reporte_fallo_url,
    screenshotUrl: r.screenshot_fallo_url
  }))
  
  return { success: true, reportes }
}
