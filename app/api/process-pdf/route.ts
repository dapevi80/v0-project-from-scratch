import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

// Función para calcular calidad basada en características del PDF
function calculatePDFQuality(base64: string, fileName: string): number {
  // Calcular tamaño del archivo
  const sizeInBytes = (base64.length * 3) / 4
  const sizeInKB = sizeInBytes / 1024
  
  let quality = 50 // Base
  
  // PDFs más grandes suelen tener mejor calidad (imágenes de alta resolución)
  if (sizeInKB > 500) quality += 20
  else if (sizeInKB > 200) quality += 15
  else if (sizeInKB > 100) quality += 10
  else if (sizeInKB < 50) quality -= 10
  
  // Verificar si es un PDF nativo (texto) vs escaneado (imagen)
  // Los PDFs nativos tienen mejor calidad de texto
  const hasTextMarkers = base64.includes('VGV4dA') || base64.includes('Rm9udA') // "Text" o "Font" en base64
  if (hasTextMarkers) quality += 25
  
  // Nombres de archivo que sugieren documentos oficiales
  const officialTerms = ['constancia', 'acta', 'contrato', 'carta', 'oficio', 'notificacion', 'citatorio']
  if (officialTerms.some(term => fileName.toLowerCase().includes(term))) {
    quality += 5
  }
  
  // Cap quality at 100
  return Math.min(100, Math.max(0, quality))
}

export async function POST(request: Request) {
  try {
    const { pdfBase64, fileName } = await request.json()
    
    if (!pdfBase64) {
      return Response.json({ error: 'PDF requerido' }, { status: 400 })
    }
    
    // Calcular calidad del documento
    const quality = calculatePDFQuality(pdfBase64, fileName)
    
    // Solo generar resumen si la calidad es >= 98%
    let summary = ''
    
    if (quality >= 98) {
      const { text: generatedSummary } = await generateText({
        model: gateway('openai/gpt-4o-mini'),
        system: `Eres un asistente legal que ayuda a trabajadores mexicanos a entender sus documentos legales.
Tu trabajo es crear resúmenes MUY SIMPLES y CORTOS (máximo 2-3 oraciones) que cualquier persona pueda entender.

REGLAS:
- Usa palabras simples, sin términos legales
- Sé directo: "Te deben dinero", "Te despidieron", "Tienes derecho a..."
- Máximo 50 palabras
- En español mexicano coloquial pero respetuoso`,
        prompt: `El usuario subió un documento llamado "${fileName}".

Basándote en el nombre del archivo, genera un resumen breve de lo que probablemente contiene este documento y qué significa para un trabajador.

Si no puedes inferir el contenido, di: "Documento guardado. Revísalo con tu abogado."`,
        maxTokens: 100
      })
      summary = generatedSummary || ''
    }
    
    return Response.json({ 
      text: `Documento: ${fileName}`,
      summary,
      quality
    })
    
  } catch (error) {
    console.error('Error procesando PDF:', error)
    return Response.json({ 
      text: '',
      summary: '',
      quality: 0
    })
  }
}
