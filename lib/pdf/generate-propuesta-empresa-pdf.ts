import { jsPDF } from 'jspdf'

export interface DatosPropuestaEmpresa {
  // Datos del trabajador y empresa
  nombreTrabajador: string
  nombreEmpresa: string
  fechaIngreso: string
  fechaSalida: string
  puestoTrabajo: string
  salarioDiario: number
  salarioMensual: number
  antiguedadAnios: number
  antiguedadMeses: number
  antiguedadDias: number
  
  // Montos de conciliación (lo que pagaría la empresa)
  indemnizacionConstitucional: number
  indemnizacionAntiguedad: number
  primaAntiguedad: number
  vacacionesPendientes: number
  vacacionesProporcionales: number
  diasVacacionesProporcionales: number
  primaVacacional: number
  aguinaldoProporcional: number
  salariosAdeudados: number
  totalConciliacion: number
  
  // Montos potenciales en juicio
  salariosCaidos: number
  horasExtra: number
  primaDominical: number
  diasFestivos: number
  totalJuicio: number
  
  // Comparativo
  diferencia: number
  porcentajeAhorro: number
  duracionJuicioMeses: number
  
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

const formatMXN = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatFecha = (fecha: string) => {
  if (!fecha) return 'N/A'
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function generatePropuestaEmpresaPDF(datos: DatosPropuestaEmpresa): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Colores profesionales (tonos grises y azul oscuro corporativo)
  const azulOscuro: [number, number, number] = [25, 55, 95]
  const grisOscuro: [number, number, number] = [60, 60, 65]
  const grisMedio: [number, number, number] = [120, 120, 125]
  const grisClaro: [number, number, number] = [240, 240, 242]
  const negro: [number, number, number] = [30, 30, 35]
  const rojoAlerta: [number, number, number] = [180, 50, 50]
  const verdeExito: [number, number, number] = [40, 120, 80]
  
  let y = margin
  
  // ===== HEADER CORPORATIVO =====
  doc.setFillColor(...azulOscuro)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Título principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PROPUESTA DE CONVENIO DE TERMINACIÓN LABORAL', pageWidth / 2, 12, { align: 'center' })
  
  // Nombre de la empresa destacado
  doc.setFontSize(11)
  doc.text(`Empresa: ${datos.nombreEmpresa || '[Nombre de la Empresa]'}`, pageWidth / 2, 22, { align: 'center' })
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Documento informativo - Base para negociación en Centro de Conciliación', pageWidth / 2, 30, { align: 'center' })
  
  doc.setFontSize(7)
  doc.text(`Fecha de elaboración: ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 36, { align: 'center' })
  
  y = 48
  
  // ===== DATOS DEL TRABAJADOR =====
  doc.setFillColor(...grisClaro)
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F')
  
  doc.setTextColor(...azulOscuro)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL TRABAJADOR', margin + 5, y + 7)
  
  doc.setTextColor(...negro)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  const col1 = margin + 5
  const col2 = margin + contentWidth / 2
  
  doc.text(`Nombre: ${datos.nombreTrabajador || '[Nombre del Trabajador]'}`, col1, y + 15)
  doc.text(`Puesto: ${datos.puestoTrabajo || '[Puesto de Trabajo]'}`, col2, y + 15)
  
  doc.text(`Fecha de ingreso: ${formatFecha(datos.fechaIngreso)}`, col1, y + 22)
  doc.text(`Fecha de separación: ${formatFecha(datos.fechaSalida)}`, col2, y + 22)
  
  doc.text(`Antigüedad: ${datos.antiguedadAnios} años, ${datos.antiguedadMeses || 0} meses`, col1, y + 29)
  doc.text(`Salario diario integrado: ${formatMXN(datos.salarioDiario)}`, col2, y + 29)
  
  y += 40
  
  // ===== SECCIÓN: OPCIÓN 1 - CONCILIACIÓN =====
  doc.setFillColor(...verdeExito)
  doc.rect(margin, y, contentWidth, 8, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('OPCIÓN 1: CONVENIO EN CENTRO DE CONCILIACIÓN (RECOMENDADO)', margin + 5, y + 6)
  
  y += 12
  
  // Tabla de conceptos conciliación
  const conceptosConciliacion = [
    { concepto: 'Indemnización constitucional (3 meses de salario)', monto: datos.indemnizacionConstitucional, articulo: 'Art. 48, 50 LFT' },
    { concepto: 'Indemnización por antigüedad (20 días por año)', monto: datos.indemnizacionAntiguedad, articulo: 'Art. 50 Fracc. II LFT' },
    { concepto: 'Prima de antigüedad (12 días por año)', monto: datos.primaAntiguedad, articulo: 'Art. 162 LFT' },
    { concepto: `Vacaciones + prima vacacional (${datos.diasVacacionesProporcionales?.toFixed(1) || 0} días prop.)`, monto: (datos.vacacionesPendientes || 0) + (datos.vacacionesProporcionales || 0) + (datos.primaVacacional || 0), articulo: 'Art. 76, 79, 80 LFT' },
    { concepto: 'Aguinaldo proporcional', monto: datos.aguinaldoProporcional, articulo: 'Art. 87 LFT' },
    { concepto: 'Salarios pendientes de pago', monto: datos.salariosAdeudados, articulo: 'Art. 88 LFT' },
  ]
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...grisOscuro)
  doc.text('CONCEPTO', margin + 3, y + 4)
  doc.text('FUNDAMENTO', margin + 115, y + 4)
  doc.text('MONTO', margin + contentWidth - 5, y + 4, { align: 'right' })
  
  doc.setDrawColor(...grisMedio)
  doc.setLineWidth(0.3)
  doc.line(margin, y + 6, margin + contentWidth, y + 6)
  
  y += 10
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...negro)
  
  for (const item of conceptosConciliacion) {
    if (item.monto > 0) {
      doc.text(item.concepto, margin + 3, y)
      doc.setTextColor(...grisMedio)
      doc.text(item.articulo, margin + 115, y)
      doc.setTextColor(...negro)
      doc.text(formatMXN(item.monto), margin + contentWidth - 5, y, { align: 'right' })
      y += 6
    }
  }
  
  // Total conciliación
  doc.setDrawColor(...verdeExito)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)
  y += 5
  
  doc.setFillColor(240, 255, 245)
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...verdeExito)
  doc.text('TOTAL PROPUESTA DE CONVENIO:', margin + 5, y + 8)
  doc.text(formatMXN(datos.totalConciliacion), margin + contentWidth - 5, y + 8, { align: 'right' })
  
  y += 20
  
  // ===== SECCIÓN: OPCIÓN 2 - JUICIO =====
  doc.setFillColor(...rojoAlerta)
  doc.rect(margin, y, contentWidth, 8, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('OPCIÓN 2: PROCEDIMIENTO ANTE TRIBUNAL LABORAL', margin + 5, y + 6)
  
  y += 12
  
  doc.setTextColor(...grisOscuro)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('En caso de no llegar a un acuerdo, el trabajador podrá ejercer las siguientes acciones ante el Tribunal:', margin + 3, y)
  
  y += 6
  
  const conceptosJuicio = [
    { concepto: 'Todo lo anterior de la conciliación', monto: datos.totalConciliacion, articulo: 'Art. 48-162 LFT' },
    { concepto: `Salarios caídos (estimado ${datos.duracionJuicioMeses} meses de juicio)`, monto: datos.salariosCaidos, articulo: 'Art. 48 LFT' },
    { concepto: 'Horas extraordinarias no pagadas', monto: datos.horasExtra, articulo: 'Art. 66-68 LFT' },
    { concepto: 'Prima dominical adeudada', monto: datos.primaDominical, articulo: 'Art. 71 LFT' },
    { concepto: 'Días festivos trabajados sin pago triple', monto: datos.diasFestivos, articulo: 'Art. 74-75 LFT' },
  ]
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...negro)
  
  for (const item of conceptosJuicio) {
    if (item.monto > 0) {
      doc.text(item.concepto, margin + 3, y)
      doc.setTextColor(...grisMedio)
      doc.setFontSize(7)
      doc.text(item.articulo, margin + 115, y)
      doc.setFontSize(8)
      doc.setTextColor(...negro)
      doc.text(formatMXN(item.monto), margin + contentWidth - 5, y, { align: 'right' })
      y += 6
    }
  }
  
  // Total juicio
  doc.setDrawColor(...rojoAlerta)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)
  y += 5
  
  doc.setFillColor(255, 245, 245)
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...rojoAlerta)
  doc.text('TOTAL POTENCIAL EN JUICIO:', margin + 5, y + 8)
  doc.text(formatMXN(datos.totalJuicio), margin + contentWidth - 5, y + 8, { align: 'right' })
  
  y += 20
  
  // ===== COMPARATIVO VISUAL =====
  doc.setFillColor(...azulOscuro)
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ANÁLISIS COMPARATIVO', pageWidth / 2, y + 6, { align: 'center' })
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  // Columna izquierda - Ahorro
  doc.text('Ahorro potencial al conciliar:', margin + 15, y + 14)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(formatMXN(datos.diferencia), margin + 15, y + 23)
  
  // Columna derecha - Tiempo
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Tiempo estimado de juicio:', margin + contentWidth - 60, y + 14)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${datos.duracionJuicioMeses} meses`, margin + contentWidth - 60, y + 23)
  
  y += 35
  
  // ===== BENEFICIOS DE CONCILIAR =====
  doc.setTextColor(...azulOscuro)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BENEFICIOS DE OPTAR POR LA CONCILIACIÓN:', margin, y)
  
  y += 6
  
  const beneficios = [
    'Resolución inmediata sin costos adicionales de litigio',
    'Evita la incertidumbre de un proceso judicial prolongado',
    'Protege la reputación de la empresa ante posibles demandas públicas',
    'Previene la acumulación de salarios caídos (hasta 12 meses según Art. 48 LFT)',
    'Certeza jurídica mediante convenio ratificado ante autoridad laboral',
    'Deducibilidad fiscal del pago de la liquidación'
  ]
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...negro)
  doc.setFontSize(8)
  
