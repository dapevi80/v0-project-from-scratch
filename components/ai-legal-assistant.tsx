'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2,
  Scale,
  FileText,
  MessageCircle,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { useChat } from '@ai-sdk/react'

interface AILegalAssistantProps {
  isOpen: boolean
  onClose: () => void
  documentContext?: string
  documentName?: string
  mode?: 'document' | 'general'
}

export function AILegalAssistant({ 
  isOpen, 
  onClose, 
  documentContext,
  documentName,
  mode = 'general'
}: AILegalAssistantProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/legal-assistant',
    body: {
      documentContext,
      documentName,
      mode
    },
    initialMessages: mode === 'document' && documentContext ? [
      {
        id: 'system-intro',
        role: 'assistant',
        content: `Hola, soy tu asistente legal especializado en derecho laboral mexicano. He analizado el documento "${documentName || 'adjunto'}". ¿En qué te puedo ayudar? Puedo explicarte el contenido, hacer un resumen, o responder tus dudas sobre el documento.`
      }
    ] : [
      {
        id: 'system-intro',
        role: 'assistant',
        content: 'Hola, soy tu asistente legal especializado en **derecho laboral mexicano**. Puedo ayudarte con:\n\n• Dudas sobre tu despido o renuncia\n• Cálculo de liquidaciones\n• Tus derechos como trabajador\n• Explicación de documentos legales\n\n¿En qué te puedo ayudar?'
      }
    ]
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset messages when context changes
  useEffect(() => {
    if (mode === 'document' && documentContext) {
      setMessages([
        {
          id: 'system-intro',
          role: 'assistant',
          content: `He analizado el documento "${documentName || 'adjunto'}". ¿Qué te gustaría saber? Puedo:\n\n• Hacer un **resumen simple**\n• Explicar los **puntos importantes**\n• Responder tus **preguntas específicas**`
        }
      ])
    }
  }, [documentContext, documentName, mode, setMessages])

  if (!isOpen) return null

  const quickActions = mode === 'document' ? [
    { label: 'Resumen simple', prompt: 'Dame un resumen simple de este documento' },
    { label: 'Puntos clave', prompt: '¿Cuáles son los puntos más importantes de este documento?' },
    { label: '¿Qué debo hacer?', prompt: '¿Qué acciones debo tomar basándome en este documento?' },
  ] : [
    { label: 'Mis derechos', prompt: '¿Cuáles son mis derechos si me despiden?' },
    { label: 'Calcular liquidación', prompt: '¿Cómo calculo mi liquidación?' },
    { label: 'Despido injustificado', prompt: '¿Qué es un despido injustificado?' },
  ]

  return (
    <div className={`fixed inset-0 z-50 ${isMinimized ? 'pointer-events-none' : ''}`}>
      {/* Overlay */}
      {!isMinimized && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}
      
      {/* Chat Window */}
      <div 
        className={`absolute transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 w-auto h-auto pointer-events-auto' 
            : 'bottom-0 right-0 left-0 md:left-auto md:right-4 md:bottom-4 md:w-[400px] h-[85vh] md:h-[600px] md:max-h-[80vh]'
        }`}
      >
        {isMinimized ? (
          // Minimized state
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Asistente Legal</span>
            <Maximize2 className="w-4 h-4" />
          </button>
        ) : (
          // Full chat
          <div className="flex flex-col h-full bg-white md:rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Asistente Legal IA</h3>
                    <p className="text-[10px] text-blue-100">Derecho laboral mexicano</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Document indicator */}
              {mode === 'document' && documentName && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs truncate">{documentName}</span>
                </div>
              )}
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md' 
                      : 'bg-white border rounded-2xl rounded-bl-md shadow-sm'
                  } px-4 py-3`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[10px] font-medium text-blue-600">Asistente Legal</span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === 'user' ? '' : 'text-slate-700'
                    }`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-slate-500">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t bg-white">
                <p className="text-[10px] text-muted-foreground mb-2">Preguntas rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const syntheticEvent = {
                          target: { value: action.prompt },
                          preventDefault: () => {},
                        } as React.ChangeEvent<HTMLInputElement>
                        handleInputChange(syntheticEvent)
                        setTimeout(() => {
                          const form = document.getElementById('chat-form') as HTMLFormElement
                          if (form) form.requestSubmit()
                        }, 100)
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input */}
            <form id="chat-form" onSubmit={handleSubmit} className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 px-4 py-3 text-sm rounded-xl border-2 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none transition-colors"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center mt-2">
                Solo derecho laboral mexicano. No es asesoría legal profesional.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

// Floating AI Button Component
export function FloatingAIButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Abrir asistente legal IA"
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
        
        {/* Button */}
        <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {/* Animated sparkle */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
          </div>
          <span className="font-medium text-sm hidden sm:inline">Asistente IA</span>
        </div>
      </div>
    </button>
  )
}
