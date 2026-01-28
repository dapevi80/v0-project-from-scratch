'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Obtener logros del usuario
export async function getUserAchievements() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', data: null }
  
  // Obtener todos los achievements disponibles
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  
  // Obtener achievements desbloqueados por el usuario
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', user.id)
  
  // Obtener wallet del usuario
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  // Obtener historial de recompensas
  const { data: rewardHistory } = await supabase
    .from('crypto_payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Calcular estadísticas
  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
  const totalEarned = userAchievements?.reduce((sum, ua) => sum + (ua.reward_claimed || 0), 0) || 0
  const pendingRewards = userAchievements?.filter(ua => !ua.reward_claimed_at).reduce((sum, ua) => sum + ((ua.achievements as Record<string, unknown>)?.reward_usdt as number || 0), 0) || 0
  
  return {
    error: null,
    data: {
      achievements: allAchievements?.map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlockedAt: userAchievements?.find(ua => ua.achievement_id === a.id)?.unlocked_at,
        claimed: userAchievements?.find(ua => ua.achievement_id === a.id)?.reward_claimed_at != null
      })) || [],
      wallet,
      stats: {
        totalUnlocked: userAchievements?.length || 0,
        totalAvailable: allAchievements?.length || 0,
        totalEarned,
        pendingRewards,
        walletBalance: wallet?.balance || 0
      },
      rewardHistory: rewardHistory || []
    }
  }
}

// Reclamar recompensa de achievement
export async function claimAchievementReward(achievementId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar que el usuario tiene el achievement desbloqueado
  const { data: userAchievement } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', user.id)
    .eq('achievement_id', achievementId)
    .single()
  
  if (!userAchievement) {
    return { error: 'Achievement no desbloqueado' }
  }
  
  if (userAchievement.reward_claimed_at) {
    return { error: 'Recompensa ya reclamada' }
  }
  
  const rewardAmount = (userAchievement.achievements as Record<string, unknown>)?.reward_usdt as number || 0
  
  if (rewardAmount <= 0) {
    return { error: 'Este achievement no tiene recompensa' }
  }
  
  // Obtener o crear wallet
  let { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (!wallet) {
    const { data: newWallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 0,
        network: 'polygon'
      })
      .select()
      .single()
    
    if (walletError) return { error: 'Error creando wallet' }
    wallet = newWallet
  }
  
  // Actualizar balance de wallet
  const { error: updateWalletError } = await supabase
    .from('wallets')
    .update({ balance: (wallet.balance || 0) + rewardAmount })
    .eq('id', wallet.id)
  
  if (updateWalletError) return { error: 'Error actualizando balance' }
  
  // Marcar achievement como reclamado
  const { error: claimError } = await supabase
    .from('user_achievements')
    .update({
      reward_claimed: rewardAmount,
      reward_claimed_at: new Date().toISOString()
    })
    .eq('id', userAchievement.id)
  
  if (claimError) return { error: 'Error reclamando recompensa' }
  
  revalidatePath('/recompensas')
  return { error: null, amount: rewardAmount }
}

// Verificar y desbloquear achievements basados en acciones
export async function checkAndUnlockAchievements(actionType: string, metadata?: Record<string, unknown>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { newAchievements: [] }
  
  // Obtener achievements que el usuario aún no tiene
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id)
  
  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])
  
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
  
  const newUnlocked: string[] = []
  
  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue
    
    const criteria = achievement.criteria as Record<string, unknown>
    let shouldUnlock = false
    
    // Evaluar criterios según tipo de acción
    switch (actionType) {
      case 'profile_complete':
        if (criteria.action === 'complete_profile') {
          shouldUnlock = true
        }
        break
      
      case 'first_calculation':
        if (criteria.action === 'first_calculation') {
          shouldUnlock = true
        }
        break
      
      case 'document_upload':
        if (criteria.action === 'upload_documents') {
          const { count } = await supabase
            .from('documentos_boveda')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
          
          if (count && count >= (criteria.min_count as number || 1)) {
            shouldUnlock = true
          }
        }
        break
      
      case 'case_created':
        if (criteria.action === 'create_case') {
          shouldUnlock = true
        }
        break
      
      case 'case_won':
        if (criteria.action === 'win_case') {
          const { count } = await supabase
            .from('casos')
            .select('*', { count: 'exact', head: true })
            .eq('worker_id', user.id)
            .eq('status', 'won')
          
          if (count && count >= (criteria.min_count as number || 1)) {
            shouldUnlock = true
          }
        }
        break
      
      case 'referral':
        if (criteria.action === 'refer_user') {
          // Contar referidos (esto requeriría una tabla de referidos)
          shouldUnlock = metadata?.referred_count as number >= (criteria.min_count as number || 1)
        }
        break
    }
    
    if (shouldUnlock) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        })
      
      if (!error) {
        newUnlocked.push(achievement.id)
      }
    }
  }
  
  return { newAchievements: newUnlocked }
}

// Solicitar retiro de USDT
export async function requestWithdrawal(amount: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Verificar wallet y balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (!wallet) return { error: 'No tienes wallet configurada' }
  if (!wallet.address) return { error: 'Debes configurar tu direccion de wallet primero' }
  if ((wallet.balance || 0) < amount) return { error: 'Saldo insuficiente' }
  if (amount < 5) return { error: 'Minimo de retiro: 5 USDT' }
  
  // Crear solicitud de payout
  const { error: payoutError } = await supabase
    .from('crypto_payouts')
    .insert({
      user_id: user.id,
      wallet_id: wallet.id,
      amount,
      network: wallet.network || 'polygon',
      status: 'pending'
    })
  
  if (payoutError) return { error: 'Error creando solicitud de retiro' }
  
  // Reducir balance de wallet
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: (wallet.balance || 0) - amount })
    .eq('id', wallet.id)
  
  if (updateError) return { error: 'Error actualizando balance' }
  
  revalidatePath('/recompensas')
  return { error: null }
}
