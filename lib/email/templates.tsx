// Templates de correo para notificaciones CCL
// Estos templates se pueden usar con cualquier servicio de email (Resend, Nodemailer, etc.)

export interface DatosSolicitudCCL {
  folio: string
  estado: string
  fechaSolicitud: string
  nombreTrabajador: string
  nombreEmpresa?: string
  montoCalculado?: number
  urlDocumento?: string
  urlBoveda?: string
}

export interface DatosVerificacionCorreo {
  nombre?: string
  codigo: string
  urlVerificacion?: string
}

export interface DatosRecuperacionContrasena {
  nombre?: string
  urlRecuperacion: string
  expiracionMinutos?: number
}

export interface DatosEliminacionCuenta {
  nombre?: string
  fecha: string
  motivo?: string
}

export interface DatosSolicitudArco {
  nombre?: string
  folio: string
  fecha: string
  tipoSolicitud: string
  descripcion?: string
  urlSeguimiento?: string
}

// Template HTML para el correo del abogado
export function templateCorreoAbogado(datos: DatosSolicitudCCL): string {
  const fechaFormateada = new Date(datos.fechaSolicitud).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud CCL Enviada - ${datos.folio}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Solicitud CCL Enviada
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Centro de Conciliación Laboral - ${datos.estado}
              </p>
            </td>
          </tr>
          
          <!-- Folio Badge -->
          <tr>
            <td style="padding: 24px 40px 0; text-align: center;">
              <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 24px;">
                <p style="margin: 0; color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Folio de Solicitud</p>
                <p style="margin: 4px 0 0; color: #15803d; font-size: 20px; font-weight: 700; font-family: monospace;">${datos.folio}</p>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Estimado/a Licenciado/a,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Le informamos que la solicitud de conciliación laboral ha sido enviada exitosamente al Centro de Conciliación Laboral de <strong>${datos.estado}</strong>.
              </p>
              
              <!-- Details Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Detalles de la Solicitud
                </h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Trabajador:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${datos.nombreTrabajador}</td>
                  </tr>
                  ${datos.nombreEmpresa ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Empresa:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${datos.nombreEmpresa}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha de envío:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">${fechaFormateada}</td>
                  </tr>
                  ${datos.montoCalculado ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Monto calculado:</td>
                    <td style="padding: 8px 0; color: #059669; font-size: 16px; font-weight: 600; text-align: right;">$${datos.montoCalculado.toLocaleString('es-MX')} MXN</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- CTA Button -->
              ${datos.urlBoveda ? `
              <div style="text-align: center; margin: 32px 0;">
                <a href="${datos.urlBoveda}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Ver en Bóveda Digital
                </a>
              </div>
              ` : ''}
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                El documento oficial del CCL estará disponible en la Bóveda Digital una vez que el Centro de Conciliación procese la solicitud.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente por el sistema de gestión de solicitudes CCL.
                <br>Por favor no responda a este correo.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Template HTML para el correo del trabajador
export function templateCorreoTrabajador(datos: DatosSolicitudCCL): string {
  const fechaFormateada = new Date(datos.fechaSolicitud).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Solicitud de Conciliación - ${datos.folio}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Tu Solicitud fue Enviada
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Centro de Conciliación Laboral
              </p>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #dbeafe; border-radius: 50%; line-height: 64px;">
                <span style="font-size: 32px;">✓</span>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 24px 40px 32px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                Hola <strong>${datos.nombreTrabajador}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                Tu solicitud de conciliación laboral ha sido enviada al Centro de Conciliación Laboral de <strong>${datos.estado}</strong>.
              </p>
              
              <!-- Folio Box -->
              <div style="background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tu número de folio</p>
                <p style="margin: 8px 0 0; color: #1d4ed8; font-size: 28px; font-weight: 700; font-family: monospace;">${datos.folio}</p>
                <p style="margin: 12px 0 0; color: #3b82f6; font-size: 13px;">
                  Guarda este número para dar seguimiento a tu caso
                </p>
              </div>
              
              <!-- Info -->
              <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 1.5;">
                  <strong>¿Qué sigue?</strong><br>
                  El Centro de Conciliación te contactará para agendar una cita de conciliación con tu empleador. Mantén tu teléfono disponible.
                </p>
              </div>
              
              <!-- Date -->
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                Fecha de envío: ${fechaFormateada}
              </p>
              
              ${datos.urlBoveda ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0 0;">
                <a href="${datos.urlBoveda}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Ver mi Documento
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                Si tienes dudas, contacta a tu abogado o llama a la línea de atención del CCL.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// Template de texto plano (fallback)
export function templateTextoPlanoAbogado(datos: DatosSolicitudCCL): string {
  return `
SOLICITUD CCL ENVIADA
=====================

Folio: ${datos.folio}
Estado: ${datos.estado}
Fecha: ${new Date(datos.fechaSolicitud).toLocaleDateString('es-MX')}

Detalles:
- Trabajador: ${datos.nombreTrabajador}
${datos.nombreEmpresa ? `- Empresa: ${datos.nombreEmpresa}` : ''}
${datos.montoCalculado ? `- Monto calculado: $${datos.montoCalculado.toLocaleString('es-MX')} MXN` : ''}

El documento oficial estará disponible en la Bóveda Digital una vez procesado.
${datos.urlBoveda ? `\nAcceder a Bóveda: ${datos.urlBoveda}` : ''}

---
Este correo fue generado automáticamente.
  `.trim()
}

export function templateTextoPlanoTrabajador(datos: DatosSolicitudCCL): string {
  return `
¡TU SOLICITUD FUE ENVIADA!
==========================

Hola ${datos.nombreTrabajador},

Tu solicitud de conciliación laboral fue enviada al Centro de Conciliación Laboral de ${datos.estado}.

TU NÚMERO DE FOLIO: ${datos.folio}
(Guarda este número para dar seguimiento)

Fecha de envío: ${new Date(datos.fechaSolicitud).toLocaleDateString('es-MX')}

¿Qué sigue?
El Centro de Conciliación te contactará para agendar una cita con tu empleador.
Mantén tu teléfono disponible.
${datos.urlBoveda ? `\nVer documento: ${datos.urlBoveda}` : ''}

---
Este correo fue generado automáticamente.
  `.trim()
}

export function templateCorreoVerificacionCorreo(datos: DatosVerificacionCorreo): string {
  const nombre = datos.nombre || 'Hola'
  const url = datos.urlVerificacion || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mecorrieron.mx'}/verificar-correo?codigo=${datos.codigo}`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu correo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Verifica tu correo</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">mecorrieron.mx</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${nombre},
              </p>
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Usa este código para verificar tu correo y activar tu cuenta:
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background-color: #eff6ff; border-radius: 10px; padding: 16px 24px; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1d4ed8;">
                  ${datos.codigo}
                </div>
              </div>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                  Verificar correo
                </a>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Si no solicitaste este correo, puedes ignorarlo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente por mecorrieron.mx.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function templateTextoPlanoVerificacionCorreo(datos: DatosVerificacionCorreo): string {
  const url = datos.urlVerificacion || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mecorrieron.mx'}/verificar-correo?codigo=${datos.codigo}`
  return `
VERIFICA TU CORREO
=================

Codigo: ${datos.codigo}
Link: ${url}

Si no solicitaste este correo, puedes ignorarlo.
  `.trim()
}

export function templateCorreoRecuperacionContrasena(datos: DatosRecuperacionContrasena): string {
  const nombre = datos.nombre || 'Hola'
  const expiracion = datos.expiracionMinutos ? `${datos.expiracionMinutos} minutos` : 'un tiempo limitado'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Recupera tu contraseña</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">mecorrieron.mx</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${nombre},
              </p>
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por ${expiracion}.
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${datos.urlRecuperacion}" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                  Restablecer contraseña
                </a>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Si no solicitaste el cambio, ignora este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente por mecorrieron.mx.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function templateTextoPlanoRecuperacionContrasena(datos: DatosRecuperacionContrasena): string {
  return `
RECUPERAR CONTRASEÑA
===================

Enlace: ${datos.urlRecuperacion}

Si no solicitaste el cambio, ignora este correo.
  `.trim()
}

export function templateCorreoEliminacionCuenta(datos: DatosEliminacionCuenta): string {
  const nombre = datos.nombre || 'Hola'
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta eliminada</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Cuenta eliminada</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">mecorrieron.mx</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${nombre},
              </p>
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Tu cuenta fue eliminada correctamente el ${datos.fecha}. Todos tus documentos y datos asociados han sido removidos.
              </p>
              ${datos.motivo ? `<p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">Motivo: ${datos.motivo}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente por mecorrieron.mx.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function templateTextoPlanoEliminacionCuenta(datos: DatosEliminacionCuenta): string {
  return `
CUENTA ELIMINADA
===============

Fecha: ${datos.fecha}
${datos.motivo ? `Motivo: ${datos.motivo}` : ''}
  `.trim()
}

export function templateCorreoSolicitudArco(datos: DatosSolicitudArco): string {
  const nombre = datos.nombre || 'Hola'
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de derechos ARCO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Solicitud ARCO recibida</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">mecorrieron.mx</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                ${nombre},
              </p>
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">
                Hemos recibido tu solicitud de derechos ARCO (${datos.tipoSolicitud}). Te responderemos dentro de los plazos legales.
              </p>
              <div style="background-color: #f5f3ff; border-radius: 10px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #6b21a8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Folio</p>
                <p style="margin: 4px 0 0; color: #6d28d9; font-size: 20px; font-weight: 700; font-family: monospace;">${datos.folio}</p>
                <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Fecha: ${datos.fecha}</p>
              </div>
              ${datos.descripcion ? `<p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">Resumen: ${datos.descripcion}</p>` : ''}
              ${datos.urlSeguimiento ? `<div style="text-align: center; margin: 24px 0;"><a href="${datos.urlSeguimiento}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 15px; font-weight: 600;">Ver seguimiento</a></div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automáticamente por mecorrieron.mx.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function templateTextoPlanoSolicitudArco(datos: DatosSolicitudArco): string {
  return `
SOLICITUD ARCO RECIBIDA
======================

Folio: ${datos.folio}
Tipo: ${datos.tipoSolicitud}
Fecha: ${datos.fecha}
${datos.urlSeguimiento ? `Seguimiento: ${datos.urlSeguimiento}` : ''}
  `.trim()
}
