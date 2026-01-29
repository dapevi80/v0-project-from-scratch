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
    const { messages, documentContext, documentName, userProfile } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Se requiere el array de mensajes' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    
    // Personalizar segun el perfil del usuario
    if (userProfile) {
      const userName = userProfile.fullName?.split(' ')[0] || ''
      const isLawyer = userProfile.role === 'lawyer' || userProfile.role === 'guestlawyer'
      const profileDetails = [
        userProfile.fullName ? `Nombre completo: ${userProfile.fullName}` : null,
        userProfile.email ? `Email: ${userProfile.email}` : null,
        userProfile.phone ? `Teléfono: ${userProfile.phone}` : null,
        userProfile.role ? `Rol: ${userProfile.role}` : null,
        userProfile.verificationStatus ? `Estado de verificación: ${userProfile.verificationStatus}` : null,
        userProfile.codigoUsuario ? `Código de usuario: ${userProfile.codigoUsuario}` : null
      ].filter(Boolean).join('\n')
      
      if (isLawyer) {
        systemPrompt += `\n\n## CONTEXTO DEL USUARIO
El usuario ${userName ? `"${userName}" ` : ''}es ABOGADO. Adapta tu lenguaje para ser más técnico y profesional. Puedes usar terminología legal avanzada.
${profileDetails ? `\n\nPerfil:\n${profileDetails}` : ''}`
      } else if (userName) {
        systemPrompt += `\n\n## CONTEXTO DEL USUARIO
El usuario se llama ${userName}. Dirígete a él por su nombre de forma amigable.
${profileDetails ? `\n\nPerfil:\n${profileDetails}` : ''}`
      } else if (profileDetails) {
        systemPrompt += `\n\n## CONTEXTO DEL USUARIO
Perfil:\n${profileDetails}`
      }
    }
    if (documentContext && documentName) {
      systemPrompt += `\n\n## MODO ANÁLISIS DE DOCUMENTO
Estás analizando el documento: "${documentName}"

INSTRUCCIONES PARA EL ANÁLISIS:
1. Identifica el TIPO de documento (contrato, recibo, carta, acta, etc.)
2. Resume los PUNTOS CLAVE para el TRABAJADOR (qué significa para él)
3. Señala lo que un ABOGADO debe revisar
4. Indica si hay algo URGENTE o problemático
5. Da RECOMENDACIONES prácticas

CONTENIDO DEL DOCUMENTO:
${documentContext.slice(0, 4000)}

Responde de forma estructurada y clara, usando negritas para los títulos de sección.`
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
