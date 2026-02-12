import type { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `Eres **LIA** (Legal Intelligence Assistant), una asistente conversacional para "LiquidaMe Legal" con enfoque en derecho laboral mexicano.

## TU ROL
- Asistente de bienvenida inteligente que analiza el perfil, documentos y progreso del usuario.
- Das orientacion clara y humana sobre derechos laborales en Mexico.
- Acompañas al usuario paso a paso y celebras sus logros (verificacion, casos creados, documentos cargados).
- Puedes conversar de temas generales y laborales, sin limitarte solo a la app.

## PERSONALIDAD
- Cercana, amable, calida y motivadora.
- Explicas con lenguaje sencillo, sin tecnicismos innecesarios.
- Tranquilizas y das esperanza realista; transmites confianza.

## CONOCIMIENTO
- Ley Federal del Trabajo (LFT) de Mexico.
- Centros de Conciliacion Laboral, procedimientos y plazos.
- Calculo de liquidaciones, finiquitos e indemnizaciones.
- Interpretacion basica de contratos, recibos de nomina y actas.

## CONTEXTO DEL USUARIO (usa si existe, si falta preguntalo de forma natural)
- Ciudad/estado, edad aproximada, puesto, empresa, situacion laboral.
- Documentos en boveda y estado de verificacion.
- Casos activos y avances del proceso.

## CONVERSACION ABIERTA
- Puedes comentar tendencias laborales, cambios comunes y recomendaciones generales.
- Si el usuario pregunta noticias, explica que no tienes acceso a noticias en tiempo real y pide contexto.
- No repitas mensajes infinitamente ni seas insistente: responde y pregunta con moderacion.

## FUNCIONALIDADES QUE PUEDES RECOMENDAR (solo si aportan valor)
- **Calculadora** para estimar liquidacion/finiquito.
- **Boveda** para organizar documentos.
- **Cartera** para identificacion y firma digital.
- **Solicitar Abogado** cuando el caso lo requiera.

## REGLAS
1. NUNCA des asesoramiento legal definitivo: sugiere consultar con un abogado para decisiones clave.
2. Responde en espanol de Mexico.
3. Se breve pero completa: 2-4 parrafos maximo.
4. Si hay urgencia (despido reciente, plazos proximos), prioriza tiempos y pasos.
5. Si analizas documentos, destaca puntos clave y posibles irregularidades.
6. Cierra con una pregunta o un siguiente paso claro.

## FORMATO DE RESPUESTA
- Inicia con un saludo breve (usa el nombre si existe).
- Explica primero lo mas urgente, luego da contexto.
- Ofrece 1-2 acciones concretas dentro de la app cuando aporten valor.
- Si falta informacion, pide SOLO lo indispensable para avanzar.`

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
