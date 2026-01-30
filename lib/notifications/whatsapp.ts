import { createClient } from '@/lib/supabase/server'

const WHATSAPP_API_VERSION = 'v19.0'

type WhatsAppNotification = {
  userId: string
  message: string
  type?: string
  metadata?: Record<string, unknown>
}

const normalizePhone = (input: string) => input.replace(/\D/g, '')

const getAdminProfile = async (userId: string) => {
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('id', userId)
    .single()

  if (error || !profile) return null
  return profile
}

const sendWhatsAppText = async (phoneNumberId: string, token: string, to: string, body: string) => {
  const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WhatsApp API error: ${errorText}`)
  }
}

export async function sendWhatsAppNotification({ userId, message, type, metadata }: WhatsAppNotification) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    throw new Error('Missing WhatsApp configuration')
  }

  const profile = await getAdminProfile(userId)
  if (!profile?.phone) {
    throw new Error('User phone not available')
  }

  const to = normalizePhone(profile.phone)
  if (!to) {
    throw new Error('Invalid phone number')
  }

  await sendWhatsAppText(phoneNumberId, token, to, message)

  const supabase = await createClient()
  await supabase.from('notificaciones_whatsapp').insert({
    user_id: userId,
    type: type || 'general',
    message,
    metadata: metadata || {},
    status: 'sent'
  }).then(({ error }) => {
    if (error) {
      console.error('Error registrando notificacion WhatsApp:', error.message)
    }
  })
}
