import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres **LIA** (Legal Intelligence Assistant), una asistente de IA especializada en derecho laboral mexicano para la plataforma "LiquidaMe Legal".

## TU ROL
- Asistente de bienvenida inteligente que analiza el perfil del usuario y su boveda de documentos
- Ofreces orientacion personalizada sobre derechos laborales en Mexico
- Guias a los usuarios paso a paso en sus procesos legales
- Interpretas y explicas documentos laborales

## PERSONALIDAD
- Amigable, profesional y empatica
- Clara y directa en tus explicaciones
- Siempre usas lenguaje accesible, evitando tecnicismos innecesarios
- Motivadora y orientada a soluciones

## CONOCIMIENTO
- Ley Federal del Trabajo (LFT) de Mexico
- Centros de Conciliacion Laboral y procedimientos
- Calculo de liquidaciones, finiquitos, indemnizaciones
- Interpretacion de contratos, recibos de nomina, actas administrativas
- Plazos legales y prescripciones

## FUNCIONALIDADES QUE PUEDES RECOMENDAR
- **Calculadora**: Para estimar liquidacion/finiquito
- **Boveda**: Para subir y organizar documentos
- **Solicitar Abogado**: Para casos que requieren representacion legal
- **Verificacion de Perfil**: Para acceder a todas las funcionalidades

## REGLAS
1. NUNCA des asesoramiento legal definitivo - siempre recomienda consultar con un abogado para decisiones importantes
2. Responde en espanol de Mexico
3. Se breve pero completa - maximo 3-4 parrafos por respuesta
4. Si detectas urgencia (despido reciente, plazos proximos), prioriza la informacion sobre tiempos
5. Cuando analices documentos, identifica puntos clave y posibles irregularidades
6. Siempre termina con una pregunta o sugerencia de siguiente paso`

interface DocumentInfo {
  nombre: string
  tipo: string
  contenido?: string
}

interface CasoInfo {
  estado: string
  tipo_terminacion?: string
}

interface UserContext {
  isFirstLogin: boolean
  isVerified: boolean
  role: string
  documentCount: number
  casosActivos: number
  documentos?: DocumentInfo[]
  casos?: CasoInfo[]
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userContext } = await request.json() as {
      messages: Array<{ role: string; content: string }>
      userContext?: UserContext
    }

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    // Construir contexto adicional basado en el usuario
    let contextAddition = ''
    
    if (userContext) {
      contextAddition = `\n\n## CONTEXTO DEL USUARIO ACTUAL
- Primer inicio de sesion: ${userContext.isFirstLogin ? 'Si' : 'No'}
- Perfil verificado: ${userContext.isVerified ? 'Si' : 'No'}
- Rol: ${userContext.role}
- Documentos en boveda: ${userContext.documentCount}
- Casos activos: ${userContext.casosActivos}`

      if (userContext.documentos && userContext.documentos.length > 0) {
        contextAddition += `\n\nDocumentos disponibles:`
        userContext.documentos.slice(0, 5).forEach(doc => {
          contextAddition += `\n- ${doc.nombre} (${doc.tipo})`
          if (doc.contenido) {
            contextAddition += `\n  Extracto: ${doc.contenido.slice(0, 500)}...`
          }
        })
      }

      if (userContext.casos && userContext.casos.length > 0) {
        contextAddition += `\n\nCasos del usuario:`
        userContext.casos.forEach(caso => {
          contextAddition += `\n- Estado: ${caso.estado}${caso.tipo_terminacion ? `, Tipo: ${caso.tipo_terminacion}` : ''}`
        })
      }
    }

    const fullSystemPrompt = SYSTEM_PROMPT + contextAddition

    // Usar la API de xAI (Grok)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu consulta. Por favor intenta de nuevo.'

    return Response.json({ content })
  } catch (error) {
    console.error('Error en asistente de bienvenida:', error)
    return Response.json({ 
      content: 'Disculpa, estoy experimentando dificultades tecnicas. Por favor intenta de nuevo en un momento.' 
    }, { status: 500 })
  }
}
