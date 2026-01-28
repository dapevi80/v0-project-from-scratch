// Funciones helper puras - NO son server actions
// Pueden ser importadas tanto en cliente como servidor

// Status labels en español
export const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_review: 'En Revision',
  open: 'Abierto',
  assigned: 'Asignado',
  in_conciliation: 'En Conciliacion',
  in_trial: 'En Juicio',
  resolved: 'Resuelto',
  closed: 'Cerrado'
}

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_conciliation: 'bg-orange-100 text-orange-700',
  in_trial: 'bg-red-100 text-red-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-600'
}

export const prioridadLabels: Record<string, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente'
}

export const prioridadColors: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-600',
  alta: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-600'
}

// Categorias de casos
export const categoriaLabels: Record<string, string> = {
  nuevo: 'Nuevos Casos',
  por_preaprobar: 'Por Preaprobar',
  asignado: 'Asignados',
  conciliacion: 'En Conciliacion',
  juicio: 'En Juicio',
  concluido: 'Concluidos',
  referido: 'Mis Referidos',
  archivado: 'Archivados'
}

export const categoriaColors: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700 border-blue-200',
  por_preaprobar: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  asignado: 'bg-purple-100 text-purple-700 border-purple-200',
  conciliacion: 'bg-orange-100 text-orange-700 border-orange-200',
  juicio: 'bg-red-100 text-red-700 border-red-200',
  concluido: 'bg-green-100 text-green-700 border-green-200',
  referido: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  archivado: 'bg-gray-100 text-gray-500 border-gray-200'
}

// Interfaces
export interface CalculoLiquidacion {
  id: string
  user_id: string
  salario_diario: number
  salario_mensual: number | null
  fecha_ingreso: string
  fecha_salida: string | null
  total_conciliacion: number | null
  neto_conciliacion: number | null
  total_juicio: number | null
  neto_juicio: number | null
  antiguedad_anios: number | null
  antiguedad_meses: number | null
  antiguedad_dias: number | null
  desglose_conciliacion: Record<string, unknown> | null
  desglose_juicio: Record<string, unknown> | null
  empresa_nombre: string | null
  empresa_rfc: string | null
  direccion_trabajo: string | null
  ciudad: string | null
  estado: string | null
  puesto: string | null
  tipo_jornada: string | null
  tipo_contrato: string | null
  motivo_separacion: string | null
  fecha_despido: string | null
  hechos_despido: string | null
  datos_completos: boolean
  listo_para_caso: boolean
  created_at: string
}

export interface Caso {
  id: string
  folio: string
  worker_id: string
  lawyer_id: string | null
  calculo_id: string | null
  status: string
  categoria: string
  empresa_nombre: string
  empresa_rfc: string | null
  ciudad: string | null
  estado: string | null
  monto_estimado: number | null
  monto_final: number | null
  oferta_empresa: number | null
  oferta_empresa_fecha: string | null
  porcentaje_honorarios: number
  fecha_proxima_audiencia: string | null
  fecha_limite_conciliacion: string | null
  notas_abogado: string | null
  prioridad: string
  tipo_caso: 'despido' | 'rescision'
  dias_prescripcion: number
  fecha_limite_prescripcion: string | null
  archivado: boolean
  archivado_at: string | null
  es_referido: boolean
  referido_por: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  calculo?: CalculoLiquidacion | null
  abogado?: { id: string; full_name: string; email: string } | null
  unread_messages?: number
  next_event?: { id: string; title: string; starts_at: string; event_type: string } | null
}

// Formatear moneda
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}

// Formatear fecha
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Calcular dias restantes
export function calcularDiasRestantes(fecha: string | null): number | null {
  if (!fecha) return null
  const hoy = new Date()
  const fechaObj = new Date(fecha)
  const diff = fechaObj.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Calcular dias de prescripcion
export function calcularDiasPrescripcion(fechaLimite: string | null): number | null {
  if (!fechaLimite) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite)
  limite.setHours(0, 0, 0, 0)
  const diff = limite.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Calcular porcentaje de oferta vs estimado
export function calcularPorcentajeOferta(oferta: number | null, estimado: number | null): number | null {
  if (!oferta || !estimado || estimado === 0) return null
  return Math.round((oferta / estimado) * 100)
}
