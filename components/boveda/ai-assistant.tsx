"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
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
} from "lucide-react"
import { useChat } from "@ai-sdk/react"

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

export function AIAssistant({
  isOpen,
  onClose,
  documentText,
  documentName,
}: AIAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localInput, setLocalInput] = useState("")

  const welcomeMessage = documentText
    ? `¡Hola! Soy tu asistente legal de **Me Corrieron**, especializado en **derecho laboral mexicano**.

${documentName ? `Veo que estás consultando "${documentName}". ` : ""}Puedo ayudarte a entender este documento y cómo afecta tu caso laboral.

Pregúntame lo que necesites - estoy actualizado con las reformas laborales más recientes y conozco los procedimientos de los Centros de Conciliación.`
    : `¡Hola! Soy tu asistente legal de **Me Corrieron**, especializado en derecho laboral mexicano.

Estoy aquí para ayudarte con:
• **Calcular tu liquidación** - Te explico cómo usar la calculadora
• **Entender tus documentos** - Analizo contratos, cartas de despido
• **Conocer tus derechos** - Despidos, vacaciones, aguinaldo
• **El proceso legal** - Centros de Conciliación, demandas

¿En qué puedo ayudarte hoy?`

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/legal-assistant",
      body: {
        documentContext: documentText,
        documentName: documentName,
      },
    })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleQuickQuestion = (question: string) => {
    append({
      role: "user",
      content: question,
    })
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim()) return
    handleSubmit(e)
  }

  // Mostrar mensaje de bienvenida + mensajes del chat
  const allMessages = [
    { id: "welcome", role: "assistant" as const, content: welcomeMessage },
    ...messages,
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md h-[85vh] sm:h-[80vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg bg-white">
              <img 
                src="/ai-assistant-avatar.jpg" 
                alt="Asistente Legal" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white text-base font-semibold flex items-center gap-2">
                Asistente Legal IA
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h2>
              <p className="text-green-100 text-xs">
                Derecho laboral mexicano
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

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {message.role === "user" ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-green-300 bg-white">
                  <img 
                    src="/ai-assistant-avatar.jpg" 
                    alt="Asistente" 
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
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user" ? "" : "prose prose-sm max-w-none"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: message.role === "assistant" 
                      ? message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      : message.content
                  }}
                />
              </div>
            </div>
          ))}

          {/* Preguntas rápidas - solo si no hay mensajes del usuario */}
          {messages.length === 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground text-center mb-3">Preguntas frecuentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q.text)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs font-medium transition-all hover:scale-[1.02] ${q.color}`}
                  >
                    <q.icon className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-2">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-green-300 bg-white">
                <img 
                  src="/ai-assistant-avatar.jpg" 
                  alt="Asistente" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-white border shadow-sm rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Escribiendo...</span>
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
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2.5 rounded-full border-2 bg-slate-50 focus:bg-white focus:border-green-400 outline-none text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input?.trim()}
            className="rounded-full bg-green-600 hover:bg-green-700 w-10 h-10"
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
      aria-label="Abrir asistente legal IA"
    >
      <img 
        src="/ai-assistant-avatar.jpg" 
        alt="Asistente Legal" 
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
