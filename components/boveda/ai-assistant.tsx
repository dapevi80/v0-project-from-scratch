"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  Send,
  Sparkles,
  Loader2,
  User,
  Calculator,
  FileText,
  Scale,
  HelpCircle,
  RefreshCw,
} from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  documentText?: string
  documentName?: string
}

// Preguntas prediseñadas
const QUICK_QUESTIONS = [
  { icon: Calculator, text: "¿Cómo calculo mi liquidación?", color: "bg-blue-100 text-blue-700" },
  { icon: FileText, text: "¿Qué es un finiquito?", color: "bg-green-100 text-green-700" },
  { icon: Scale, text: "¿Me pueden despedir sin causa?", color: "bg-amber-100 text-amber-700" },
  { icon: HelpCircle, text: "¿Cuánto tiempo tengo para demandar?", color: "bg-purple-100 text-purple-700" },
]

// Configuración por asistente
const ASSISTANTS = {
  lia: {
    name: "Lía",
    subtitle: "Tu asistente legal IA",
    avatar: "/lia-avatar.jpg",
    gradient: "from-green-600 to-emerald-600",
    borderColor: "border-green-300",
    buttonColor: "bg-green-600 hover:bg-green-700",
    api: "/api/legal-assistant",
    welcomeMessage: (docName?: string) => docName 
      ? `¡Hola! Soy **Lía**, tu asistente legal de **Me Corrieron**. Mi nombre viene de "Ley" + "IA" - soy tu aliada en derecho laboral mexicano.\n\nVeo que tienes el documento "${docName}". Puedo ayudarte a entenderlo.\n\n¿Qué quieres saber?`
      : `¡Hola! Soy **Lía**, tu asistente legal de **Me Corrieron**. Mi nombre viene de "Ley" + "IA" - soy tu aliada en derecho laboral mexicano.\n\nPuedo ayudarte con:\n• **Calcular tu liquidación**\n• **Entender documentos**\n• **Conocer tus derechos**\n• **El proceso legal**\n\n¿En qué te ayudo hoy?`,
    loadingText: "Lía está escribiendo...",
  },
  mandu: {
    name: "Mandu",
    subtitle: "El gato legal perezoso",
    avatar: "/mandu-avatar.jpg",
    gradient: "from-slate-600 to-slate-700",
    borderColor: "border-slate-300",
    buttonColor: "bg-slate-600 hover:bg-slate-700",
    api: "/api/mandu-assistant",
    welcomeMessage: () => `*bosteza* Miau... Soy **Mandu**, el gato legal. Preferiría dormir, pero te ayudo... 😺\n\nPuedo ayudarte con:\n• **Liquidaciones** - *ronronea*\n• **Documentos legales**\n• **Tus derechos laborales**\n\n¿Qué necesitas? *se lame la pata* 💤`,
    loadingText: "Mandu piensa... *bosteza*",
  }
}

type AssistantType = keyof typeof ASSISTANTS

export function AIAssistant({
  isOpen,
  onClose,
  documentText,
  documentName,
}: AIAssistantProps) {
  const [currentAssistant, setCurrentAssistant] = useState<AssistantType>('lia')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const assistant = ASSISTANTS[currentAssistant]
  const welcomeMessage = assistant.welcomeMessage(documentName)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Limpiar mensajes al cambiar de asistente
  useEffect(() => {
    setMessages([])
    setStreamingContent("")
  }, [currentAssistant])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setStreamingContent("")

    try {
      const response = await fetch(assistant.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          documentContext: documentText,
          documentName: documentName,
        }),
      })

      if (!response.ok) throw new Error("Error en la respuesta")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          setStreamingContent(fullContent)
        }
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fullContent || "Lo siento, no pude procesar tu mensaje.",
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingContent("")
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Hubo un error. Por favor intenta de nuevo.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const switchAssistant = () => {
    setCurrentAssistant(prev => prev === 'lia' ? 'mandu' : 'lia')
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md h-[85vh] sm:h-[80vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`p-4 border-b bg-gradient-to-r ${assistant.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg bg-white">
                <img 
                  src={assistant.avatar || "/placeholder.svg"}
                  alt={assistant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-white text-base font-semibold flex items-center gap-2">
                  {assistant.name}
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </h2>
                <p className="text-white/80 text-xs">
                  {assistant.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Botón cambiar asistente */}
          <button
            onClick={switchAssistant}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cambiar a {currentAssistant === 'lia' ? 'Mandu (gato perezoso)' : 'Lía (asistente legal)'}
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {/* Mensaje de bienvenida */}
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white`}>
              <img 
                src={assistant.avatar || "/placeholder.svg"}
                alt={assistant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border shadow-sm">
              <div
                className="text-sm leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(welcomeMessage) }}
              />
            </div>
          </div>

          {/* Mensajes del chat */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {message.role === "user" ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white`}>
                  <img 
                    src={assistant.avatar || "/placeholder.svg"}
                    alt={assistant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                <div
                  className={`text-sm leading-relaxed ${message.role === "assistant" ? "prose prose-sm max-w-none" : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: message.role === "assistant" ? formatContent(message.content) : message.content
                  }}
                />
              </div>
            </div>
          ))}

          {/* Streaming content */}
          {streamingContent && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white`}>
                <img 
                  src={assistant.avatar || "/placeholder.svg"}
                  alt={assistant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border shadow-sm">
                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatContent(streamingContent) }}
                />
              </div>
            </div>
          )}

          {/* Preguntas rápidas */}
          {messages.length === 0 && !streamingContent && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground text-center mb-3">Preguntas frecuentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q.text)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs font-medium transition-all hover:scale-[1.02] disabled:opacity-50 ${q.color}`}
                  >
                    <q.icon className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-2">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white`}>
                <img 
                  src={assistant.avatar || "/placeholder.svg"}
                  alt={assistant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white border shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{assistant.loadingText}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={onFormSubmit}
          className="p-4 border-t bg-white flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2.5 rounded-full border-2 bg-slate-50 focus:bg-white focus:border-green-400 outline-none text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
            className={`rounded-full ${assistant.buttonColor} w-10 h-10`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

// Botón flotante para acceder al asistente
export function AIAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group overflow-hidden border-3 border-green-400 bg-white"
      aria-label="Abrir Lía, tu asistente legal IA"
    >
      <img 
        src="/lia-avatar.jpg" 
        alt="Lía - Asistente Legal" 
        className="w-full h-full object-cover"
      />
      
      {/* Indicador IA */}
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      
      {/* Anillo pulsante */}
      <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30" />
    </button>
  )
}
