'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Gift, 
  Lock,
  CheckCircle,
  ChevronLeft,
  Coins,
  Target,
  Zap,
  Users,
  FileCheck,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  category: string
  reward_usdt: number
  criteria: {
    type: string
    value: number
  }
  is_active: boolean
}

interface UserAchievement {
  id: string
  achievement_id: string
  unlocked_at: string
  reward_claimed: boolean
  achievements: Achievement
}

const categoryLabels: Record<string, string> = {
  onboarding: 'Primeros Pasos',
  engagement: 'Compromiso',
  referral: 'Referidos',
  case_progress: 'Progreso del Caso',
  community: 'Comunidad'
}

const categoryIcons: Record<string, typeof Trophy> = {
  onboarding: Star,
  engagement: Zap,
  referral: Users,
  case_progress: FileCheck,
  community: Trophy
}

const iconMap: Record<string, typeof Trophy> = {
  star: Star,
  trophy: Trophy,
  gift: Gift,
  target: Target,
  zap: Zap,
  users: Users,
  file: FileCheck,
  calendar: Calendar,
  trending: TrendingUp,
  coins: Coins
}

export default function LogrosPage() {
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Cargar achievements disponibles
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    // Cargar achievements del usuario
    const { data: userAch } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements(*)
      `)
      .eq('user_id', user.id)

    // Cargar wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    setAchievements(allAchievements || [])
    setUserAchievements(userAch || [])
    setWalletBalance(wallet?.balance || 0)
    
    // Calcular total ganado
    const earned = (userAch || [])
      .filter(ua => ua.reward_claimed)
      .reduce((sum, ua) => sum + (ua.achievements?.reward_usdt || 0), 0)
    setTotalEarned(earned)
    
    setLoading(false)
  }

  async function claimReward(userAchievementId: string, rewardAmount: number) {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Marcar como reclamado
    await supabase
      .from('user_achievements')
      .update({ reward_claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', userAchievementId)

    // Actualizar wallet (incrementar balance)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + rewardAmount })
        .eq('user_id', user.id)
    }

    // Recargar datos
    loadData()
  }

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id))
  const unclaimedRewards = userAchievements.filter(ua => !ua.reward_claimed)

  // Agrupar por categoria
  const byCategory = achievements.reduce((acc, ach) => {
    const cat = ach.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ach)
    return acc
  }, {} as Record<string, Achievement[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20">
              <Link href="/dashboard">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">Mis Logros</h1>
              <p className="text-xs text-amber-100">Gana USDT completando objetivos</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-amber-100">Total ganado</p>
              <p className="font-bold">${totalEarned.toFixed(2)} USDT</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-amber-200">
            <CardContent className="p-3 text-center">
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{userAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Desbloqueados</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-amber-200">
            <CardContent className="p-3 text-center">
              <Target className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-700">{achievements.length - userAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Por desbloquear</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-amber-200">
            <CardContent className="p-3 text-center">
              <Coins className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">${walletBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">En wallet</p>
            </CardContent>
          </Card>
        </div>

        {/* Unclaimed Rewards Alert */}
        {unclaimedRewards.length > 0 && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Tienes {unclaimedRewards.length} recompensa{unclaimedRewards.length > 1 ? 's' : ''} sin reclamar</h3>
                  <p className="text-sm text-green-100">
                    Total: ${unclaimedRewards.reduce((sum, ua) => sum + (ua.achievements?.reward_usdt || 0), 0).toFixed(2)} USDT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progreso General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Logros completados</span>
                <span className="font-medium">{userAchievements.length} / {achievements.length}</span>
              </div>
              <Progress 
                value={achievements.length > 0 ? (userAchievements.length / achievements.length) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievements by Category */}
        {Object.entries(byCategory).map(([category, categoryAchievements]) => {
          const CategoryIcon = categoryIcons[category] || Trophy
          const unlockedInCategory = categoryAchievements.filter(a => unlockedIds.has(a.id)).length
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className="w-5 h-5 text-amber-600" />
                <h2 className="font-semibold">{categoryLabels[category] || category}</h2>
                <Badge variant="secondary" className="text-xs">
                  {unlockedInCategory}/{categoryAchievements.length}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id)
                  const userAch = userAchievements.find(ua => ua.achievement_id === achievement.id)
                  const IconComponent = iconMap[achievement.icon] || Star
                  
                  return (
                    <Card 
                      key={achievement.id}
                      className={`transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                          : 'bg-muted/30 opacity-70'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isUnlocked 
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isUnlocked ? (
                              <IconComponent className="w-6 h-6" />
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className={`font-semibold ${isUnlocked ? 'text-amber-900' : 'text-muted-foreground'}`}>
                                  {achievement.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {achievement.description}
                                </p>
                              </div>
                              <Badge className={`flex-shrink-0 ${
                                isUnlocked 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                ${achievement.reward_usdt} USDT
                              </Badge>
                            </div>
                            
                            {isUnlocked && userAch && (
                              <div className="mt-3 flex items-center gap-2">
                                {userAch.reward_claimed ? (
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Reclamado
                                  </Badge>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => claimReward(userAch.id, achievement.reward_usdt)}
                                  >
                                    <Gift className="w-4 h-4 mr-1" />
                                    Reclamar ${achievement.reward_usdt}
                                  </Button>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(userAch.unlocked_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {achievements.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No hay logros disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Pronto habra nuevos logros que podras desbloquear
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
