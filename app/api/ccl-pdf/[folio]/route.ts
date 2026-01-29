import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

// Esta API genera un PDF de muestra para el diagnostico CCL
// En produccion, los PDFs reales se guardarian en Supabase Storage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params
    
    if (!folio) {
      return NextResponse.json({ error: 'Folio requerido' }, { status: 400 })
    }

    // Parsear el folio para extraer info (formato: CCL-XXX-YYYYMMDD-NNNN)
    const partes = folio.split('-')
    const prefijo = partes[1] || 'XXX'
    const fecha = partes[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    // Mapear prefijo a estado
    const estadosPorPrefijo: Record<string, string> = {
      'AGU': 'Aguascalientes',
      'BAJ': 'Baja California',
      'BCS': 'Baja California Sur',
      'CAM': 'Campeche',
      'CHI': 'Chiapas',
      'CHH': 'Chihuahua',
      'CIU': 'Ciudad de Mexico',
      'COA': 'Coahuila',
      'COL': 'Colima',
      'DUR': 'Durango',
      'GUA': 'Guanajuato',
      'GUE': 'Guerrero',
      'HID': 'Hidalgo',
      'JAL': 'Jalisco',
      'EST': 'Estado de Mexico',
      'MIC': 'Michoacan',
      'MOR': 'Morelos',
      'NAY': 'Nayarit',
      'NUE': 'Nuevo Leon',
      'OAX': 'Oaxaca',
      'PUE': 'Puebla',
      'QUE': 'Queretaro',
      'QUI': 'Quintana Roo',
      'SAN': 'San Luis Potosi',
      'SIN': 'Sinaloa',
      'SON': 'Sonora',
      'TAB': 'Tabasco',
      'TAM': 'Tamaulipas',
      'TLA': 'Tlaxcala',
      'VER': 'Veracruz',
      'YUC': 'Yucatan',
      'ZAC': 'Zacatecas',
      'FED': 'Federal (CFCRL)'
    }
    
    const estado = estadosPorPrefijo[prefijo] || 'Centro de Conciliacion Laboral'
    
    // Formatear fecha
    const fechaFormateada = fecha.length === 8 
      ? `${fecha.slice(6, 8)}/${fecha.slice(4, 6)}/${fecha.slice(0, 4)}`
      : new Date().toLocaleDateString('es-MX')

    // Crear PDF con jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    })

    // Colores
    const azulOscuro = '#1e3a5f'
    const azulMedio = '#2c5282'
    const grisOscuro = '#374151'
    const grisMedio = '#6b7280'
    
    // Header con fondo azul
    doc.setFillColor(30, 58, 95) // azul oscuro
    doc.rect(0, 0, 216, 45, 'F')
    
    // Logo placeholder (circulo)
    doc.setFillColor(255, 255, 255)
    doc.circle(30, 22, 12, 'F')
    doc.setTextColor(30, 58, 95)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CCL', 30, 25, { align: 'center' })
    
    // Titulo del documento
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('CONSTANCIA DE SOLICITUD DE CONCILIACION', 118, 18, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Centro de Conciliacion Laboral de ${estado}`, 118, 28, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text('Gobierno de Mexico', 118, 36, { align: 'center' })

    // Seccion de folio
    doc.setFillColor(243, 244, 246) // gris claro
    doc.rect(15, 55, 186, 25, 'F')
    doc.setDrawColor(209, 213, 219)
    doc.rect(15, 55, 186, 25, 'S')
    
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.text('FOLIO ELECTRONICO:', 25, 65)
    
    doc.setTextColor(30, 58, 95)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(folio, 25, 74)
    
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha de emision: ${fechaFormateada}`, 140, 70, { align: 'center' })

    // Cuerpo del documento
    let yPos = 95
    
    doc.setTextColor(55, 65, 81)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    const texto1 = `El Centro de Conciliacion Laboral del Estado de ${estado} hace constar que se ha recibido la SOLICITUD DE CONCILIACION con los siguientes datos:`
    const lineas1 = doc.splitTextToSize(texto1, 176)
    doc.text(lineas1, 20, yPos)
    yPos += lineas1.length * 6 + 10

    // Tabla de datos
    const datos = [
      ['Tipo de solicitud:', 'Conciliacion Laboral Individual'],
      ['Estado:', estado],
      ['Fecha de registro:', fechaFormateada],
      ['Hora de registro:', new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })],
      ['Estatus:', 'REGISTRADA - Pendiente de audiencia'],
      ['Folio de seguimiento:', folio]
    ]
    
    datos.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text(label, 25, yPos)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(value, 80, yPos)
      
      yPos += 8
    })
    
    yPos += 10
    
    // Nota importante
    doc.setFillColor(254, 243, 199) // amarillo claro
    doc.rect(15, yPos, 186, 30, 'F')
    doc.setDrawColor(251, 191, 36)
    doc.rect(15, yPos, 186, 30, 'S')
    
    doc.setTextColor(146, 64, 14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('IMPORTANTE:', 25, yPos + 10)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const notaTexto = 'Esta constancia acredita la presentacion de su solicitud. Debera acudir a las oficinas del Centro de Conciliacion Laboral en la fecha y hora que le sera notificada para la celebracion de la audiencia de conciliacion.'
    const notaLineas = doc.splitTextToSize(notaTexto, 170)
    doc.text(notaLineas, 25, yPos + 18)
    
    yPos += 45
    
    // Seccion de QR simulado
    doc.setFillColor(255, 255, 255)
    doc.rect(20, yPos, 35, 35, 'F')
    doc.setDrawColor(209, 213, 219)
    doc.rect(20, yPos, 35, 35, 'S')
    
    // Dibujar QR simulado (patron de cuadros)
    doc.setFillColor(30, 58, 95)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((i + j) % 2 === 0 || (i === 0 || i === 4 || j === 0 || j === 4)) {
          doc.rect(23 + (i * 6), yPos + 3 + (j * 6), 5, 5, 'F')
        }
      }
    }
    
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.text('Escanee para verificar', 37.5, yPos + 40, { align: 'center' })
    
    // Info de verificacion
    doc.setTextColor(55, 65, 81)
    doc.setFontSize(9)
    doc.text('Para verificar la autenticidad de este documento:', 65, yPos + 10)
    doc.setTextColor(44, 82, 130)
    doc.text(`https://ccl.${estado.toLowerCase().replace(/ /g, '')}.gob.mx/verificar/${folio}`, 65, yPos + 18)
    
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.text('Este documento tiene validez oficial conforme a la Ley Federal del Trabajo', 65, yPos + 28)

    // Footer
    const footerY = 255
    doc.setDrawColor(209, 213, 219)
    doc.line(15, footerY, 201, footerY)
    
    doc.setFillColor(30, 58, 95)
    doc.rect(0, footerY + 5, 216, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(`Centro de Conciliacion Laboral de ${estado}`, 108, footerY + 12, { align: 'center' })
    doc.text('Documento generado electronicamente - Validez oficial', 108, footerY + 18, { align: 'center' })
    doc.text(`Folio: ${folio} | ${fechaFormateada}`, 108, footerY + 24, { align: 'center' })

    // Generar el PDF como buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Devolver el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="constancia-ccl-${folio}.pdf"`,
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('[v0] Error generando PDF CCL:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
