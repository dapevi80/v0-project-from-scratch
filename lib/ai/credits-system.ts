// Sistema de Monedas IA (Cartera IA)
// Maneja planes, consumo, recompensas y cupones
import { createClient } from '@/lib/supabase/server'

export interface AiPlan {
  id: string
  nombre: string
  precio: number
  creditosMensuales: number
  caracteristicas: string[]
}

export interface AiWallet {
  id: string
  user_id: string
  plan_id: string
  plan_nombre: string
  creditos_mensuales: number
  creditos_usados: number
  creditos_extra: number
  is_blocked: boolean
  block_reason?: string | null
  renewal_at?: string | null
}

const DEFAULT_PLAN: AiPlan = {
  id: 'free',
  nombre: 'Basico',
  precio: 0,
  creditosMensuales: 0,
  caracteristicas: ['Chat IA limitado', 'Acceso a FAQs', 'Sin consumo mensual incluido']
}

export function calcularCreditosDisponibles(wallet: AiWallet) {
  return wallet.creditos_mensuales - wallet.creditos_usados + wallet.creditos_extra
}

export async function obtenerWalletIA(userId: string): Promise<AiWallet> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ai_credit_wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) return data as AiWallet

  const nuevoWallet = {
    user_id: userId,
    plan_id: DEFAULT_PLAN.id,
    plan_nombre: DEFAULT_PLAN.nombre,
    creditos_mensuales: DEFAULT_PLAN.creditosMensuales,
    creditos_usados: 0,
    creditos_extra: 0,
    is_blocked: false,
    block_reason: null
  }

  const { data: creado } = await supabase
    .from('ai_credit_wallets')
    .insert(nuevoWallet)
    .select()
    .single()

  return (creado as AiWallet) || (nuevoWallet as AiWallet)
}

export async function puedeUsarCreditosIA(userId: string, costo: number) {
  const wallet = await obtenerWalletIA(userId)
  const disponibles = calcularCreditosDisponibles(wallet)

  if (wallet.is_blocked) {
    return {
      permitido: false,
      motivo: wallet.block_reason || 'Bloqueado por plan'
    }
  }

  if (wallet.plan_id === 'free' && wallet.creditos_extra <= 0) {
    return {
      permitido: false,
      motivo: 'Plan basico sin monedas IA'
    }
  }

  if (disponibles < costo) {
    return {
      permitido: false,
      motivo: 'Monedas IA insuficientes'
    }
  }

  return { permitido: true, motivo: null }
}

export async function consumirCreditosIA(userId: string, costo: number, metadata?: Record<string, unknown>) {
  const supabase = await createClient()
  const wallet = await obtenerWalletIA(userId)
  const disponibles = calcularCreditosDisponibles(wallet)

  if (wallet.is_blocked) {
    return { ok: false, error: wallet.block_reason || 'Bloqueado por plan', wallet }
  }

  if (wallet.plan_id === 'free' && wallet.creditos_extra <= 0) {
    return { ok: false, error: 'Plan basico sin monedas IA', wallet }
  }

  if (disponibles < costo) {
    return { ok: false, error: 'Monedas IA insuficientes', wallet }
  }

  let nuevoExtra = wallet.creditos_extra
  let nuevoUsados = wallet.creditos_usados
  let costoPendiente = costo

  if (nuevoExtra > 0) {
    const usado = Math.min(nuevoExtra, costoPendiente)
    nuevoExtra -= usado
    costoPendiente -= usado
  }

  if (costoPendiente > 0) {
    nuevoUsados += costoPendiente
  }

  const { data: actualizado, error } = await supabase
    .from('ai_credit_wallets')
    .update({
      creditos_extra: nuevoExtra,
      creditos_usados: nuevoUsados
    })
    .eq('id', wallet.id)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message, wallet }
  }

  await supabase
    .from('ai_credit_transactions')
    .insert({
      user_id: userId,
      tipo: 'debit',
      monto: costo,
      fuente: metadata?.source || 'chat',
      metadata: metadata || {}
    })

  return { ok: true, error: null, wallet: actualizado as AiWallet }
}

export async function abonarCreditosIA(
  userId: string,
  cantidad: number,
  fuente: 'reward' | 'coupon' | 'admin' | 'purchase',
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient()
  const wallet = await obtenerWalletIA(userId)

  const { data: actualizado, error } = await supabase
    .from('ai_credit_wallets')
    .update({
      creditos_extra: wallet.creditos_extra + cantidad
    })
    .eq('id', wallet.id)
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase
    .from('ai_credit_transactions')
    .insert({
      user_id: userId,
      tipo: 'credit',
      monto: cantidad,
      fuente,
      metadata: metadata || {}
    })

  return { ok: true, error: null, wallet: actualizado as AiWallet }
}

export async function redimirCuponIA(userId: string, codigo: string) {
  const supabase = await createClient()

  const { data: cupon } = await supabase
    .from('ai_coupons')
    .select('*')
    .eq('codigo', codigo)
    .eq('status', 'active')
    .single()

  if (!cupon) {
    return { ok: false, error: 'Cupon no valido' }
  }

  const { data: yaUsado } = await supabase
    .from('ai_coupon_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', cupon.id)
    .maybeSingle()

  if (yaUsado) {
    return { ok: false, error: 'Cupon ya utilizado' }
  }

  await supabase
    .from('ai_coupon_redemptions')
    .insert({
      user_id: userId,
      coupon_id: cupon.id
    })

  if (!cupon.transferible) {
    await supabase
      .from('ai_coupons')
      .update({ status: 'redeemed' })
      .eq('id', cupon.id)
  }

  return abonarCreditosIA(userId, cupon.creditos, 'coupon', {
    coupon_id: cupon.id,
    codigo
  })
}

export async function syncRecompensasIA(userId: string) {
  const supabase = await createClient()

  const { data: rewards } = await supabase
    .from('user_achievements')
    .select('achievement_id, reward_claimed_at, achievements(ai_credits_reward)')
    .eq('user_id', userId)
    .not('reward_claimed_at', 'is', null)

  if (!rewards || rewards.length === 0) return { ok: true, count: 0 }

  let granted = 0

  for (const reward of rewards) {
    const credits = (reward.achievements as Record<string, unknown>)?.ai_credits_reward as number | undefined
    if (!credits || credits <= 0) continue

    const { data: alreadyGranted } = await supabase
      .from('ai_reward_grants')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', reward.achievement_id)
      .maybeSingle()

    if (alreadyGranted) continue

    const result = await abonarCreditosIA(userId, credits, 'reward', {
      achievement_id: reward.achievement_id
    })

    if (result.ok) {
      await supabase
        .from('ai_reward_grants')
        .insert({
          user_id: userId,
          achievement_id: reward.achievement_id,
          creditos: credits
        })
      granted += 1
    }
  }

  return { ok: true, count: granted }
}
