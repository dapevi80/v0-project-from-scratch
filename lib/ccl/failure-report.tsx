'use server'

import { createClient } from '@/lib/supabase/server'

// Tipos para el reporte de fallo
export interface DatosFalloCCL {
  solicitudId: string
  folio: string
  estado: string
  pasoFallo: string
  errorMensaje: string
  screenshotBase64?: string
  screenshotUrl?: string
  urlPortal: string
  tiempoProceso: number
  fechaIntento: string
  pasosPrevios: {
    paso: string
    completado: boolean
    tiempo?: number
  }[]
}

// Generar HTML del reporte de fallo (para convertir a PDF)
export function generarHTMLReporteFallo(datos: DatosFalloCCL): string {
  const fechaFormateada = new Date(datos.fechaIntento).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const pasosHTML = datos.pasosPrevios.map((paso, idx) => `
    <tr style="background-color: ${paso.completado ? '#f0fdf4' : '#fef2f2'};">
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace;">${idx + 1}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${paso.paso}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: center;">
        ${paso.completado ? '<span style="color: #16a34a;">Completado</span>' : '<span style="color: #dc2626;">FALLO</span>'}
      </td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">
        ${paso.tiempo ? `${paso.tiempo}ms` : '-'}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Fallo CCL - ${datos.folio}</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: #fff;
      color: #1f2937;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 24px 32px;
      border-radius: 12px 12px 0 0;
      margin: -40px -40px 0;
    }
    .content { padding: 32px 0; }
    .badge {
      display: inline-block;
      background: #fef2f2;
      border: 2px solid #fecaca;
      color: #991b1b;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: monospace;
      font-weight: bold;
      font-size: 14px;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .error-box {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .screenshot {
      border: 2px solid #dc2626;
      border-radius: 8px;
      overflow: hidden;
      margin: 20px 0;
    }
    .screenshot img {
      width: 100%;
      display: block;
    }
    .screenshot-caption {
      background: #1f2937;
      color: white;
      padding: 12px 16px;
      font-size: 12px;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th {
      background: #f3f4f6;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #e5e7eb;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0 0 8px; font-size: 24px;">REPORTE DE FALLO - Proceso CCL</h1>
    <p style="margin: 0; opacity: 0.9;">Centro de Conciliación Laboral - ${datos.estado}</p>
  </div>
  
  <div class="content">
    <!-- Folio y Estado -->
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 24px;">
      <span class="badge">FOLIO: ${datos.folio}</span>
      <span class="badge" style="background: #fef3c7; border-color: #fcd34d; color: #92400e;">
        REQUIERE INTERVENCIÓN HUMANA
      </span>
    </div>
    
    <!-- Info del fallo -->
    <div class="error-box">
      <h3 style="margin: 0 0 12px; color: #991b1b;">Error Detectado</h3>
      <p style="margin: 0 0 8px;"><strong>Paso donde falló:</strong> ${datos.pasoFallo}</p>
      <p style="margin: 0; font-family: monospace; background: #1f2937; color: #fca5a5; padding: 12px; border-radius: 4px; white-space: pre-wrap;">
${datos.errorMensaje}
      </p>
    </div>
    
    <!-- Detalles -->
    <div class="info-box">
      <h3 style="margin: 0 0 16px;">Detalles del Intento</h3>
      <table>
        <tr>
          <td style="padding: 6px 0; color: #6b7280; width: 180px;">Fecha/Hora del intento:</td>
          <td style="padding: 6px 0; font-weight: 500;">${fechaFormateada}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Tiempo total proceso:</td>
          <td style="padding: 6px 0; font-family: monospace;">${datos.tiempoProceso}ms (${(datos.tiempoProceso / 1000).toFixed(2)}s)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Portal CCL:</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${datos.urlPortal}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">ID Solicitud:</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${datos.solicitudId}</td>
        </tr>
      </table>
    </div>
    
    <!-- Secuencia de pasos -->
    <h3 style="margin: 24px 0 12px;">Secuencia de Pasos</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Paso</th>
          <th style="width: 100px; text-align: center;">Estado</th>
          <th style="width: 80px; text-align: right;">Tiempo</th>
        </tr>
      </thead>
      <tbody>
        ${pasosHTML}
      </tbody>
    </table>
    
    <!-- Screenshot -->
    ${datos.screenshotBase64 || datos.screenshotUrl ? `
    <h3 style="margin: 32px 0 12px;">Captura de Pantalla del Error</h3>
    <div class="screenshot">
      <img src="${datos.screenshotBase64 ? `data:image/png;base64,${datos.screenshotBase64}` : datos.screenshotUrl}" alt="Screenshot del error">
      <div class="screenshot-caption">
        Captura tomada en el momento del fallo - Paso: ${datos.pasoFallo}
      </div>
    </div>
    ` : `
    <div class="info-box" style="background: #fef3c7; border-color: #fcd34d;">
      <p style="margin: 0; color: #92400e;">
        <strong>Nota:</strong> No se pudo capturar screenshot del error. 
        Revisar manualmente el portal CCL.
      </p>
    </div>
    `}
    
    <!-- Instrucciones -->
    <div class="info-box" style="background: #eff6ff; border-color: #bfdbfe;">
      <h3 style="margin: 0 0 12px; color: #1d4ed8;">Acción Requerida</h3>
      <ol style="margin: 0; padding-left: 20px; color: #1e40af;">
        <li style="margin-bottom: 8px;">Acceder manualmente al portal CCL de ${datos.estado}</li>
        <li style="margin-bottom: 8px;">Completar el paso "${datos.pasoFallo}" manualmente</li>
        <li style="margin-bottom: 8px;">Obtener el documento oficial de la solicitud</li>
        <li style="margin-bottom: 8px;">Subir el documento a la Bóveda Digital del usuario</li>
        <li>Actualizar el estado de la solicitud en el sistema</li>
      </ol>
    </div>
  </div>
  
  <div class="footer">
    <p>Este reporte fue generado automáticamente por el Sistema de Diagnóstico CCL.</p>
    <p>Generado el: ${new Date().toLocaleString('es-MX')}</p>
  </div>
</body>
</html>
  `.trim()
}

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
    
    // Obtener URLs públicas
    const { data: reporteUrlData } = await supabase.storage
      .from('documentos-ccl')
      .createSignedUrl(reportePath, 60 * 60 * 24 * 7) // 7 días
    
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
