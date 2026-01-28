import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Texto requerido' }, { status: 400 })
    }
    
    // Si el texto es muy corto, no necesita resumen
    if (text.length < 100) {
      return Response.json({ summary: '' })
    }
    
    const { text: summary } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      system: `Eres un asistente que resume documentos legales mexicanos para trabajadores.
Tu objetivo es explicar EN MAXIMO 25 PALABRAS qué dice el documento.
Usa lenguaje sencillo, sin términos legales. Ve directo al punto.
El resumen debe responder: "¿Qué significa esto para el trabajador?"

Ejemplos de buenos resúmenes:
- "Tu patrón te debe $15,000 de salarios atrasados"
- "Te despidieron sin justificación legal"
- "Tienes derecho a 3 meses de indemnización"
- "El patrón no pagó tus vacaciones de 2 años"
- "Citatorio para audiencia el 15 de marzo"`,
      prompt: `Resume este documento para un trabajador mexicano en MAX 25 PALABRAS:\n\n${text.slice(0, 2000)}`,
      maxTokens: 100,
    })
    
    return Response.json({ summary: summary.trim() })
    
  } catch (error) {
    console.error('Error generando resumen:', error)
    return Response.json({ summary: '' })
  }
}
