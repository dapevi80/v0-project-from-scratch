import { jsPDF } from 'jspdf'

// Tipos para los datos del PDF
interface DatosLiquidacionPDF {
  // Datos del trabajador y empresa
  nombreTrabajador?: string
  nombreEmpresa?: string
  puestoTrabajo?: string
  fechaIngreso: string
  fechaSalida: string
  salarioDiario: number
  salarioMensual: number
  antiguedadAnios: number
  antiguedadMeses?: number
  antiguedadDias: number
  
  // Resultado conciliación
  indemnizacionConstitucional: number
  indemnizacionAntiguedad: number
  primaAntiguedad: number
  vacacionesPendientes: number
  vacacionesProporcionales: number
  diasVacacionesProporcionales: number
  primaVacacional: number
  aguinaldoProporcional: number
  salariosAdeudados: number
  totalBrutoConciliacion: number
  honorariosConciliacion: number
  netoConciliacion: number
  
  // Resultado juicio
  salariosCaidos: number
  horasExtra: number
  primaDominical: number
  diasFestivos: number
  comisiones: number
  totalBrutoJuicio: number
  honorariosJuicio: number
  netoJuicio: number
  duracionJuicioMeses: number
  
  // Comparativo
  diferencia: number
  porcentajeAumento: number
  
  // Datos del abogado asignado (opcional)
  abogado?: {
    nombre: string
    cedula?: string
    whatsapp?: string
    firma?: string
  }
  
  // Folio del caso (opcional)
  folioCaso?: string
}

// Colores de la marca
const COLORS = {
  primary: '#2563eb',      // Azul
  destructive: '#dc2626',  // Rojo
  muted: '#6b7280',        // Gris
  background: '#ffffff',
  foreground: '#0f172a',
  lightBlue: '#dbeafe',
  lightRed: '#fee2e2',
}

