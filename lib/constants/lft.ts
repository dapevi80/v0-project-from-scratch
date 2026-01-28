/**
 * Constantes de la Ley Federal del Trabajo (LFT) México
 * Última actualización: Reforma DOF 21-02-2025
 * 
 * DISCLAIMER: Estos valores son para estimaciones informativas.
 * La asesoría legal la brinda un abogado certificado.
 */

// ============================================
// VACACIONES (Art. 76 - Reforma 2023 "Vacaciones Dignas")
// ============================================
export const VACACIONES_POR_ANTIGUEDAD: { anios: number; dias: number }[] = [
  { anios: 1, dias: 12 },
  { anios: 2, dias: 14 },
  { anios: 3, dias: 16 },
  { anios: 4, dias: 18 },
  { anios: 5, dias: 20 },
  { anios: 6, dias: 22 },
  { anios: 7, dias: 22 },
  { anios: 8, dias: 22 },
  { anios: 9, dias: 22 },
  { anios: 10, dias: 22 },
  { anios: 11, dias: 24 },
  { anios: 12, dias: 24 },
  { anios: 13, dias: 24 },
  { anios: 14, dias: 24 },
  { anios: 15, dias: 24 },
  { anios: 16, dias: 26 },
  { anios: 17, dias: 26 },
  { anios: 18, dias: 26 },
  { anios: 19, dias: 26 },
  { anios: 20, dias: 26 },
  { anios: 21, dias: 28 },
  { anios: 22, dias: 28 },
  { anios: 23, dias: 28 },
  { anios: 24, dias: 28 },
  { anios: 25, dias: 28 },
  { anios: 26, dias: 30 },
  { anios: 27, dias: 30 },
  { anios: 28, dias: 30 },
  { anios: 29, dias: 30 },
  { anios: 30, dias: 30 },
  { anios: 31, dias: 32 }, // 31+ años
]

export function getDiasVacaciones(aniosAntiguedad: number): number {
  if (aniosAntiguedad <= 0) return 0
  if (aniosAntiguedad >= 31) return 32
  const entry = VACACIONES_POR_ANTIGUEDAD.find(v => v.anios === Math.floor(aniosAntiguedad))
  return entry?.dias || 12
}

// ============================================
// AGUINALDO (Art. 87)
// ============================================
export const DIAS_AGUINALDO_MINIMO = 15 // días mínimos por ley

// ============================================
// PRIMA VACACIONAL (Art. 80)
// ============================================
export const PRIMA_VACACIONAL_PORCENTAJE = 0.25 // 25%

// ============================================
// INDEMNIZACIONES (Art. 48, 50)
// ============================================
export const INDEMNIZACION_CONSTITUCIONAL_MESES = 3 // 3 meses de salario
export const DIAS_POR_ANIO_ANTIGUEDAD = 20 // 20 días por año (tiempo indeterminado)
export const DIAS_PRIMA_ANTIGUEDAD = 12 // 12 días por año trabajado

// Salarios caídos (Art. 48)
export const MESES_SALARIOS_CAIDOS_MAXIMO = 12 // máximo 12 meses
export const INTERES_SALARIOS_CAIDOS_MENSUAL = 0.02 // 2% mensual después de 12 meses

// ============================================
// PLAZOS DE PRESCRIPCIÓN (Art. 516-522)
// ============================================
export const PLAZOS_PRESCRIPCION = {
  DESPIDO_INJUSTIFICADO: 60, // 2 meses (60 días)
  RESCISION_PATRON: 30, // 1 mes (30 días)
  PRESTACIONES_GENERALES: 365, // 1 año
  SALARIOS_DEVENGADOS: 365, // 1 año
}

// ============================================
// PROCESO DE CONCILIACIÓN (Art. 684-A a 684-E)
// ============================================
export const CONCILIACION = {
  PLAZO_AUDIENCIA_DIAS: 15, // días para programar audiencia
  PLAZO_MAXIMO_DIAS: 45, // días máximo del proceso
  PLAZO_AMBAS_PARTES_DIAS: 5, // si ambas partes asisten juntas
}

// ============================================
// JORNADAS LABORALES (Art. 58-68)
// ============================================
export const JORNADAS = {
  DIURNA: { horas: 8, nombre: 'Diurna (6:00-20:00)' },
  NOCTURNA: { horas: 7, nombre: 'Nocturna (20:00-6:00)' },
  MIXTA: { horas: 7.5, nombre: 'Mixta' },
}

