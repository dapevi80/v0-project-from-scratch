'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MatrixRain } from '@/components/ui/matrix-rain'
import { ArrowLeft, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CommandHistory {
  input: string
  output: string
  timestamp: Date
}

interface Stats {
  totalUsuarios: number
  totalCotizaciones: number
  totalCasos: number
  totalAbogados: number
}

export default function TerminalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [userName, setUserName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/acceso')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      router.replace('/dashboard')
      return
    }

    setUserName(profile.full_name || 'root')
    await loadStats()
    setAuthorized(true)
    setLoading(false)

    // Welcome message
    setHistory([{
      input: '',
      output: `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██╗     ██╗ ██████╗ ██╗   ██╗██╗██████╗  █████╗ ███╗   ███╗║
║   ██║     ██║██╔═══██╗██║   ██║██║██╔══██╗██╔══██╗████╗ ████║║
║   ██║     ██║██║   ██║██║   ██║██║██║  ██║███████║██╔████╔██║║
║   ██║     ██║██║▄▄ ██║██║   ██║██║██║  ██║██╔══██║██║╚██╔╝██║║
║   ███████╗██║╚██████╔╝╚██████╔╝██║██████╔╝██║  ██║██║ ╚═╝ ██║║
║   ╚══════╝╚═╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝║
║                                                              ║
║            SUPERADMIN TERMINAL v1.0 - ROOT ACCESS            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

  Bienvenido al sistema, ${profile.full_name || 'root'}
  Escribe 'help' para ver los comandos disponibles.
`,
      timestamp: new Date()
    }])
  }

  async function loadStats() {
    const supabase = createClient()
    const [
      { count: totalUsuarios },
      { count: totalCotizaciones },
      { count: totalCasos },
      { count: totalAbogados }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cotizaciones').select('*', { count: 'exact', head: true }),
      supabase.from('cases').select('*', { count: 'exact', head: true }),
      supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true })
    ])

    setStats({
      totalUsuarios: totalUsuarios || 0,
      totalCotizaciones: totalCotizaciones || 0,
      totalCasos: totalCasos || 0,
      totalAbogados: totalAbogados || 0
    })
  }

  function processCommand(cmd: string): string {
    const command = cmd.trim().toLowerCase()
    
    switch (command) {
      case 'help':
        return `
Comandos disponibles:
─────────────────────────────────────────────
  help        - Muestra esta ayuda
  stats       - Estadisticas del sistema
  users       - Cantidad de usuarios
  cases       - Casos activos
  leads       - Cotizaciones nuevas
  lawyers     - Abogados registrados
  clear       - Limpia la pantalla
  exit        - Volver al panel admin
  version     - Version del sistema
  date        - Fecha y hora actual
  whoami      - Usuario actual
─────────────────────────────────────────────`
      
      case 'stats':
        return `
Sistema LiquidaMe - Estadisticas
─────────────────────────────────────────────
  Usuarios totales:    ${stats?.totalUsuarios || 0}
  Cotizaciones:        ${stats?.totalCotizaciones || 0}
  Casos activos:       ${stats?.totalCasos || 0}
  Abogados:            ${stats?.totalAbogados || 0}
─────────────────────────────────────────────`
      
      case 'users':
        return `Total usuarios: ${stats?.totalUsuarios || 0}`
      
      case 'cases':
        return `Casos activos: ${stats?.totalCasos || 0}`
      
      case 'leads':
        return `Cotizaciones: ${stats?.totalCotizaciones || 0}`
      
      case 'lawyers':
        return `Abogados registrados: ${stats?.totalAbogados || 0}`
      
      case 'clear':
        setHistory([])
        return ''
      
      case 'exit':
        router.push('/admin')
        return 'Cerrando terminal...'
      
      case 'version':
        return 'LiquidaMe Terminal v1.0.0 (c) 2026'
      
      case 'date':
        return new Date().toLocaleString('es-MX', { 
          dateStyle: 'full', 
          timeStyle: 'long' 
        })
      
      case 'whoami':
        return `superadmin@mecorrieron:~$ ${userName}`
      
      case '':
        return ''
      
      default:
        return `Error: comando '${cmd}' no reconocido. Escribe 'help' para ver los comandos disponibles.`
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() && input !== 'clear') return

    const output = processCommand(input)
    
    if (input.trim().toLowerCase() !== 'clear') {
      setHistory(prev => [...prev, {
        input,
        output,
        timestamp: new Date()
      }])
    }
    
    setInput('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono animate-pulse">Iniciando terminal...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 font-mono">Acceso denegado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MatrixRain />
      
      {/* Header */}
      <header className="border-b border-green-900 bg-black/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-950 border border-green-600 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h1 className="font-mono font-bold text-green-400 text-sm">TERMINAL</h1>
              <p className="font-mono text-green-600 text-xs">ROOT ACCESS</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-green-500 hover:text-green-400 hover:bg-green-950 font-mono text-xs"
          >
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Link>
          </Button>
        </div>
      </header>

      {/* Terminal */}
      <main className="container mx-auto p-4 max-w-4xl">
        <div 
          ref={terminalRef}
          className="bg-black border border-green-900 rounded-lg p-4 h-[calc(100vh-180px)] overflow-y-auto font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {/* History */}
          {history.map((entry, i) => (
            <div key={i} className="mb-2">
              {entry.input && (
                <div className="flex items-center text-green-500">
                  <span className="text-green-400">root@mecorrieron</span>
                  <span className="text-white">:</span>
                  <span className="text-blue-400">~</span>
                  <span className="text-white">$ </span>
                  <span className="text-green-300">{entry.input}</span>
                </div>
              )}
              {entry.output && (
                <pre className="text-green-500/80 whitespace-pre-wrap">{entry.output}</pre>
              )}
            </div>
          ))}
          
          {/* Current input */}
          <form onSubmit={handleSubmit} className="flex items-center text-green-500">
            <span className="text-green-400">root@mecorrieron</span>
            <span className="text-white">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-white">$ </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-green-300 font-mono caret-green-400"
              autoFocus
              spellCheck={false}
            />
          </form>
        </div>
      </main>
    </div>
  )
}
