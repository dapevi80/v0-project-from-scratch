// Sistema de Creditos para AutoCCL
// Maneja planes, creditos y facturacion
import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface PlanCCL {
  id: string
  nombre: string
  precio: number
  creditosMensuales: number
  descripcion: string
  caracteristicas: string[]
}

// Definicion de planes
export const PLANES_CCL: Record<string, PlanCCL> = {
  basico: {
    id: 'basico',
    nombre: 'Basico',
    precio: 0,
    creditosMensuales: 0,
    descripcion: 'Plan gratuito con guias de llenado manual',
    caracteristicas: [
      'Guias de llenado ilimitadas',
      'Determinacion de jurisdiccion',
      'Base de datos de CCL',
      'Sin llenado automatico'
    ]
  },
  pro: {
    id: 'pro',
    nombre: 'Pro',
    precio: 499,
    creditosMensuales: 10,
    descripcion: 'Para abogados independientes',
    caracteristicas: [
      '10 solicitudes automaticas/mes',
      'Guias de llenado ilimitadas',
      'PDF oficial del CCL',
      'Agenda automatica de citas',
      'Soporte prioritario'
    ]
  },
  business: {
    id: 'business',
    nombre: 'Business',
    precio: 1499,
    creditosMensuales: 50,
    descripcion: 'Para despachos pequenos',
    caracteristicas: [
      '50 solicitudes automaticas/mes',
      'Guias de llenado ilimitadas',
      'PDF oficial del CCL',
      'Agenda automatica de citas',
      'Reportes mensuales',
      'Soporte prioritario 24/7'
    ]
  },
  enterprise: {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 3999,
    creditosMensuales: 999,
    descripcion: 'Para despachos grandes',
    caracteristicas: [
      'Solicitudes ilimitadas',
      'Guias de llenado ilimitadas',
      'PDF oficial del CCL',
      'Agenda automatica de citas',
      'API de integracion',
      'Multiples usuarios',
      'Reportes avanzados',
      'Soporte dedicado'
    ]
  }
}

// Obtener creditos del abogado o despacho
export async function obtenerCreditos(abogadoId: string, despachoId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('creditos_ccl')
    .select('*')
  
  if (despachoId) {
    query = query.eq('despacho_id', despachoId)
  } else {
    query = query.eq('abogado_id', abogadoId)
  }
  
  const { data } = await query.limit(1)
  
  if (!data || data.length === 0) {
    // Crear registro basico si no existe
    const nuevoCredito = {
      abogado_id: abogadoId,
      despacho_id: despachoId || null,
      plan: 'basico',
      creditos_mensuales: 0,
      creditos_usados: 0,
      creditos_extra: 0,
      fecha_renovacion: null
    }
    
    const { data: creado } = await supabase
      .from('creditos_ccl')
      .insert(nuevoCredito)
      .select()
      .single()
    
    return creado || nuevoCredito
  }
  
  return data[0]
}

// Verificar si tiene creditos disponibles
export async function tieneCreditos(abogadoId: string, despachoId?: string): Promise<boolean> {
  const creditos = await obtenerCreditos(abogadoId, despachoId)
  const disponibles = creditos.creditos_mensuales - creditos.creditos_usados + creditos.creditos_extra
  return disponibles > 0
}

// Descontar un credito
export async function descontarCredito(abogadoId: string, despachoId?: string): Promise<boolean> {
  const supabase = await createClient()
  
  const creditos = await obtenerCreditos(abogadoId, despachoId)
  const disponibles = creditos.creditos_mensuales - creditos.creditos_usados + creditos.creditos_extra
  
  if (disponibles <= 0) {
    return false
  }
  
  // Primero usar creditos extra, luego mensuales
  if (creditos.creditos_extra > 0) {
    await supabase
      .from('creditos_ccl')
      .update({ creditos_extra: creditos.creditos_extra - 1 })
      .eq('id', creditos.id)
  } else {
    await supabase
      .from('creditos_ccl')
      .update({ creditos_usados: creditos.creditos_usados + 1 })
      .eq('id', creditos.id)
  }
  
  return true
}

// Cambiar plan
export async function cambiarPlan(
  abogadoId: string, 
  nuevoPlan: keyof typeof PLANES_CCL,
  stripeSubscriptionId?: string
) {
  const supabase = await createClient()
  
  const plan = PLANES_CCL[nuevoPlan]
  if (!plan) {
    return { error: 'Plan no valido', data: null }
  }
  
  const creditos = await obtenerCreditos(abogadoId)
  
  // Calcular fecha de renovacion (primer dia del proximo mes)
  const hoy = new Date()
  const fechaRenovacion = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  
  const { data, error } = await supabase
    .from('creditos_ccl')
    .update({
      plan: nuevoPlan,
      creditos_mensuales: plan.creditosMensuales,
      creditos_usados: 0, // Reset al cambiar de plan
      fecha_renovacion: fechaRenovacion.toISOString(),
      stripe_subscription_id: stripeSubscriptionId || creditos.stripe_subscription_id
    })
    .eq('id', creditos.id)
    .select()
    .single()
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Agregar creditos extra (compra unica)
export async function agregarCreditosExtra(
  abogadoId: string,
  cantidad: number
) {
  const supabase = await createClient()
  
  const creditos = await obtenerCreditos(abogadoId)
  
  const { data, error } = await supabase
    .from('creditos_ccl')
    .update({
      creditos_extra: creditos.creditos_extra + cantidad
    })
    .eq('id', creditos.id)
    .select()
    .single()
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}

// Renovar creditos mensuales (llamar con cron el dia 1 de cada mes)
export async function renovarCreditosMensuales() {
  const supabase = await createClient()
  
  // Obtener todos los planes activos con fecha de renovacion pasada
  const hoy = new Date().toISOString()
  
  const { data: creditosARenovar } = await supabase
    .from('creditos_ccl')
    .select('*')
    .neq('plan', 'basico')
    .lte('fecha_renovacion', hoy)
  
  if (!creditosARenovar) return
  
  for (const credito of creditosARenovar) {
    const plan = PLANES_CCL[credito.plan as keyof typeof PLANES_CCL]
    if (!plan) continue
    
    // Calcular siguiente fecha de renovacion
    const nuevaRenovacion = new Date()
    nuevaRenovacion.setMonth(nuevaRenovacion.getMonth() + 1)
    nuevaRenovacion.setDate(1)
    
    await supabase
      .from('creditos_ccl')
      .update({
        creditos_usados: 0,
        fecha_renovacion: nuevaRenovacion.toISOString()
      })
      .eq('id', credito.id)
  }
}

// Obtener historial de uso
export async function obtenerHistorialUso(abogadoId: string, limite: number = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('solicitudes_ccl')
    .select(`
      id,
      tipo,
      credito_usado,
      estado_ccl,
      folio_ccl,
      status,
      created_at
    `)
    .eq('abogado_id', abogadoId)
    .order('created_at', { ascending: false })
    .limit(limite)
  
  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}
