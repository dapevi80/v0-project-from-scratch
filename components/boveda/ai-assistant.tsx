"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  X,
  Send,
  Sparkles,
  Loader2,
  User,
  Bot,
  Scale,
  MessageSquare,
} from "lucide-react"
import { useChat } from "@ai-sdk/react"

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  documentText?: string
  documentName?: string
}

export function AIAssistant({
  isOpen,
  onClose,
  documentText,
  documentName,
}: AIAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({
      api: "/api/legal-assistant",
      body: {
        documentContext: documentText,
        documentName: documentName,
        mode: documentText ? "document" : "general",
      },
      initialMessages: documentText
        ? [
            {
              id: "initial",
              role: "assistant",
              content: `¡Hola! Soy tu asistente legal especializado en **derecho laboral mexicano**.

${documentName ? `Veo que tienes el documento "${documentName}". ` : ""}Estoy aquí para ayudarte a entenderlo y responder tus dudas.

¿Qué te gustaría saber sobre este documento?`,
            },
          ]
        : [
            {
              id: "welcome",
              role: "assistant",
              content: `¡Hola! Soy tu asistente legal de **mecorrieron.mx**, especializado en derecho laboral mexicano.

Puedo ayudarte con:
- Despidos y liquidaciones
- Cálculo de finiquitos
- Vacaciones y aguinaldo
- Contratos de trabajo
- Derechos laborales

¿En qué puedo ayudarte hoy?`,
            },
          ],
    })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Resetear mensajes cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
    }
  }, [isOpen, setMessages])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] h-[80vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-base font-semibold">
                  Asistente Legal IA
                </DialogTitle>
                <p className="text-blue-100 text-xs">
                  Derecho laboral mexicano
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
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

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
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
          onSubmit={handleSubmit}
          className="p-4 border-t bg-white flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2.5 rounded-full border-2 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 w-10 h-10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Botón flotante para acceder al asistente
export function AIAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      aria-label="Abrir asistente legal IA"
    >
      <div className="relative">
        <Sparkles className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse" />
      </div>
      
      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Asistente Legal IA
      </div>
    </button>
  )
}