  for (const beneficio of beneficios) {
    doc.setFillColor(...verdeExito)
    doc.circle(margin + 3, y - 1, 1, 'F')
    doc.text(beneficio, margin + 8, y)
    y += 5
  }
  
  y += 5
  
  // ===== NOTA LEGAL =====
  doc.setDrawColor(...grisMedio)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + contentWidth, y)
  
  y += 5
  
  doc.setFillColor(...grisClaro)
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F')
  
  doc.setTextColor(...grisOscuro)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  
  const notaLegal = 'AVISO LEGAL: Este documento tiene carácter informativo y se presenta como base para negociación. Los montos están calculados conforme a la Ley Federal del Trabajo vigente. La propuesta de convenio está sujeta a la aceptación de ambas partes y deberá formalizarse ante el Centro Federal de Conciliación y Registro Laboral o autoridad competente. Los cálculos del escenario de juicio son estimaciones que pueden variar según las circunstancias específicas del caso y las resoluciones del Tribunal Laboral.'
  
  const lines = doc.splitTextToSize(notaLegal, contentWidth - 10)
  doc.text(lines, margin + 5, y + 5)
  
  // ===== FOOTER MINIMALISTA =====
  const footerHeight = 16
  const footerY = pageHeight - footerHeight
  
  doc.setFillColor(...azulOscuro)
  doc.rect(0, footerY, pageWidth, footerHeight, 'F')
  
  doc.setTextColor(255, 255, 255)
  
  // Seccion izquierda: Abogado si existe
  if (datos.abogado?.nombre) {
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Representante legal:', margin, footerY + 5)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(`Lic. ${datos.abogado.nombre}`, margin, footerY + 9)
    if (datos.abogado.cedula) {
      doc.setFontSize(5)
      doc.setFont('helvetica', 'normal')
      doc.text(`Cedula: ${datos.abogado.cedula}`, margin, footerY + 12)
    }
  }
  
  // Seccion central: Web
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('mecorrieron.mx', pageWidth / 2, footerY + 7, { align: 'center' })
  doc.setFontSize(5)
  doc.setFont('helvetica', 'normal')
  doc.text('Plataforma de asesoria laboral', pageWidth / 2, footerY + 11, { align: 'center' })
  
  // Seccion derecha: Folio y fecha
  doc.setFontSize(5)
  if (datos.folioCaso) {
    doc.text(`Folio: ${datos.folioCaso}`, pageWidth - margin, footerY + 6, { align: 'right' })
  }
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - margin, footerY + 10, { align: 'right' })
  
  return doc
}

export function downloadPropuestaEmpresaPDF(datos: DatosPropuestaEmpresa, filename: string = 'propuesta-convenio.pdf') {
  const doc = generatePropuestaEmpresaPDF(datos)
  doc.save(filename)
}

export function getPropuestaEmpresaPDFBlob(datos: DatosPropuestaEmpresa): Blob {
  const doc = generatePropuestaEmpresaPDF(datos)
  return doc.output('blob')
}
