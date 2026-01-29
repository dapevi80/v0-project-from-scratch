'use client'

import React from "react"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  FileText,
  Lightbulb,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  full_name?: string | null
  role: string
  is_verified?: boolean
  verification_status?: string
  first_login_at?: string | null
  login_count?: number
  codigo_usuario?: string
}

interface BovedaDocument {
  id: string
  nombre: string
  tipo: string
  created_at: string
}

interface CasoInfo {
  id: string
  estado: string
  tipo_terminacion?: string
  created_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface WelcomeAIAssistantProps {
  userId: string
  userProfile: UserProfile
  isFirstLogin?: boolean
}

// Genera el mensaje de bienvenida personalizado
function generateWelcomeMessage(profile: UserProfile, documents: BovedaDocument[], casos: CasoInfo[], isFirstLogin: boolean): string {
  const nombre = profile.full_name || 'Usuario'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos dias' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  
  if (isFirstLogin) {
    return `${saludo}, ${nombre}! Bienvenido/a a LiquidaMe Legal. Soy tu asistente de inteligencia artificial especializado en derecho laboral mexicano. 

Estoy aqui para ayudarte a:
- Entender tus derechos laborales
- Calcular tu liquidacion o finiquito
- Guiarte paso a paso en tu proceso
- Analizar documentos de tu boveda

Por donde te gustaria empezar? Tienes alguna duda sobre tu situacion laboral actual?`
  }
  
  // Usuario recurrente
  let mensaje = `${saludo}, ${nombre}! Me da gusto verte de nuevo. `
  
  // Analizar estado del usuario
  if (casos.length > 0) {
    const casosActivos = casos.filter(c => c.estado !== 'cerrado')
    if (casosActivos.length > 0) {
      mensaje += `Veo que tienes ${casosActivos.length} caso(s) activo(s). `
    }
  }
  
  if (documents.length > 0) {
    mensaje += `Tienes ${documents.length} documento(s) en tu boveda que puedo ayudarte a revisar. `
  }
  
  // Sugerencias basadas en el perfil
  if (!profile.is_verified && profile.verification_status !== 'verified') {
    mensaje += `\n\nTe recomiendo completar tu verificacion de perfil para acceder a todas las funcionalidades.`
  }
  
  mensaje += `\n\nEn que puedo ayudarte hoy?`
  
  return mensaje
}

// Genera sugerencias contextuales
function generateSuggestions(profile: UserProfile, documents: BovedaDocument[], casos: CasoInfo[]): string[] {
  const suggestions: string[] = []
  
  // Sugerencias basicas
  if (!profile.is_verified) {
    suggestions.push('Como puedo verificar mi cuenta?')
  }
  
  if (casos.length === 0) {
    suggestions.push('Calcular mi liquidacion')
    suggestions.push('Que derechos tengo si me despidieron?')
  } else {
    suggestions.push('Ver estado de mi caso')
    suggestions.push('Que sigue en mi proceso?')
  }
  
  if (documents.length > 0) {
    suggestions.push('Revisar mis documentos')
    suggestions.push('Analizar un documento')
  } else {
    suggestions.push('Que documentos necesito?')
  }
  
  suggestions.push('Tengo dudas sobre mi finiquito')
  
  return suggestions.slice(0, 4)
}

export function WelcomeAIAssistant({ userId, userProfile, isFirstLogin = false }: WelcomeAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [documents, setDocuments] = useState<BovedaDocument[]>([])
  const [casos, setCasos] = useState<CasoInfo[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [hasShownWelcome, setHasShownWelcome] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Cargar datos del usuario
  const loadUserData = useCallback(async () => {
    const supabase = createClient()
    
    // Cargar documentos de boveda
    const { data: docs } = await supabase
      .from('boveda_documentos')
      .select('id, nombre, tipo, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (docs) setDocuments(docs)
    
    // Cargar casos
    const { data: casosData } = await supabase
      .from('casos')
      .select('id, estado, tipo_terminacion, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (casosData) setCasos(casosData)
    
    return { docs: docs || [], casos: casosData || [] }
  }, [userId])

  // Inicializar asistente
  useEffect(() => {
    async function init() {
      const { docs, casos: casosData } = await loadUserData()
      
      // Generar mensaje de bienvenida
      const welcome = generateWelcomeMessage(userProfile, docs, casosData, isFirstLogin)
      setWelcomeMessage(welcome)
      
      // Generar sugerencias
      const sugs = generateSuggestions(userProfile, docs, casosData)
      setSuggestions(sugs)
      
      // Mostrar automaticamente si es primer login
      if (isFirstLogin && !hasShownWelcome) {
        setIsOpen(true)
        setHasShownWelcome(true)
        
        // Actualizar last_welcome_shown_at
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ last_welcome_shown_at: new Date().toISOString() })
          .eq('id', userId)
      }
    }
    
    init()
  }, [userId, userProfile, isFirstLogin, hasShownWelcome, loadUserData])

  // Agregar mensaje de bienvenida al chat
  useEffect(() => {
    if (welcomeMessage && messages.length === 0 && isOpen) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage
      }])
    }
  }, [welcomeMessage, isOpen, messages.length])

  // Scroll al ultimo mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/welcome-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          userContext: {
            isFirstLogin,
            isVerified: userProfile.is_verified || userProfile.verification_status === 'verified',
            role: userProfile.role,
            documentCount: documents.length,
            casosActivos: casos.length,
            documentos: documents.map(d => ({ nombre: d.nombre, tipo: d.tipo })),
            casos: casos.map(c => ({ estado: c.estado, tipo_terminacion: c.tipo_terminacion }))
          }
        })
      })

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Lo siento, no pude procesar tu consulta.'
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Disculpa, hubo un error. Por favor intenta de nuevo.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
        {isFirstLogin && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl transition-all duration-300 border-green-200",
      isMinimized 
        ? "bottom-4 right-4 w-80 h-14" 
        : "bottom-4 right-4 w-96 max-h-[600px] sm:w-[420px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
            <Image
              src="/lia-avatar.jpg"
              alt="LIA"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">LIA - Asistente Legal</h3>
            <p className="text-xs text-white/80">
              {isLoading ? 'Escribiendo...' : 'En linea'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Sugerencias
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-green-50 hover:border-green-300 text-xs py-1"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Quick Actions */}
          <div className="px-3 pb-3 flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1 bg-transparent"
              onClick={() => handleSuggestionClick('Calcular mi liquidacion')}
            >
              <Sparkles className="w-3 h-3" />
              Calcular
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1 bg-transparent"
              onClick={() => handleSuggestionClick('Revisar mis documentos')}
            >
              <FileText className="w-3 h-3" />
              Documentos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1 bg-transparent"
              onClick={() => handleSuggestionClick('Necesito un abogado')}
            >
              <ArrowRight className="w-3 h-3" />
              Abogado
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
