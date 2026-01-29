'use client'

import React from "react"

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { Card, CardContent } from '@/components/ui/card'
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
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/legal-assistant',
    body: {
      userId,
      context: {
        profile: userProfile,
        documentsCount: documents.length,
        casosCount: casos.length
      }
    }
  })

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
      
      // Mostrar automaticamente si es primer login o usuario recurrente
      if (isFirstLogin || !hasShownWelcome) {
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
  }, [welcomeMessage, isOpen, messages.length, setMessages])

  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>)
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
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/30">
            <Image
              src="/lia-avatar.jpg"
              alt="Lia"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Lia - Asistente Legal</h4>
            <p className="text-xs text-green-100">En linea</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[500px]">
          {/* Mensajes */}
          <ScrollArea className="flex-1 p-4">
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sugerencias */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Sugerencias rapidas:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Indicadores de contexto */}
          {(documents.length > 0 || casos.length > 0) && messages.length <= 1 && (
            <div className="px-4 pb-2 flex items-center gap-2 text-xs text-gray-500">
              {documents.length > 0 && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded">
                  <FileText className="w-3 h-3" />
                  {documents.length} docs
                </span>
              )}
              {casos.length > 0 && (
                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded">
                  <Sparkles className="w-3 h-3" />
                  {casos.length} caso(s)
                </span>
              )}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Escribe tu pregunta..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-green-500 hover:bg-green-600"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
