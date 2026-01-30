import { NextResponse } from 'next/server'

const WIT_API_VERSION = '20240520'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 })
    }

    const token = process.env.WIT_AI_SERVER_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Wit.ai token no configurado' }, { status: 500 })
    }

    const url = new URL('https://api.wit.ai/message')
    url.searchParams.set('v', WIT_API_VERSION)
    url.searchParams.set('q', text)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Wit.ai error:', errorText)
      return NextResponse.json({ error: 'Error consultando Wit.ai' }, { status: 500 })
    }

    const data = await response.json()
    const topIntent = Array.isArray(data?.intents) ? data.intents[0] : null

    return NextResponse.json({
      intent: topIntent?.name || null,
      confidence: topIntent?.confidence || 0
    })
  } catch (error) {
    console.error('Error en Wit intent:', error)
    return NextResponse.json({ error: 'Error procesando intención' }, { status: 500 })
  }
}
