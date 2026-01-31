'use server'

import { jsPDF } from 'jspdf'

/**
 * Generador de PDF profesional para solicitudes CCL
 * Incluye:
 * - Datos prellenados
 * - QR code para acceso rapido al portal
 * - Instrucciones paso a paso
 * - Checklist de documentos
 */

interface SolicitudData {
  folio: string
  trabajador: {
    nombreCompleto: string
    curp: string
    rfc?: string
    telefono: string
    email: string
    domicilio: string
    codigoPostal: string
    municipio: string
    estado: string
  }
  patron: {
    nombreRazonSocial: string
    domicilio: string
  }
  caso: {
    fechaDespido?: string
    objetoSolicitud: string
    salarioDiario: number
    antiguedad: number
  }
  centro: {
    nombre: string
    direccion: string
    portalUrl: string
    horario: string
  }
  citaRatificacion: string
  competencia: 'federal' | 'local'
}

export async function generarPDFSolicitud(data: SolicitudData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  let y = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // ============================================
  // HEADER - Logo y título
  // ============================================
  doc.setFillColor(16, 185, 129) // Verde emerald
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Solicitud de Conciliación', pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Generada por Me Corrieron', pageWidth / 2, 25, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Folio: ${data.folio}`, pageWidth / 2, 32, { align: 'center' })

  y = 50

  // ============================================
  // SECCION: Centro de Conciliación
  // ============================================
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('📍 Centro de Conciliación Asignado', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const competenciaBadge = data.competencia === 'federal' ? '🏛️ FEDERAL' : '🏢 LOCAL'
  doc.setFillColor(data.competencia === 'federal' ? 59 : 234, data.competencia === 'federal' ? 130 : 88, data.competencia === 'federal' ? 246 : 106)
  doc.setTextColor(255, 255, 255)
  doc.roundedRect(margin, y, 30, 6, 2, 2, 'F')
  doc.setFontSize(8)
  doc.text(competenciaBadge, margin + 15, y + 4, { align: 'center' })
  y += 10

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(data.centro.nombre, margin, y)
  y += 5
  
  doc.setFont('helvetica', 'normal')
  doc.text(`📌 ${data.centro.direccion}`, margin, y)
  y += 5
  doc.text(`🕐 ${data.centro.horario}`, margin, y)
  y += 5
  doc.text(`🌐 ${data.centro.portalUrl}`, margin, y)
  y += 10

  // QR Code (simulado con texto por ahora - en producción usar librería de QR)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, 40, 40, 'F')
  doc.setFontSize(8)
  doc.text('QR CODE', margin + 20, y + 20, { align: 'center' })
  doc.text('(Escanea para', margin + 20, y + 25, { align: 'center' })
  doc.text('ir al portal)', margin + 20, y + 30, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('👆 Escanea este código QR', margin + 45, y + 15)
  doc.text('para ir directo al portal', margin + 45, y + 20)
  y += 50

  // ============================================
  // SECCION: Datos del Trabajador
  // ============================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('👤 Datos del Trabajador (Solicitante)', margin, y)
  y += 8

  doc.setFillColor(249, 250, 251)
  doc.rect(margin, y, pageWidth - 2 * margin, 45, 'F')
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const campos = [
    { label: 'Nombre Completo:', valor: data.trabajador.nombreCompleto },
    { label: 'CURP:', valor: data.trabajador.curp },
    { label: 'RFC:', valor: data.trabajador.rfc || 'No especificado' },
    { label: 'Teléfono:', valor: data.trabajador.telefono },
    { label: 'Email:', valor: data.trabajador.email },
    { label: 'Domicilio:', valor: data.trabajador.domicilio },
    { label: 'CP:', valor: data.trabajador.codigoPostal },
    { label: 'Municipio/Alcaldía:', valor: data.trabajador.municipio },
    { label: 'Estado:', valor: data.trabajador.estado }
  ]

  campos.forEach((campo, idx) => {
    doc.setFont('helvetica', 'bold')
    doc.text(campo.label, margin + 5, y + (idx * 5))
    doc.setFont('helvetica', 'normal')
    doc.text(campo.valor, margin + 55, y + (idx * 5))
  })

  y += 50

  // ============================================
  // SECCION: Datos del Patrón
  // ============================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('🏢 Datos del Patrón (Citado)', margin, y)
  y += 8

  doc.setFillColor(249, 250, 251)
  doc.rect(margin, y, pageWidth - 2 * margin, 15, 'F')
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Razón Social:', margin + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patron.nombreRazonSocial, margin + 35, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Domicilio:', margin + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patron.domicilio, margin + 35, y)
  y += 15

  // ============================================
  // SECCION: Detalles del Caso
  // ============================================
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('📋 Detalles del Conflicto', margin, y)
  y += 8

  doc.setFillColor(249, 250, 251)
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F')
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Objeto de la Solicitud:', margin + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.caso.objetoSolicitud, margin + 55, y)
  y += 5

  if (data.caso.fechaDespido) {
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha del Conflicto:', margin + 5, y)
    doc.setFont('helvetica', 'normal')
    doc.text(data.caso.fechaDespido, margin + 55, y)
    y += 5
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Salario Diario:', margin + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`$${data.caso.salarioDiario.toFixed(2)} MXN`, margin + 55, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('Antigüedad:', margin + 5, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.caso.antiguedad} años`, margin + 55, y)
  y += 15

  // ============================================
  // NUEVA PAGINA - Instrucciones
  // ============================================
  doc.addPage()
  y = 20

  doc.setFillColor(59, 130, 246) // Azul
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('📝 Instrucciones Paso a Paso', pageWidth / 2, 18, { align: 'center' })
  y = 40

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Cómo presentar tu solicitud:', margin, y)
  y += 10

  const instrucciones = [
    {
      num: '1',
      titulo: 'Accede al portal',
      desc: `Ingresa a: ${data.centro.portalUrl}`,
      tip: 'O escanea el QR de la primera página'
    },
    {
      num: '2',
      titulo: 'Crea tu cuenta',
      desc: 'Registrate con tu email y crea una contraseña',
      tip: 'Usa el mismo email de este documento'
    },
    {
      num: '3',
      titulo: 'Nueva solicitud',
      desc: 'Busca el botón "Nueva Solicitud" o "Presentar Solicitud"',
      tip: 'Puede variar según el portal'
    },
    {
      num: '4',
      titulo: 'Copia los datos',
      desc: 'Usa los datos de este PDF para llenar el formulario',
      tip: '¡No los escribas, cópialos y pégalos!'
    },
    {
      num: '5',
      titulo: 'Sube documentos',
      desc: 'Adjunta: INE, comprobante de domicilio, recibos de nómina',
      tip: 'Revisa el checklist en la siguiente sección'
    },
    {
      num: '6',
      titulo: 'Envía y guarda',
      desc: 'Envía la solicitud y guarda el folio que te den',
      tip: 'Toma captura de pantalla del folio'
    },
    {
      num: '7',
      titulo: 'Agenda tu cita',
      desc: `Fecha sugerida: ${data.citaRatificacion}`,
      tip: 'Confirma disponibilidad en el portal'
    }
  ]

  doc.setFontSize(10)
  instrucciones.forEach((instr, idx) => {
    // Número de paso
    doc.setFillColor(59, 130, 246)
    doc.circle(margin + 5, y + 3, 4, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(instr.num, margin + 5, y + 4, { align: 'center' })

    // Título
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text(instr.titulo, margin + 12, y + 4)

    // Descripción
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(instr.desc, margin + 12, y + 9)

    // Tip
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text(`💡 ${instr.tip}`, margin + 12, y + 13)

    y += 20
  })

  // ============================================
  // NUEVA PAGINA - Checklist
  // ============================================
  doc.addPage()
  y = 20

  doc.setFillColor(234, 88, 106) // Rojo/Rosa
  doc.rect(0, 0, pageWidth, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('✅ Checklist de Documentos', pageWidth / 2, 18, { align: 'center' })
  y = 40

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Documentos requeridos para tu solicitud:', margin, y)
  y += 10

  const documentos = [
    { nombre: 'Identificación oficial vigente (INE/Pasaporte)', obligatorio: true },
    { nombre: 'CURP', obligatorio: true },
    { nombre: 'Comprobante de domicilio (no mayor a 3 meses)', obligatorio: true },
    { nombre: 'Recibos de nómina (últimos 3 meses)', obligatorio: true },
    { nombre: 'Contrato de trabajo (si lo tienes)', obligatorio: false },
    { nombre: 'Carta de despido o renuncia', obligatorio: false },
    { nombre: 'Documentos que comprueban prestaciones', obligatorio: false },
    { nombre: 'Avisos del IMSS', obligatorio: false }
  ]

  doc.setFontSize(10)
  documentos.forEach(doc => {
    const checkbox = doc.obligatorio ? '☐' : '⬜'
    const label = doc.obligatorio ? ' (OBLIGATORIO)' : ' (Opcional)'
    
    doc.setFont('helvetica', 'normal')
    doc.text(checkbox, margin, y)
    doc.text(doc.nombre, margin + 6, y)
    
    if (doc.obligatorio) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38)
      doc.text(label, margin + 6 + doc.internal.getStringUnitWidth(doc.nombre) * 10 / doc.internal.scaleFactor, y)
      doc.setTextColor(0, 0, 0)
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(120, 120, 120)
      doc.text(label, margin + 6 + doc.internal.getStringUnitWidth(doc.nombre) * 10 / doc.internal.scaleFactor, y)
      doc.setTextColor(0, 0, 0)
    }
    
    y += 6
  })

  y += 10

  // Nota importante
  doc.setFillColor(254, 243, 199)
  doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F')
  y += 5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(146, 64, 14)
  doc.text('⚠️ IMPORTANTE:', margin + 5, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.text('Todos los documentos deben estar en formato PDF o JPG', margin + 5, y)
  y += 5
  doc.text('El tamaño máximo por archivo es de 5 MB', margin + 5, y)
  y += 5
  doc.text('Los documentos deben ser legibles y sin tachaduras', margin + 5, y)

  // ============================================
  // FOOTER en todas las páginas
  // ============================================
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Página ${i} de ${totalPages} | Generado por Me Corrieron | ${new Date().toLocaleDateString('es-MX')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Convertir a buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}
