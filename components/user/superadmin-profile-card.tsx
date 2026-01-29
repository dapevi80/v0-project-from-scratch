'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Shield,
  Terminal,
  Activity,
  Server,
  Database,
  Eye,
  EyeOff,
  Copy,
  Check,
  Cpu,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface SuperAdminProfileCardProps {
  userId: string
  fullName?: string | null
  codigoUsuario?: string | null
  isProfilePublic?: boolean
  avatarUrl?: string | null
}

// Canvas Matrix Rain Effect
function MatrixRain({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width
    canvas.height = height

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const fontSize = 10
    const columns = Math.floor(width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#00ff00'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)
    return () => clearInterval(interval)
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 opacity-30"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

// Funcion para actualizar el modo publico del perfil
async function updateProfilePublicMode(userId: string, isPublic: boolean) {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_profile_public: isPublic })
    .eq('id', userId)

  if (error) {
    console.error('Error updating profile public mode:', error)
    return false
  }
  return true
}

export function SuperAdminProfileCard({
  userId,
  fullName,
  codigoUsuario,
  isProfilePublic = true,
  avatarUrl
}: SuperAdminProfileCardProps) {
  const [isPublic, setIsPublic] = useState(isProfilePublic)
  const [isPending, setIsPending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    activeUsers: 0,
    pendingTasks: 0
  })

  useEffect(() => {
    setIsPublic(isProfilePublic)
  }, [isProfilePublic])

  // Cargar estadisticas del sistema
  useEffect(() => {
    async function loadStats() {
      const supabase = createClient()
      
      // Contar usuarios activos (login en ultimas 24h)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', oneDayAgo.toISOString())
      
      // Contar solicitudes pendientes
      const { count: pendingCount } = await supabase
        .from('solicitudes_abogados')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
      
      setSystemStats({
        uptime: '99.9%',
        activeUsers: activeCount || 0,
        pendingTasks: pendingCount || 0
      })
    }
    
    loadStats()
  }, [])

  const handlePublicModeChange = async (checked: boolean) => {
    setIsPublic(checked)
    setIsPending(true)
    const success = await updateProfilePublicMode(userId, checked)
    if (!success) {
      setIsPublic(!checked)
    }
    setIsPending(false)
  }

  const handleCopyCode = async () => {
    if (codigoUsuario) {
      await navigator.clipboard.writeText(codigoUsuario)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayName = fullName || 'SUPERADMIN'
  const codigo = codigoUsuario || '--------'

  return (
    <Card className="overflow-hidden border-green-500/30 shadow-lg shadow-green-500/10">
      <CardContent className="p-0">
        {/* Header Matrix Style */}
        <div className="relative bg-black p-5 overflow-hidden min-h-[140px]">
          {/* Matrix Rain Background */}
          <MatrixRain width={400} height={140} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              {/* Avatar con efecto glow */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-green-500 blur-md opacity-50 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-green-400 ring-offset-2 ring-offset-black">
                  <Image
                    src={avatarUrl || '/avatars/superadmin-avatar.jpg'}
                    alt="SuperAdmin"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                  <Zap className="w-3 h-3 text-black" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <h3 className="text-green-400 font-mono font-bold text-lg tracking-wider">
                    {isPublic ? displayName.toUpperCase() : '[ CLASSIFIED ]'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">
                    ROOT ACCESS
                  </Badge>
                  {isPublic && (
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 font-mono text-xs text-green-500/70 hover:text-green-400 transition-colors"
                    >
                      <span>#{codigo}</span>
                      {copied ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* System Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
                <Activity className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-500/70 font-mono">UPTIME</p>
                <p className="text-sm text-green-400 font-bold font-mono">{systemStats.uptime}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
                <Server className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-500/70 font-mono">USERS</p>
                <p className="text-sm text-green-400 font-bold font-mono">{systemStats.activeUsers}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
                <Database className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-500/70 font-mono">QUEUE</p>
                <p className="text-sm text-green-400 font-bold font-mono">{systemStats.pendingTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visibility Toggle - Dark Theme */}
        <div className="bg-zinc-900 p-3 border-t border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-zinc-500" />
              )}
              <span className="text-xs text-zinc-400 font-mono">
                PROFILE.visibility = "{isPublic ? 'PUBLIC' : 'PRIVATE'}"
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handlePublicModeChange}
              disabled={isPending}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-zinc-950 p-3 border-t border-green-500/20">
          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-mono"
            >
              <Link href="/admin" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                ADMIN PANEL
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-mono"
            >
              <Link href="/perfil" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                PROFILE
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