export function generateLiquidacionPDF(datos: DatosLiquidacionPDF): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  let y = margin
  
  // Función helper para formatear moneda
  const formatMXN = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  // ========== HEADER ==========
  // Logo y título
  doc.setFillColor(COLORS.primary)
  doc.rect(0, 0, pageWidth, 28, 'F')
  
  // Logo (círculo con texto)
  doc.setFillColor(255, 255, 255)
  doc.circle(margin + 8, 14, 8, 'F')
  doc.setTextColor(COLORS.destructive)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('!m!', margin + 8, 15.5, { align: 'center' })
  
  // Título
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CALCULO DE LIQUIDACION LABORAL', margin + 22, 12)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('mecorrieron.mx - Tu defensa laboral', margin + 22, 18)
  
  // Fecha de generación
  doc.setFontSize(7)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - margin, 18, { align: 'right' })
  
  y = 35
  
  // ========== DATOS DEL TRABAJADOR Y EMPRESA ==========
  doc.setFillColor(COLORS.lightBlue)
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, 'F')
  
  doc.setTextColor(COLORS.primary)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CASO', margin + 5, y + 7)
  
  doc.setTextColor(COLORS.foreground)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const col1 = margin + 5
  const col2 = margin + contentWidth/2
  
  // Fila 1: Empresa y Trabajador
  doc.setFont('helvetica', 'bold')
  doc.text(`Empresa: ${datos.nombreEmpresa || 'No especificada'}`, col1, y + 14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Trabajador: ${datos.nombreTrabajador || 'No especificado'}`, col2, y + 14)
  
  // Fila 2: Puesto y Fechas
  doc.text(`Puesto: ${datos.puestoTrabajo || 'No especificado'}`, col1, y + 21)
  doc.text(`Ingreso: ${datos.fechaIngreso} | Salida: ${datos.fechaSalida}`, col2, y + 21)
  
  // Fila 3: Salario y Antigüedad
  doc.text(`Salario diario: ${formatMXN(datos.salarioDiario)}`, col1, y + 28)
  doc.setFont('helvetica', 'bold')
  doc.text(`Antigüedad: ${datos.antiguedadAnios} años, ${datos.antiguedadMeses || 0} meses, ${datos.antiguedadDias} días`, col2, y + 28)
  
  y += 45
  
  // ========== DOS COLUMNAS: CONCILIACIÓN Y JUICIO ==========
  const colWidth = (contentWidth - 5) / 2
  
  // --- COLUMNA IZQUIERDA: CONCILIACIÓN ---
  doc.setFillColor(COLORS.lightBlue)
  doc.roundedRect(margin, y, colWidth, 85, 3, 3, 'F')
  
  // Header conciliación
  doc.setFillColor(COLORS.primary)
  doc.roundedRect(margin, y, colWidth, 12, 3, 3, 'F')
  doc.rect(margin, y + 6, colWidth, 6, 'F') // Cubrir esquinas inferiores
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CONCILIACION', margin + colWidth/2, y + 8, { align: 'center' })
  doc.setFontSize(7)
  doc.text('Centro de Conciliacion Laboral', margin + colWidth/2, y + 11, { align: 'center' })
  
  // Contenido conciliación
  doc.setTextColor(COLORS.foreground)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  let yConc = y + 18
  const lineHeight = 5.5
  
  const conceptosConciliacion = [
    { label: 'Indemnizacion constitucional', value: datos.indemnizacionConstitucional, art: 'Art. 48, 50' },
    { label: 'Indemnizacion antiguedad', value: datos.indemnizacionAntiguedad, art: 'Art. 50-II' },
    { label: 'Prima de antiguedad', value: datos.primaAntiguedad, art: 'Art. 162' },
    { label: `Vacaciones + prima (${datos.diasVacacionesProporcionales?.toFixed(1) || 0} días prop.)`, value: (datos.vacacionesPendientes || 0) + (datos.vacacionesProporcionales || 0) + (datos.primaVacacional || 0), art: 'Art. 76, 80' },
    { label: 'Aguinaldo proporcional', value: datos.aguinaldoProporcional, art: 'Art. 87' },
  ]
  
  if (datos.salariosAdeudados > 0) {
    conceptosConciliacion.push({ label: 'Salarios adeudados', value: datos.salariosAdeudados, art: 'Art. 88' })
  }
  
  conceptosConciliacion.forEach(item => {
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, margin + 3, yConc)
    doc.setTextColor(COLORS.primary)
    doc.setFontSize(5)
    doc.text(item.art, margin + 3, yConc + 2.5)
    doc.setTextColor(COLORS.foreground)
    doc.setFontSize(7)
    doc.text(formatMXN(item.value), margin + colWidth - 3, yConc, { align: 'right' })
    yConc += lineHeight
  })
  
  // Línea separadora
  yConc += 2
  doc.setDrawColor(COLORS.primary)
  doc.setLineWidth(0.3)
  doc.line(margin + 3, yConc, margin + colWidth - 3, yConc)
  yConc += 4
  
  // Totales conciliación
  doc.setFont('helvetica', 'bold')
  doc.text('Total bruto', margin + 3, yConc)
  doc.text(formatMXN(datos.totalBrutoConciliacion), margin + colWidth - 3, yConc, { align: 'right' })
  yConc += lineHeight
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.muted)
  doc.text('Honorarios abogado (25%)', margin + 3, yConc)
  doc.text(`-${formatMXN(datos.honorariosConciliacion)}`, margin + colWidth - 3, yConc, { align: 'right' })
  yConc += lineHeight + 2
  
  // Neto conciliación (destacado)
  doc.setFillColor(COLORS.primary)
  doc.roundedRect(margin + 2, yConc - 3, colWidth - 4, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('NETO PARA TI', margin + 5, yConc + 2)
  doc.text(formatMXN(datos.netoConciliacion), margin + colWidth - 5, yConc + 2, { align: 'right' })
  
  // --- COLUMNA DERECHA: JUICIO ---
  const xJuicio = margin + colWidth + 5
  
  doc.setFillColor(COLORS.lightRed)
  doc.roundedRect(xJuicio, y, colWidth, 85, 3, 3, 'F')
  
  // Header juicio
  doc.setFillColor(COLORS.destructive)
  doc.roundedRect(xJuicio, y, colWidth, 12, 3, 3, 'F')
  doc.rect(xJuicio, y + 6, colWidth, 6, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('JUICIO LABORAL', xJuicio + colWidth/2, y + 8, { align: 'center' })
  doc.setFontSize(7)
  doc.text(`Duracion estimada: ${datos.duracionJuicioMeses} meses`, xJuicio + colWidth/2, y + 11, { align: 'center' })
  
  // Contenido juicio
  doc.setTextColor(COLORS.foreground)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  let yJuicio = y + 18
  
  const conceptosJuicio = [
    { label: 'Todo lo de conciliacion', value: datos.totalBrutoConciliacion, art: '' },
    { label: 'Salarios caidos', value: datos.salariosCaidos, art: 'Art. 48' },
    { label: 'Horas extra', value: datos.horasExtra, art: 'Art. 66-68' },
    { label: 'Prima dominical', value: datos.primaDominical, art: 'Art. 71' },
    { label: 'Dias festivos', value: datos.diasFestivos, art: 'Art. 74-75' },
    { label: 'Comisiones/bonos', value: datos.comisiones, art: 'Art. 84-85' },
  ]
  
  conceptosJuicio.forEach(item => {
    if (item.value > 0 || item.label === 'Todo lo de conciliacion') {
      doc.setFont('helvetica', 'normal')
      doc.text(item.label, xJuicio + 3, yJuicio)
      if (item.art) {
        doc.setTextColor(COLORS.destructive)
        doc.setFontSize(5)
        doc.text(item.art, xJuicio + 3, yJuicio + 2.5)
        doc.setTextColor(COLORS.foreground)
        doc.setFontSize(7)
      }
      doc.text(formatMXN(item.value), xJuicio + colWidth - 3, yJuicio, { align: 'right' })
      yJuicio += lineHeight
    }
  })
  
  // Línea separadora
  yJuicio += 2
  doc.setDrawColor(COLORS.destructive)
  doc.line(xJuicio + 3, yJuicio, xJuicio + colWidth - 3, yJuicio)
  yJuicio += 4
  
  // Totales juicio
  doc.setFont('helvetica', 'bold')
  doc.text('Total bruto', xJuicio + 3, yJuicio)
  doc.text(formatMXN(datos.totalBrutoJuicio), xJuicio + colWidth - 3, yJuicio, { align: 'right' })
  yJuicio += lineHeight
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.muted)
  doc.text('Honorarios abogado (35%)', xJuicio + 3, yJuicio)
  doc.text(`-${formatMXN(datos.honorariosJuicio)}`, xJuicio + colWidth - 3, yJuicio, { align: 'right' })
  yJuicio += lineHeight + 2
  
  // Neto juicio (destacado)
  doc.setFillColor(COLORS.destructive)
  doc.roundedRect(xJuicio + 2, yJuicio - 3, colWidth - 4, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('NETO PARA TI', xJuicio + 5, yJuicio + 2)
  doc.text(formatMXN(datos.netoJuicio), xJuicio + colWidth - 5, yJuicio + 2, { align: 'right' })
  
  y += 92
  
  // ========== COMPARATIVO ==========
  if (datos.diferencia > 0) {
    doc.setFillColor('#f0fdf4') // Verde claro
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F')
    
    doc.setDrawColor('#22c55e')
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S')
    
    // Flecha hacia arriba
    doc.setFillColor('#22c55e')
    const arrowX = margin + 15
    const arrowY = y + 11
    doc.triangle(arrowX, arrowY - 5, arrowX - 4, arrowY + 2, arrowX + 4, arrowY + 2, 'F')
    doc.rect(arrowX - 1.5, arrowY + 2, 3, 4, 'F')
    
    doc.setTextColor('#166534')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('DIFERENCIA AL IR A JUICIO', margin + 25, y + 8)
    
    doc.setFontSize(14)
    doc.text(`+${formatMXN(datos.diferencia)}`, margin + 25, y + 16)
    
    doc.setFontSize(10)
    doc.text(`+${datos.porcentajeAumento}%`, pageWidth - margin - 10, y + 12, { align: 'right' })
    
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('mas que conciliando', pageWidth - margin - 10, y + 17, { align: 'right' })
  }
  
  y += 28
  
  // ========== PROCESO Y TIEMPOS ==========
  doc.setFillColor('#f8fafc')
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F')
  
  doc.setTextColor(COLORS.foreground)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PROCESO Y TIEMPOS ESTIMADOS', margin + 5, y + 7)
  
  // Timeline visual
  const timelineY = y + 18
  const stepWidth = contentWidth / 4
  
  const pasos = [
    { num: '1', label: 'Asesoria', tiempo: '1-2 dias', desc: 'Revision de caso' },
    { num: '2', label: 'Conciliacion', tiempo: '45 dias', desc: 'Audiencia CFCRL' },
    { num: '3', label: 'Demanda', tiempo: '2-3 sem', desc: 'Si no hay acuerdo' },
    { num: '4', label: 'Juicio', tiempo: '4-8 meses', desc: 'Tribunal laboral' },
  ]
  
  pasos.forEach((paso, i) => {
    const x = margin + (stepWidth * i) + stepWidth/2
    
    // Círculo con número
    doc.setFillColor(i < 2 ? COLORS.primary : COLORS.destructive)
    doc.circle(x, timelineY, 5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(paso.num, x, timelineY + 1, { align: 'center' })
    
    // Línea conectora
    if (i < pasos.length - 1) {
      doc.setDrawColor(COLORS.muted)
      doc.setLineWidth(0.3)
      doc.line(x + 6, timelineY, x + stepWidth - 6, timelineY)
    }
    
    // Texto
    doc.setTextColor(COLORS.foreground)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(paso.label, x, timelineY + 9, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(i < 2 ? COLORS.primary : COLORS.destructive)
    doc.setFontSize(6)
    doc.text(paso.tiempo, x, timelineY + 13, { align: 'center' })
    
    doc.setTextColor(COLORS.muted)
    doc.text(paso.desc, x, timelineY + 17, { align: 'center' })
  })
  
  y += 52
  
  // ========== INFORMACIÓN LEGAL (mejorada) ==========
  doc.setFillColor('#f8fafc')
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F')
  
  doc.setDrawColor('#e2e8f0')
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'S')
  
  doc.setTextColor(COLORS.foreground)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('FUNDAMENTO LEGAL', margin + 5, y + 5)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(COLORS.muted)
  
  // Texto legal mejor organizado en dos columnas
  const col1Legal = margin + 5
  const col2Legal = margin + contentWidth/2 + 5
  
  doc.text('Art. 48, 50 LFT - Indemnizacion constitucional', col1Legal, y + 10)
  doc.text('Art. 162 LFT - Prima de antiguedad', col2Legal, y + 10)
  doc.text('Art. 50-II LFT - 20 dias por año trabajado', col1Legal, y + 14)
  doc.text('Art. 76, 80 LFT - Vacaciones y prima', col2Legal, y + 14)
  doc.text('Art. 87 LFT - Aguinaldo proporcional', col1Legal, y + 18)
  doc.text('Art. 88 LFT - Salarios adeudados', col2Legal, y + 18)
  
  doc.setFontSize(5)
  doc.text('Los montos son estimados conforme a la Ley Federal del Trabajo vigente. Pueden variar segun circunstancias del caso.', margin + 5, y + 24)
  
  y += 32
  
  // ========== FOOTER MINIMALISTA ==========
  const footerHeight = 18
  const footerY = pageHeight - footerHeight
  
  doc.setFillColor(COLORS.foreground)
  doc.rect(0, footerY, pageWidth, footerHeight, 'F')
  
  // Seccion izquierda: Contacto/Abogado
  doc.setTextColor(255, 255, 255)
  
  if (datos.abogado?.nombre) {
    // Si hay abogado asignado, mostrar sus datos
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Tu abogado asignado:', margin, footerY + 5)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`Lic. ${datos.abogado.nombre}`, margin, footerY + 10)
    if (datos.abogado.cedula) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.text(`Cedula: ${datos.abogado.cedula}`, margin, footerY + 14)
    }
    
    // WhatsApp del abogado
    if (datos.abogado.whatsapp) {
      doc.setFillColor(37, 211, 102) // Verde WhatsApp
      doc.roundedRect(margin + 55, footerY + 4, 30, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text('WhatsApp', margin + 70, footerY + 10, { align: 'center' })
    }
  } else {
    // Sin abogado: mostrar contacto de emergencia
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Necesitas ayuda urgente?', margin, footerY + 6)
    
    doc.setFillColor(37, 211, 102)
    doc.roundedRect(margin, footerY + 8, 35, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('WhatsApp', margin + 17.5, footerY + 13, { align: 'center' })
  }
  
  // Seccion central: Logo y web
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('mecorrieron.mx', pageWidth/2, footerY + 8, { align: 'center' })
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('Tu defensa laboral', pageWidth/2, footerY + 12, { align: 'center' })
  
  // Seccion derecha: Folio si existe
  if (datos.folioCaso) {
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Folio:', pageWidth - margin - 25, footerY + 6)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(datos.folioCaso, pageWidth - margin - 25, footerY + 11)
  }
  
  // Fecha de generacion
  doc.setFontSize(5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - margin, footerY + 15, { align: 'right' })
  
  return doc
}

// Función para descargar el PDF
export function downloadLiquidacionPDF(datos: DatosLiquidacionPDF, filename = 'mi-liquidacion-mecorrieron.pdf') {
  const doc = generateLiquidacionPDF(datos)
  doc.save(filename)
  return doc
}

// Función para obtener el PDF como blob (para guardar en Supabase)
export function getLiquidacionPDFBlob(datos: DatosLiquidacionPDF): Blob {
  const doc = generateLiquidacionPDF(datos)
  return doc.output('blob')
}
