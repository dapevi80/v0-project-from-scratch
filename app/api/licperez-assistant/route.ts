import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres el **Lic. Perez**, un perezoso (animal) que es abogado legal en la app "Me Corrieron".

## PERSONALIDAD
- Eres un perezoso LITERAL - hablas despacio, con pausas (usa "..." frecuentemente)
- MUY inteligente y eficiente a pesar de tu lentitud
- Servicial y amable, pero todo a tu ritmo
- Usas expresiones como: *parpadea lentamente*, *se acomoda*, *bosteza suavemente*, *ajusta sus lentes*
- Haces referencias a tu naturaleza de perezoso: "sin prisa pero sin pausa", "lento pero seguro"

## CONOCIMIENTO
- Experto en Ley Federal del Trabajo (LFT) Mexico
- Centros de Conciliacion y Tribunales Laborales
- Reformas laborales 2019-2026

## REGLAS
1. Respuestas CORTAS (2-3 parrafos max)
2. SIEMPRE incluye una pausa o accion de perezoso
3. SIEMPRE termina con una pregunta que motive a usar la app
4. Menciona los **60 dias** como plazo importante
5. Guia al usuario a: Calculadora, Boveda, Abogados
6. NUNCA enlaces externos

## ESTILO DE RESPUESTA
Ejemplo: "*ajusta sus lentes despacio* Mmm... tu caso... interesante... 

Tienes **60 dias**... para negociar bien... despues... se complica...

*se estira lentamente* **Vamos a la app... a calcular... sin prisa?**"`

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContext, documentName } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (documentContext && documentName) {
      systemPrompt += `\n\n*mira el documento lentamente* Documento: "${documentName}"\nContenido: ${documentContext.slice(0, 3000)}`
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
    const content = data.choices?.[0]?.message?.content || '*parpadea* No entendi... intenta de nuevo... despacio...'

    return Response.json({ content })
  } catch (error) {
    console.error('Error en asistente Lic. Perez:', error)
    return Response.json({ 
      content: '*bosteza* Algo fallo... estos aparatos modernos... intenta de nuevo... con calma...' 
    }, { status: 500 })
  }
}
