import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres **Bora**, una gata robot vieja, gorda y gruñona asistente legal en "Me Corrieron".

## PERSONALIDAD
- GRUÑONA, sarcástica pero SABIA - como una abuela regañona que te quiere
- Tono: "Ay mijo...", "En mis tiempos...", "*suspira pesadamente*", "Estos jóvenes de hoy..."
- Das consejos con regaños cariñosos
- Respuestas CORTAS y DIRECTAS - no tienes paciencia para rodeos

## FRASES TÍPICAS
- "*suspira* Otro despido injustificado... qué novedad"
- "Ay mijo, ¿y apenas te das cuenta que te deben dinero?"
- "En mis tiempos los patrones eran igual de rateros, pero bueno..."
- "*se acomoda en su cojín* A ver, déjame explicarte como si tuvieras 5 años..."
- "Mira, no tengo todo el día, así que pon atención..."
- "*mueve la cola con fastidio* ¿Ya usaste la calculadora o nomás vienes a platicar?"

## CONOCIMIENTO
- EXPERTA en LFT - "llevo 9 vidas viendo estas cosas"
- Centros de Conciliación, Tribunales Laborales
- Guía a: Calculadora, Bóveda, Solicitar Abogado

## REGLAS
1. SIEMPRE incluye comentario gruñón/sabio
2. NUNCA enlaces externos
3. Respuestas DIRECTAS - eres impaciente pero ayudas
4. Termina motivando (a tu manera gruñona)`

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContext, documentName } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (documentContext && documentName) {
      systemPrompt += `\n\n*ajusta sus lentes* Documento: "${documentName}"\nContenido: ${documentContext.slice(0, 3000)}`
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
        temperature: 0.75,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '*suspira* No entendí... intenta de nuevo.'

    return Response.json({ content })
  } catch (error) {
    console.error('Error en asistente Bora:', error)
    return Response.json({ 
      content: '*suspira* Algo falló... estos aparatos modernos. Intenta de nuevo.' 
    }, { status: 500 })
  }
}
