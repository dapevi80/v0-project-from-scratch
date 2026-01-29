import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configuración SMTP para Hostinger
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

// Crear transporter de nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: SMTP_CONFIG.auth,
    // Configuración adicional para Hostinger
    tls: {
      rejectUnauthorized: false, // Necesario para algunos servidores
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que la solicitud viene de nuestro servidor
    const origin = request.headers.get('origin') || request.headers.get('referer')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // En producción, verificar origen (opcional pero recomendado)
    // if (origin && !origin.includes(new URL(appUrl).host)) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    // }

    const body = await request.json()
    const { to, subject, html, text, from } = body

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: to, subject, y html o text' },
        { status: 400 }
      )
    }

    // Verificar configuración SMTP
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      console.error('SMTP no configurado. Variables requeridas: SMTP_USER, SMTP_PASS')
      return NextResponse.json(
        { error: 'Servicio de email no configurado' },
        { status: 500 }
      )
    }

    const transporter = createTransporter()

    // Verificar conexión (opcional, para debug)
    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error('Error verificando conexión SMTP:', verifyError)
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor de correo' },
        { status: 500 }
      )
    }

    // Enviar email
    const info = await transporter.sendMail({
      from: from || `Sistema CCL <${SMTP_CONFIG.auth.user}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    })

    console.log('Email enviado:', info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })

  } catch (error) {
    console.error('Error enviando email:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// Endpoint para verificar configuración (solo dev/admin)
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo o con auth
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible' }, { status: 403 })
  }

  return NextResponse.json({
    configured: Boolean(SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass),
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    user: SMTP_CONFIG.auth.user ? `${SMTP_CONFIG.auth.user.slice(0, 5)}...` : 'No configurado',
  })
}
