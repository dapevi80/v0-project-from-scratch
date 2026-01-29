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
