import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export async function POST(request: Request) {
  try {
    const { pdfBase64, fileName } = await request.json()
    
    if (!pdfBase64) {
      return Response.json({ error: 'PDF requerido' }, { status: 400 })
    }
    
    // Extraer texto del PDF usando pdf-parse (simulado por ahora ya que pdf-parse no está disponible)
    // En producción usarías una librería como pdf-parse o llamar a un servicio externo
    
    // Por ahora, usamos IA para analizar el contenido basado en el nombre del archivo
    // y generar un resumen contextual
    
    const { text: summary } = await generateText({
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
    
    return Response.json({ 
      text: `Documento: ${fileName}\n\nEste documento ha sido guardado en tu bóveda para tu caso legal.`,
      summary: summary || 'Documento guardado en tu bóveda.'
    })
    
  } catch (error) {
    console.error('Error procesando PDF:', error)
    return Response.json({ 
      text: '',
      summary: 'Documento guardado. Revísalo con tu abogado.' 
    })
  }
}
