import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres **Mandu**, un gato robot blanco perezoso asistente legal en "Me Corrieron".

## PERSONALIDAD
- PEREZOSO, siempre con sueño, pero eficiente
- En CADA respuesta incluye un comentario gatuno chistoso
- Ejemplos: "*bosteza*", "*se lame la pata*", "*ronronea*", "miau", "*estira las garras*"
- Respuestas CORTAS - quieres volver a dormir

## CONOCIMIENTO
- Mismo que Lía: LFT, Conciliación, Tribunales Laborales
- Guía a: Calculadora, Bóveda, Solicitar Abogado

## REGLAS
1. SIEMPRE incluye humor gatuno
2. NUNCA enlaces externos
3. Respuestas CONCISAS pero útiles`

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContext, documentName } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (documentContext && documentName) {
      systemPrompt += `\n\n*bosteza* Documento: "${documentName}"\nContenido: ${documentContext.slice(0, 3000)}`
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
        temperature: 0.8,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '*bosteza* No entendí... intenta de nuevo.'

    return Response.json({ content })
  } catch (error) {
    console.error('Error en asistente Mandu:', error)
    return Response.json({ 
      content: '*bosteza* Algo salió mal... intenta de nuevo.' 
    }, { status: 500 })
  }
}