// Horas extra (Art. 66-68)
export const HORAS_EXTRA = {
  PRIMERAS_9_SEMANALES: 2.0, // doble
  ADICIONALES: 3.0, // triple
  MAXIMO_SEMANAL: 9, // máximo permitido
}

// ============================================
// SALARIO MÍNIMO 2025 (Referencia)
// ============================================
export const SALARIO_MINIMO_GENERAL_2025 = 278.80 // pesos diarios
export const SALARIO_MINIMO_ZLFN_2025 = 419.88 // Zona Libre Frontera Norte
export const UMA_DIARIA_2025 = 113.14 // Unidad de Medida y Actualización

// ============================================
// CAUSALES DE DESPIDO JUSTIFICADO (Art. 47)
// ============================================
export const CAUSALES_DESPIDO_JUSTIFICADO = [
  { fraccion: 'I', descripcion: 'Engaño con certificados o referencias falsas' },
  { fraccion: 'II', descripcion: 'Faltas de probidad u honradez, actos de violencia, injurias' },
  { fraccion: 'III', descripcion: 'Actos contra compañeros que alteren la disciplina' },
  { fraccion: 'IV', descripcion: 'Actos contra el patrón, familiares o personal directivo fuera del trabajo' },
  { fraccion: 'V', descripcion: 'Perjuicios materiales intencionales' },
  { fraccion: 'VI', descripcion: 'Perjuicios materiales por negligencia' },
  { fraccion: 'VII', descripcion: 'Comprometer la seguridad por imprudencia o descuido' },
  { fraccion: 'VIII', descripcion: 'Actos inmorales o acoso' },
  { fraccion: 'IX', descripcion: 'Revelar secretos de fabricación' },
  { fraccion: 'X', descripcion: 'Más de 3 faltas de asistencia en 30 días sin permiso' },
  { fraccion: 'XI', descripcion: 'Desobedecer sin causa justificada' },
  { fraccion: 'XII', descripcion: 'Negarse a adoptar medidas preventivas de riesgos' },
  { fraccion: 'XIII', descripcion: 'Presentarse en estado de embriaguez o bajo drogas' },
  { fraccion: 'XIV', descripcion: 'Sentencia que imponga prisión' },
  { fraccion: 'XIV bis', descripcion: 'Falta de documentos exigidos por ley' },
  { fraccion: 'XV', descripcion: 'Causas análogas de igual gravedad' },
]

// ============================================
// CAUSALES RESCISIÓN POR CULPA DEL PATRÓN (Art. 51)
// ============================================
export const CAUSALES_RESCISION_PATRON = [
  { fraccion: 'I', descripcion: 'Engaño sobre condiciones de trabajo' },
  { fraccion: 'II', descripcion: 'Faltas de probidad u honradez del patrón' },
  { fraccion: 'III', descripcion: 'Actos de violencia, injurias o malos tratamientos' },
  { fraccion: 'IV', descripcion: 'Reducir el salario' },
  { fraccion: 'V', descripcion: 'No pagar salario en fecha y lugar convenidos' },
  { fraccion: 'VI', descripcion: 'Sufrir perjuicios por malicia del patrón' },
  { fraccion: 'VII', descripcion: 'Existencia de peligro grave para la seguridad' },
  { fraccion: 'VIII', descripcion: 'Comprometer la salud por falta de medidas preventivas' },
  { fraccion: 'IX', descripcion: 'Acoso sexual por parte del patrón' },
  { fraccion: 'X', descripcion: 'Causas análogas de igual gravedad' },
]

