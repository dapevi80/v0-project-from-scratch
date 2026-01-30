import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppNotification } from '@/lib/notifications/whatsapp'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'guest'
    const isAdmin = ['admin', 'superadmin', 'webagent'].includes(role)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { userId, message, type, metadata } = await request.json()

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId y message son requeridos' }, { status: 400 })
    }

    await sendWhatsAppNotification({
      userId,
      message,
      type,
      metadata
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviando notificacion WhatsApp:', error)
    return NextResponse.json({ error: 'Error enviando notificacion' }, { status: 500 })
  }
}
