'use server'

import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase no configurado', isAdmin: false }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado', isAdmin: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'Sin permisos de administrador', isAdmin: false }
  }

  return { error: null, isAdmin: true }
}

export async function getAiCreditsDashboard() {
  const { error, isAdmin } = await verifyAdmin()
  if (error || !isAdmin) return { error: error || 'Sin permisos', data: null }

  const supabase = await createClient()

  const { data: wallets, error: walletsError } = await supabase
    .from('ai_credit_wallets')
    .select('creditos_mensuales, creditos_usados, creditos_extra, is_blocked, plan_id')

  if (walletsError) {
    return { error: walletsError.message, data: null }
  }

  const totals = wallets?.reduce((acc, wallet) => {
    acc.totalWallets += 1
    acc.totalMonthly += wallet.creditos_mensuales || 0
    acc.totalUsed += wallet.creditos_usados || 0
    acc.totalExtra += wallet.creditos_extra || 0
    if (wallet.is_blocked) acc.blocked += 1
    acc.byPlan[wallet.plan_id || 'free'] = (acc.byPlan[wallet.plan_id || 'free'] || 0) + 1
    return acc
  }, {
    totalWallets: 0,
    totalMonthly: 0,
    totalUsed: 0,
    totalExtra: 0,
    blocked: 0,
    byPlan: {} as Record<string, number>
  })

  const { data: recentTx } = await supabase
    .from('ai_credit_transactions')
    .select('id, tipo, monto, fuente, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    error: null,
    data: {
      totals,
      recentTx: recentTx || []
    }
  }
}