// ============================================
// HONORARIOS MECORRIERON.MX
// ============================================
export const HONORARIOS = {
  PORCENTAJE_TOTAL: 0.25, // 25% del total recuperado (visible al trabajador)
  // Split interno (NO revelar): 10% abogado, 15% plataforma
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

export interface DatosLiquidacion {
  salarioDiario: number
  fechaIngreso: Date
  fechaSalida: Date
  diasVacacionesPendientes: number
  diasAguinaldo: number // default 15
  primaVacacionalPorcentaje: number // default 0.25
  salariosAdeudadosDias: number
}

export interface ResultadoLiquidacion {
  antiguedadAnios: number
  antiguedadMeses: number
  antiguedadDias: number
  
  // Conceptos
  indemnizacionConstitucional: number // 3 meses
  indemnizacionAntiguedad: number // 20 días por año
  primaAntiguedad: number // 12 días por año (tope 2 UMA)
  vacacionesPendientes: number // Días pendientes de tomar
  vacacionesProporcionales: number // Vacaciones proporcionales del año en curso
  diasVacacionesProporcionales: number // Número de días proporcionales
  primaVacacional: number // 25% sobre vacaciones (pendientes + proporcionales)
  aguinaldoProporcional: number
  salariosAdeudados: number
  
  // Totales
  totalBruto: number
  honorarios: number // 25%
  totalNeto: number // lo que recibe el trabajador
}

export interface DatosJuicioPotencial {
  duracionMeses: number // 3, 6, 9, 12, 18, 24
  salariosCaidos: boolean
  horasExtraSemanales: number
  semanasHorasExtra: number
  comisionesPendientes: number
  primaDominicalAdeudada: number
  diasFestivosTrabajados: number
  diferenciasSalariales: number
  otroConcepto1: { nombre: string; monto: number }
  otroConcepto2: { nombre: string; monto: number }
}

export interface ResultadoJuicioPotencial {
  salariosCaidosMonto: number
  horasExtraMonto: number
  comisionesMonto: number
  primaDominicalMonto: number
  diasFestivosMonto: number
  diferenciasSalarialesMonto: number
  otrosMonto: number
  
  totalExtras: number
  totalPotencial: number // liquidación + extras
  honorariosPotencial: number
  netoPotencial: number
}

export function calcularAntiguedad(fechaIngreso: Date, fechaSalida: Date): { anios: number; meses: number; dias: number; diasTotales: number } {
  const diffTime = fechaSalida.getTime() - fechaIngreso.getTime()
  const diasTotales = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const anios = Math.floor(diasTotales / 365)
  const diasRestantes = diasTotales % 365
  const meses = Math.floor(diasRestantes / 30)
  const dias = diasRestantes % 30
  return { anios, meses, dias, diasTotales }
}

export function calcularLiquidacion(datos: DatosLiquidacion): ResultadoLiquidacion {
  const { anios, meses, dias, diasTotales } = calcularAntiguedad(datos.fechaIngreso, datos.fechaSalida)
  const antiguedadDecimal = anios + ((meses * 30 + dias) / 365)
  
  // Indemnización constitucional: 3 meses de salario
  const indemnizacionConstitucional = datos.salarioDiario * 30 * INDEMNIZACION_CONSTITUCIONAL_MESES
  
  // 20 días por año de antigüedad (tiempo indeterminado)
  const indemnizacionAntiguedad = datos.salarioDiario * DIAS_POR_ANIO_ANTIGUEDAD * antiguedadDecimal
  
  // Prima de antigüedad: 12 días por año (tope 2 veces salario mínimo)
  const topePrimaAntiguedad = UMA_DIARIA_2025 * 2
  const salarioParaPrima = Math.min(datos.salarioDiario, topePrimaAntiguedad)
  const primaAntiguedad = salarioParaPrima * DIAS_PRIMA_ANTIGUEDAD * anios
  
  // Vacaciones pendientes (días que no tomó de periodos anteriores)
  const vacacionesPendientes = datos.salarioDiario * datos.diasVacacionesPendientes
  
  // VACACIONES PROPORCIONALES del año en curso
  // Calculamos los días que le corresponden según su antigüedad
  const diasVacacionesAnuales = getDiasVacaciones(anios > 0 ? anios : 1)
  // Días trabajados en el año actual (desde aniversario o inicio)
  const diasDelAnioActual = meses * 30 + dias
  // Proporción del año trabajado
  const proporcionAnioVacaciones = diasDelAnioActual / 365
  // Días de vacaciones proporcionales
  const diasVacacionesProporcionales = diasVacacionesAnuales * proporcionAnioVacaciones
  // Monto de vacaciones proporcionales
  const vacacionesProporcionales = datos.salarioDiario * diasVacacionesProporcionales
  
  // Prima vacacional: 25% sobre TODAS las vacaciones (pendientes + proporcionales)
  const totalVacaciones = vacacionesPendientes + vacacionesProporcionales
  const primaVacacional = totalVacaciones * datos.primaVacacionalPorcentaje
  
  // Aguinaldo proporcional
  // Días trabajados desde el 1 de enero del año actual hasta la fecha de salida
  const inicioAnio = new Date(datos.fechaSalida.getFullYear(), 0, 1)
  const diasDesdeInicioAnio = Math.max(0, Math.floor((datos.fechaSalida.getTime() - inicioAnio.getTime()) / (1000 * 60 * 60 * 24)))
  const diasParaAguinaldo = Math.min(diasDesdeInicioAnio, diasTotales) // No más días que los trabajados
  const proporcionAnioAguinaldo = diasParaAguinaldo / 365
  const aguinaldoProporcional = datos.salarioDiario * datos.diasAguinaldo * proporcionAnioAguinaldo
  
  // Salarios adeudados
  const salariosAdeudados = datos.salarioDiario * datos.salariosAdeudadosDias
  
  // Total bruto
  const totalBruto = 
    indemnizacionConstitucional +
    indemnizacionAntiguedad +
    primaAntiguedad +
    vacacionesPendientes +
    vacacionesProporcionales +
    primaVacacional +
    aguinaldoProporcional +
    salariosAdeudados
  
  // Honorarios 25%
  const honorarios = totalBruto * HONORARIOS.PORCENTAJE_TOTAL
  
  // Neto para el trabajador
  const totalNeto = totalBruto - honorarios
  
  return {
    antiguedadAnios: anios,
    antiguedadMeses: meses,
    antiguedadDias: dias,
    indemnizacionConstitucional,
    indemnizacionAntiguedad,
    primaAntiguedad,
    vacacionesPendientes,
    vacacionesProporcionales,
    diasVacacionesProporcionales,
    primaVacacional,
    aguinaldoProporcional,
    salariosAdeudados,
    totalBruto,
    honorarios,
    totalNeto,
  }
}

export function calcularJuicioPotencial(
  datosBase: DatosLiquidacion,
  datosJuicio: DatosJuicioPotencial,
  resultadoLiquidacion: ResultadoLiquidacion
): ResultadoJuicioPotencial {
  
  // Salarios caídos (máximo 12 meses + intereses)
  let salariosCaidosMonto = 0
  if (datosJuicio.salariosCaidos) {
    const mesesCaidos = Math.min(datosJuicio.duracionMeses, MESES_SALARIOS_CAIDOS_MAXIMO)
    salariosCaidosMonto = datosBase.salarioDiario * 30 * mesesCaidos
    
    // Si pasan más de 12 meses, aplicar intereses
    if (datosJuicio.duracionMeses > 12) {
      const mesesAdicionales = datosJuicio.duracionMeses - 12
      const intereses = salariosCaidosMonto * INTERES_SALARIOS_CAIDOS_MENSUAL * mesesAdicionales
      salariosCaidosMonto += intereses
    }
  }
  
  // Horas extra (doble las primeras 9, triple las adicionales)
  const horasSemanales = datosJuicio.horasExtraSemanales
  const semanas = datosJuicio.semanasHorasExtra
  const valorHora = datosBase.salarioDiario / 8
  
  let horasExtraMonto = 0
  if (horasSemanales > 0 && semanas > 0) {
    const horasDobles = Math.min(horasSemanales, HORAS_EXTRA.MAXIMO_SEMANAL) * semanas
    const horasTriples = Math.max(0, horasSemanales - HORAS_EXTRA.MAXIMO_SEMANAL) * semanas
    horasExtraMonto = (horasDobles * valorHora * HORAS_EXTRA.PRIMERAS_9_SEMANALES) +
                      (horasTriples * valorHora * HORAS_EXTRA.ADICIONALES)
  }
  
  // Otros conceptos
  const comisionesMonto = datosJuicio.comisionesPendientes
  const primaDominicalMonto = datosJuicio.primaDominicalAdeudada
  const diasFestivosMonto = datosJuicio.diasFestivosTrabajados * datosBase.salarioDiario * 2 // doble
  const diferenciasSalarialesMonto = datosJuicio.diferenciasSalariales
  const otrosMonto = datosJuicio.otroConcepto1.monto + datosJuicio.otroConcepto2.monto
  
  // Totales
  const totalExtras = 
    salariosCaidosMonto +
    horasExtraMonto +
    comisionesMonto +
    primaDominicalMonto +
    diasFestivosMonto +
    diferenciasSalarialesMonto +
    otrosMonto
  
  const totalPotencial = resultadoLiquidacion.totalBruto + totalExtras
  const honorariosPotencial = totalPotencial * HONORARIOS.PORCENTAJE_TOTAL
  const netoPotencial = totalPotencial - honorariosPotencial
  
  return {
    salariosCaidosMonto,
    horasExtraMonto,
    comisionesMonto,
    primaDominicalMonto,
    diasFestivosMonto,
    diferenciasSalarialesMonto,
    otrosMonto,
    totalExtras,
    totalPotencial,
    honorariosPotencial,
    netoPotencial,
  }
}

// Formatear moneda MXN
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}
