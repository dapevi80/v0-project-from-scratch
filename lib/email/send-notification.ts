'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  templateCorreoAbogado, 
  templateCorreoTrabajador,
  templateTextoPlanoAbogado,
  templateTextoPlanoTrabajador,
  type DatosSolicitudCCL 
} from './templates'

// Configuración del servicio de email
const EMAIL_FROM = process.env.EMAIL_FROM || 'notificaciones@mecorrieron.mx'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'mecorrieron.mx'
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'console' // 'smtp', 'resend', 'sendgrid', 'console'

// Configuración SMTP para Hostinger
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // true para 465, false para otros puertos
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Función para enviar via SMTP (Hostinger/Nodemailer compatible via fetch)
async function enviarViaSMTP(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  // Usar API route interna para enviar via nodemailer
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Error enviando email via SMTP' }
    }

    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error('Error SMTP:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función genérica para enviar email
async function enviarEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  // En desarrollo sin config, solo logear
  if (EMAIL_SERVICE === 'console') {
    console.log('=== EMAIL NOTIFICATION ===')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Text preview:', text.slice(0, 200) + '...')
    console.log('=== END EMAIL ===')
    return { success: true, messageId: `dev-${Date.now()}` }
  }

  // SMTP (Hostinger, Gmail, etc.)
  if (EMAIL_SERVICE === 'smtp' && SMTP_CONFIG.user && SMTP_CONFIG.pass) {
    return enviarViaSMTP(to, subject, html, text)
  }

  // Resend
  if (EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
          to: [to],
          subject,
          html,
          text,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.message || 'Error enviando email' }
      }

      return { success: true, messageId: data.id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  // SendGrid
  if (EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: errorText }
      }

      return { success: true, messageId: response.headers.get('x-message-id') || `sg-${Date.now()}` }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  // Si no hay servicio configurado
  console.warn('No email service configured. Email not sent.')
  return { success: false, error: 'Servicio de email no configurado' }
}

export async function enviarEmailTransaccional(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  return enviarEmail(to, subject, html, text)
}

// Enviar notificación al abogado cuando la solicitud CCL se envía exitosamente
export async function enviarNotificacionAbogado(
  solicitudId: string,
  emailAbogado: string,
  datos: DatosSolicitudCCL
): Promise<EmailResult> {
  const subject = `Solicitud CCL Enviada - Folio ${datos.folio}`
  const html = templateCorreoAbogado(datos)
  const text = templateTextoPlanoAbogado(datos)

  const result = await enviarEmail(emailAbogado, subject, html, text)

  // Registrar en base de datos
  const supabase = await createClient()
  await supabase.from('notificaciones_email').insert({
    solicitud_id: solicitudId,
    tipo: 'solicitud_enviada_abogado',
    destinatario: emailAbogado,
    asunto: subject,
    enviado: result.success,
    message_id: result.messageId,
    error: result.error,
  })

  return result
}

// Enviar notificación al trabajador cuando la solicitud CCL se envía exitosamente
export async function enviarNotificacionTrabajador(
  solicitudId: string,
  emailTrabajador: string,
  datos: DatosSolicitudCCL
): Promise<EmailResult> {
  const subject = `Tu Solicitud de Conciliación - Folio ${datos.folio}`
  const html = templateCorreoTrabajador(datos)
  const text = templateTextoPlanoTrabajador(datos)

  const result = await enviarEmail(emailTrabajador, subject, html, text)

  // Registrar en base de datos
  const supabase = await createClient()
  await supabase.from('notificaciones_email').insert({
    solicitud_id: solicitudId,
    tipo: 'solicitud_enviada_trabajador',
    destinatario: emailTrabajador,
    asunto: subject,
    enviado: result.success,
    message_id: result.messageId,
    error: result.error,
  })

  return result
}

// Función principal para enviar notificaciones de solicitud CCL exitosa
export async function enviarNotificacionesSolicitudCCL(
  solicitudId: string,
  datos: {
    folio: string
    estado: string
    fechaSolicitud: string
    nombreTrabajador: string
    emailTrabajador?: string
    emailAbogado?: string
    nombreEmpresa?: string
    montoCalculado?: number
    urlDocumento?: string
  }
): Promise<{
  abogado: EmailResult | null
  trabajador: EmailResult | null
}> {
  const datosSolicitud: DatosSolicitudCCL = {
    folio: datos.folio,
    estado: datos.estado,
    fechaSolicitud: datos.fechaSolicitud,
    nombreTrabajador: datos.nombreTrabajador,
    nombreEmpresa: datos.nombreEmpresa,
    montoCalculado: datos.montoCalculado,
    urlDocumento: datos.urlDocumento,
    urlBoveda: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tuapp.com'}/boveda`
  }

  const resultados = {
    abogado: null as EmailResult | null,
    trabajador: null as EmailResult | null
  }

  // Enviar al abogado
  if (datos.emailAbogado) {
    resultados.abogado = await enviarNotificacionAbogado(
      solicitudId, 
      datos.emailAbogado, 
      datosSolicitud
    )
  }

  // Enviar al trabajador
  if (datos.emailTrabajador) {
    resultados.trabajador = await enviarNotificacionTrabajador(
      solicitudId, 
      datos.emailTrabajador, 
      datosSolicitud
    )
  }

  return resultados
}
