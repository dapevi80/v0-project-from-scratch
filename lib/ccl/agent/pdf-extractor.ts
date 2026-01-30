'use server'

import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import type { BrowserSession, ScreenshotData, SolicitudResultado } from './agent-types'
import { evaluateScript, extractText, takeScreenshot, clickElement, waitForElement } from './browser-service'

/**
 * Extractor de PDFs y datos de confirmación de solicitudes CCL
 */

const AI_MODEL = 'xai/grok-2-vision-latest'

/**
 * Busca y descarga el PDF de acuse de solicitud
 */
export async function extraerPDFAcuse(
  session: BrowserSession,
  jobId: string,
  casoId: string
): Promise<{
  success: boolean
  pdfUrl?: string
  pdfBase64?: string
  error?: string
}> {
  try {
    // Buscar enlace de descarga de PDF
    const pdfSelectors = [
      'a[href*=".pdf"]',
      'a[href*="descargar"]',
      'a[href*="acuse"]',
      'button:contains("Descargar")',
      'a:contains("PDF")',
      'a:contains("Acuse")',
      '.download-pdf',
      '#btn-descargar'
    ]
    
    let pdfUrl: string | null = null
    
    for (const selector of pdfSelectors) {
      try {
        const result = await evaluateScript(session, `
          const el = document.querySelector('${selector}');
          if (el) {
            return el.href || el.getAttribute('data-url') || null;
          }
          return null;
        `)
        
        if (result.success && result.data) {
          pdfUrl = result.data as string
          break
        }
      } catch {
        continue
      }
    }
    
    if (pdfUrl) {
      // Descargar el PDF
      const pdfResponse = await fetch(pdfUrl)
      
      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer()
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
        
        // Guardar en Supabase Storage
        const supabase = await createClient()
        const filename = `solicitudes/${casoId}/acuse-${Date.now()}.pdf`
        const pdfBlob = Buffer.from(pdfBuffer)
        
        await supabase.storage
          .from('ccl-documents')
          .upload(filename, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          })
        
        const { data: urlData } = supabase.storage
          .from('ccl-documents')
          .getPublicUrl(filename)

        // Guardar copia en Bóveda del trabajador
        try {
          const { data: caso } = await supabase
            .from('casos')
            .select('worker_id, folio')
            .eq('id', casoId)
            .single()

          if (caso?.worker_id) {
            const bovedaFilename = `acuse/${casoId}/acuse-${Date.now()}.pdf`
            const bovedaPath = `${caso.worker_id}/${bovedaFilename}`
            const uploadBoveda = await supabase.storage
              .from('boveda')
              .upload(bovedaPath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
              })

            if (!uploadBoveda.error) {
              await supabase
                .from('documentos_boveda')
                .insert({
                  user_id: caso.worker_id,
                  categoria: 'acuse',
                  nombre: `Acuse CCL ${caso.folio || ''}`.trim(),
                  nombre_original: `acuse-${casoId}.pdf`,
                  archivo_path: bovedaPath,
                  mime_type: 'application/pdf',
                  tamanio_bytes: pdfBlob.length,
                  estado: 'activo',
                  verificado: false,
                  metadata: {
                    caso_id: casoId,
                    origen: 'ccl'
                  }
                })
            }
          }
        } catch {
          // Ignorar errores al guardar en bóveda
        }
        
        return {
          success: true,
          pdfUrl: urlData.publicUrl,
          pdfBase64
        }
      }
    }
    
    // Si no hay PDF directo, intentar imprimir la página como PDF
    // (esto requiere funcionalidad adicional en Browserless)
    
    return {
      success: false,
      error: 'No se encontró enlace de descarga de PDF'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error extrayendo PDF'
    }
  }
}

/**
 * Extrae datos del resultado de la solicitud usando IA de visión
 */
export async function extraerDatosResultado(
  screenshot: ScreenshotData
): Promise<Partial<SolicitudResultado>> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Analiza esta captura de pantalla de una confirmación de solicitud de conciliación laboral.

Extrae la siguiente información si está visible:
1. Número de folio o expediente
2. Fecha de la cita/audiencia
3. Hora de la cita
4. Nombre del Centro de Conciliación
5. Dirección de la sede
6. Si es audiencia virtual o presencial
7. Liga/URL para audiencia virtual (si aplica)
8. Fecha límite para confirmar
9. Teléfono de contacto
10. Cualquier instrucción importante

Responde en formato JSON con esta estructura:
{
  "folioSolicitud": "string o null",
  "fechaCita": "YYYY-MM-DD o null",
  "horaCita": "HH:MM o null", 
  "sedeCcl": "string o null",
  "direccionSede": "string o null",
  "modalidad": "remota o presencial o null",
  "ligaUnica": "URL o null",
  "fechaLimiteConfirmacion": "YYYY-MM-DD o null",
  "telefonoContacto": "string o null",
  "instrucciones": ["array de strings"]
}

