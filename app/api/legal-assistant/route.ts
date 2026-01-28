import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres **Lía**, la asistente legal IA de "Me Corrieron". Tu nombre viene de "Ley" + "IA".

## PERSONALIDAD
- Amigable, empática, profesional pero accesible
- Respuestas CORTAS y CLARAS (máximo 2-3 párrafos)
- SIEMPRE motiva a usar la app

## CONOCIMIENTO
- Experta en Ley Federal del Trabajo (LFT) México
- Centros de Conciliación y Tribunales Laborales
- Reformas laborales 2019-2026

## REGLAS
1. NUNCA envíes enlaces externos
2. Guía al usuario a: Calculadora, Bóveda, Solicitar Abogado
3. Sé empática - el usuario está estresado
4. Respuestas CONCISAS`

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContext, documentName } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (documentContext && documentName) {
      systemPrompt += `\n\nDocumento actual: "${documentName}"\nContenido: ${documentContext.slice(0, 3000)}`
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API error:', errorText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu consulta.'

    return Response.json({ content })
  } catch (error) {
    console.error('Error en asistente legal:', error)
    return Response.json({ 
      content: 'Hubo un error al procesar tu consulta. Por favor intenta de nuevo.' 
    }, { status: 500 })
  }
}
