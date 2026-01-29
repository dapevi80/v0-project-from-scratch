// ===========================================
// UTILIDADES PARA SOLICITUDES CCL
// Funciones puras sin 'use server'
// ===========================================

// Tipos de terminación laboral
export type TipoTerminacion = 'despido' | 'rescision' | 'renuncia_forzada'

// Datos del caso para generar solicitud
export interface DatosCasoSolicitud {
  casoId: string
  trabajadorNombre: string
  trabajadorCurp?: string
  trabajadorDomicilio?: string
  trabajadorTelefono?: string
  trabajadorEmail?: string
  empleadorNombre: string
  empleadorRfc?: string
  empleadorDomicilio?: string
  empleadorEstado: string
  fechaIngreso: string
  fechaTerminacion: string
  tipoTerminacion: TipoTerminacion
  salarioDiario: number
  puestoTrabajo?: string
  descripcionHechos?: string
  prestacionesReclamadas?: string[]
  montoEstimado?: number
}

// Resultado de la solicitud
export interface ResultadoSolicitud {
  success: boolean
  folioSolicitud?: string
  fechaCita?: string
  horaCita?: string
  sedeCcl?: string
  direccionSede?: string
  urlComprobante?: string
  instrucciones?: string[]
  error?: string
  portalUsado?: string
}

// Calcular días de prescripción según tipo de terminación
export function calcularPrescripcion(tipoTerminacion: TipoTerminacion, fechaTerminacion: string): {
  diasRestantes: number
  fechaLimite: string
  urgente: boolean
} {
  const fechaTerm = new Date(fechaTerminacion)
  const hoy = new Date()
  
  // Días de prescripción según tipo
  const diasPrescripcion = {
    despido: 60,      // Despido injustificado: 60 días
    rescision: 60,    // Rescisión por causa imputable al patrón: 60 días  
    renuncia_forzada: 60 // Renuncia forzada: 60 días
  }
  
  const diasTotales = diasPrescripcion[tipoTerminacion]
  const fechaLimite = new Date(fechaTerm)
  fechaLimite.setDate(fechaLimite.getDate() + diasTotales)
  
  const diasTranscurridos = Math.floor((hoy.getTime() - fechaTerm.getTime()) / (1000 * 60 * 60 * 24))
  const diasRestantes = diasTotales - diasTranscurridos
  
  return {
    diasRestantes: Math.max(0, diasRestantes),
    fechaLimite: fechaLimite.toISOString().split('T')[0],
    urgente: diasRestantes <= 15 && diasRestantes > 0
  }
}

// Lista de estados de México para selector
export const ESTADOS_MEXICO = [
  { codigo: 'AGS', nombre: 'Aguascalientes' },
  { codigo: 'BC', nombre: 'Baja California' },
  { codigo: 'BCS', nombre: 'Baja California Sur' },
  { codigo: 'CAMP', nombre: 'Campeche' },
  { codigo: 'CHIS', nombre: 'Chiapas' },
  { codigo: 'CHIH', nombre: 'Chihuahua' },
  { codigo: 'CDMX', nombre: 'Ciudad de México' },
  { codigo: 'COAH', nombre: 'Coahuila' },
  { codigo: 'COL', nombre: 'Colima' },
  { codigo: 'DGO', nombre: 'Durango' },
  { codigo: 'GTO', nombre: 'Guanajuato' },
  { codigo: 'GRO', nombre: 'Guerrero' },
  { codigo: 'HGO', nombre: 'Hidalgo' },
  { codigo: 'JAL', nombre: 'Jalisco' },
  { codigo: 'MEX', nombre: 'Estado de México' },
  { codigo: 'MICH', nombre: 'Michoacán' },
  { codigo: 'MOR', nombre: 'Morelos' },
  { codigo: 'NAY', nombre: 'Nayarit' },
  { codigo: 'NL', nombre: 'Nuevo León' },
  { codigo: 'OAX', nombre: 'Oaxaca' },
  { codigo: 'PUE', nombre: 'Puebla' },
  { codigo: 'QRO', nombre: 'Querétaro' },
  { codigo: 'QROO', nombre: 'Quintana Roo' },
  { codigo: 'SLP', nombre: 'San Luis Potosí' },
  { codigo: 'SIN', nombre: 'Sinaloa' },
  { codigo: 'SON', nombre: 'Sonora' },
  { codigo: 'TAB', nombre: 'Tabasco' },
  { codigo: 'TAMPS', nombre: 'Tamaulipas' },
  { codigo: 'TLAX', nombre: 'Tlaxcala' },
  { codigo: 'VER', nombre: 'Veracruz' },
  { codigo: 'YUC', nombre: 'Yucatán' },
  { codigo: 'ZAC', nombre: 'Zacatecas' },
  { codigo: 'FEDERAL', nombre: 'Jurisdicción Federal' }
]