Si no puedes identificar algún dato, usa null.`
            }
          ]
        }
      ],
      maxTokens: 1000
    })

    try {
      // Intentar parsear el JSON de la respuesta
      const jsonMatch = response.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const datos = JSON.parse(jsonMatch[0])
        return {
          success: true,
          folioSolicitud: datos.folioSolicitud || undefined,
          fechaCita: datos.fechaCita || undefined,
          horaCita: datos.horaCita || undefined,
          sedeCcl: datos.sedeCcl || undefined,
          direccionSede: datos.direccionSede || undefined,
          modalidad: datos.modalidad || undefined,
          ligaUnica: datos.ligaUnica || undefined,
          fechaLimiteConfirmacion: datos.fechaLimiteConfirmacion || undefined,
          telefonoConfirmacion: datos.telefonoContacto || undefined,
          instrucciones: datos.instrucciones || []
        }
      }
    } catch {
      // Si falla el parseo, retornar sin datos extraídos
    }

    return { success: false }
  } catch (error) {
    console.error('Error extrayendo datos con IA:', error)
    return { success: false }
  }
}

/**
 * Busca y extrae el folio de solicitud del DOM
 */
export async function extraerFolioDelDOM(session: BrowserSession): Promise<string | null> {
  // Selectores comunes donde aparece el folio
  const folioSelectors = [
    '.folio', '#folio', '[data-folio]',
    '.numero-expediente', '#expediente',
    'span:contains("Folio")', 'p:contains("Folio")',
    '.confirmation-number', '.reference-number'
  ]
  
  for (const selector of folioSelectors) {
    try {
      const text = await extractText(session, selector)
      if (text) {
        // Buscar patrones de folio (ej: CCL-QRO-123456, EXP-2024-001)
        const folioMatch = text.match(/[A-Z]{2,5}[-\/]?[A-Z0-9]{2,10}[-\/]?\d{4,}/i)
        if (folioMatch) {
          return folioMatch[0]
        }
        
        // Si el texto parece ser solo el folio
        if (/^[A-Z0-9\-\/]+$/i.test(text.trim()) && text.length > 5) {
          return text.trim()
        }
      }
    } catch {
      continue
    }
  }
  
  // Intentar extraer de toda la página
  const pageText = await extractText(session, 'body')
  if (pageText) {
    const patterns = [
      /folio[:\s]*([A-Z0-9\-\/]+)/i,
      /expediente[:\s]*([A-Z0-9\-\/]+)/i,
      /numero[:\s]*([A-Z0-9\-\/]+)/i,
      /solicitud[:\s]*([A-Z0-9\-\/]+)/i,
      /CCL[-\/]?[A-Z]{2,3}[-\/]?\d+/i,
      /\d{4}[-\/]\d{4,}/
    ]
    
    for (const pattern of patterns) {
      const match = pageText.match(pattern)
      if (match) {
        return match[1] || match[0]
      }
    }
  }
  
  return null
}

/**
 * Extrae la fecha de cita del DOM
 */
export async function extraerFechaCitaDelDOM(session: BrowserSession): Promise<{
  fecha?: string
  hora?: string
} | null> {
  const dateSelectors = [
    '.fecha-cita', '#fecha-cita', '[data-fecha]',
    '.fecha-audiencia', '#fecha-audiencia',
    'span:contains("Fecha")', 'p:contains("Fecha")'
  ]
  
  for (const selector of dateSelectors) {
    try {
      const text = await extractText(session, selector)
      if (text) {
        // Buscar fecha en formato DD/MM/YYYY o YYYY-MM-DD
        const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/)
        const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i)
        
        if (dateMatch) {
          return {
            fecha: dateMatch[0],
            hora: timeMatch ? timeMatch[0] : undefined
          }
        }
      }
    } catch {
      continue
    }
  }
  
  return null
}

/**
 * Extrae la liga única para audiencias virtuales
 */
export async function extraerLigaVirtual(session: BrowserSession): Promise<string | null> {
  const linkSelectors = [
    'a[href*="zoom"]',
    'a[href*="teams"]',
    'a[href*="meet"]',
    'a[href*="audiencia"]',
    'a[href*="videollamada"]',
    '.liga-audiencia', '#liga-audiencia',
    'input[value*="http"]'
  ]
  
  for (const selector of linkSelectors) {
    try {
      const result = await evaluateScript(session, `
        const el = document.querySelector('${selector}');
        if (el) {
          return el.href || el.value || el.textContent;
        }
        return null;
      `)
      
      if (result.success && result.data) {
        const url = result.data as string
        // Verificar que parece una URL válida
        if (url.startsWith('http')) {
          return url
        }
      }
    } catch {
      continue
    }
  }
  
  // Buscar URLs en el texto de la página
  const pageText = await extractText(session, 'body')
  if (pageText) {
    const urlMatch = pageText.match(/(https?:\/\/[^\s]+(?:zoom|teams|meet|audiencia|videollamada)[^\s]*)/i)
    if (urlMatch) {
      return urlMatch[1]
    }
  }
  
  return null
}

/**
 * Proceso completo de extracción de resultado
 */
export async function extraerResultadoCompleto(
  session: BrowserSession,
  jobId: string,
  casoId: string
): Promise<SolicitudResultado> {
  // 1. Tomar screenshot de la página de confirmación
  const screenshot = await takeScreenshot(session, { fullPage: true })
  
  let resultado: Partial<SolicitudResultado> = { success: false }
  
  // 2. Intentar extracción con IA de visión
  if (screenshot) {
    resultado = await extraerDatosResultado(screenshot)
  }
  
  // 3. Complementar con extracción del DOM
  if (!resultado.folioSolicitud) {
    resultado.folioSolicitud = await extraerFolioDelDOM(session) || undefined
  }
  
  if (!resultado.fechaCita) {
    const fechaData = await extraerFechaCitaDelDOM(session)
    if (fechaData) {
      resultado.fechaCita = fechaData.fecha
      resultado.horaCita = fechaData.hora
    }
  }
  
  if (!resultado.ligaUnica) {
    resultado.ligaUnica = await extraerLigaVirtual(session) || undefined
  }
  
  // 4. Intentar descargar PDF
  const pdfResult = await extraerPDFAcuse(session, jobId, casoId)
  if (pdfResult.success) {
    resultado.pdfUrl = pdfResult.pdfUrl
  }
  
  // 5. Determinar si fue exitoso
  resultado.success = Boolean(resultado.folioSolicitud)
  
  return resultado as SolicitudResultado
}
