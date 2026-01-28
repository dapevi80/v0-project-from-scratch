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

// Configuración por asistente
const ASSISTANTS = {
  lia: {
    name: "Lía",
    subtitle: "Tu asistente legal IA",
    avatar: "/lia-avatar.jpg",
    gradient: "from-green-600 to-emerald-600",
    borderColor: "border-green-300",
    buttonColor: "bg-green-600 hover:bg-green-700",
    welcomeMessage: (docName?: string) => docName 
      ? `¡Hola! Soy **Lía**, tu asistente legal de **Me Corrieron**. Mi nombre viene de "Ley" + "IA" - soy tu aliada en derecho laboral mexicano.\n\nVeo que tienes el documento "${docName}". Puedo ayudarte a entenderlo y explicarte cómo te afecta.\n\nPregúntame lo que necesites - estoy al día con las reformas laborales.`
      : `¡Hola! Soy **Lía**, tu asistente legal de **Me Corrieron**. Mi nombre viene de "Ley" + "IA" - soy tu aliada en derecho laboral mexicano.\n\nPuedo ayudarte con:\n• **Calcular tu liquidación** - Te guío paso a paso\n• **Entender documentos** - Contratos, cartas de despido\n• **Conocer tus derechos** - Ley Federal del Trabajo\n• **El proceso legal** - Conciliación, demandas\n\n¿En qué te ayudo hoy?`,
    loadingText: "Lía está escribiendo...",
  },
  mandu: {
    name: "Mandu",
    subtitle: "El gato legal perezoso",
    avatar: "/mandu-avatar.jpg",
    gradient: "from-slate-600 to-slate-700",
    borderColor: "border-slate-300",
    buttonColor: "bg-slate-600 hover:bg-slate-700",
    welcomeMessage: (docName?: string) => docName
      ? `*bosteza* Miau... Soy **Mandu**, el gato legal de Me Corrieron. Estaba tomando una siesta pero bueno, aquí estoy...\n\nVeo que tienes "${docName}". Déjame revisarlo mientras me estiro un poco...\n\n*se rasca la oreja* ¿Qué quieres saber?`
      : `*bosteza* Miau... Soy **Mandu**, el gato legal de Me Corrieron. Preferiría estar durmiendo, pero está bien... te ayudo.\n\nPuedo ayudarte con:\n• **Liquidaciones** - *ronronea* Son mis favoritas\n• **Documentos** - Los analizo mientras dormito\n• **Tus derechos** - Conozco la ley de memoria\n• **Procesos legales** - *se lame la pata*\n\n¿Qué necesitas? Hazlo rápido que tengo sueño...`,
    loadingText: "Mandu está pensando... *bosteza*",
  }
}

type AssistantType = 'lia' | 'mandu'

export function AIAssistant({
  isOpen,
  onClose,
  documentText,
  documentName,
}: AIAssistantProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentAssistant, setCurrentAssistant] = useState<AssistantType>('lia')
  const [manduAwake, setManduAwake] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const assistant = ASSISTANTS[currentAssistant]
  const welcomeMessage = assistant.welcomeMessage(documentName)

  const { messages, append, isLoading, setMessages } = useChat({
    api: currentAssistant === 'mandu' ? "/api/mandu-assistant" : "/api/legal-assistant",
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

  // Despertar a Mandu cuando hay mensajes del usuario
  useEffect(() => {
    if (currentAssistant === 'mandu' && messages.some(m => m.role === 'user')) {
      setManduAwake(true)
    }
  }, [messages, currentAssistant])

  const switchAssistant = () => {
    const newAssistant = currentAssistant === 'lia' ? 'mandu' : 'lia'
    setCurrentAssistant(newAssistant)
    setMessages([]) // Limpiar mensajes al cambiar
    setManduAwake(false) // Mandu vuelve a dormir
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setInputValue("")
    await append({ role: "user", content: text })
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  // Mostrar mensaje de bienvenida + mensajes del chat
  const allMessages = [
    { id: "welcome", role: "assistant" as const, content: welcomeMessage },
    ...messages,
  ]

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
        <div className={`p-4 border-b bg-gradient-to-r ${assistant.gradient} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {/* Avatar con animación para Mandu */}
            <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg bg-white ${
              currentAssistant === 'mandu' && !manduAwake ? 'mandu-sleeping' : ''
            } ${currentAssistant === 'mandu' && manduAwake ? 'mandu-awake' : ''}`}>
              <img 
                src={assistant.avatar || "/placeholder.svg"}
                alt={assistant.name}
                className="w-full h-full object-cover"
              />
              {/* Zzzs para Mandu dormido */}
              {currentAssistant === 'mandu' && !manduAwake && (
                <div className="absolute -top-1 -right-1 text-xs animate-bounce">
                  <span className="text-white font-bold drop-shadow-lg">z</span>
                  <span className="text-white/80 text-[10px] font-bold drop-shadow-lg">z</span>
                  <span className="text-white/60 text-[8px] font-bold drop-shadow-lg">z</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-white text-base font-semibold flex items-center gap-2">
                {assistant.name}
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h2>
              <p className="text-white/80 text-xs">
                {assistant.subtitle}
              </p>
              {/* Botón cambiar asistente */}
              <button
                onClick={switchAssistant}
                className="mt-1 flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Cambiar a {currentAssistant === 'lia' ? 'Mandu' : 'Lía'}
              </button>
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
                <div className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white ${
                  currentAssistant === 'mandu' && !manduAwake ? 'mandu-sleeping-small' : ''
                }`}>
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
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user" ? "" : "prose prose-sm max-w-none"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: message.role === "assistant" 
                      ? message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="text-slate-500">$1</em>')
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
          id="chat-form"
          onSubmit={onFormSubmit}
          className="p-4 border-t bg-white flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentAssistant === 'mandu' ? "Escribe... *bosteza*" : "Escribe tu pregunta..."}
            className={`flex-1 px-4 py-2.5 rounded-full border-2 bg-slate-50 focus:bg-white outline-none text-sm ${
              currentAssistant === 'lia' ? 'focus:border-green-400' : 'focus:border-slate-400'
            }`}
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

      {/* CSS para animaciones de Mandu */}
      <style jsx global>{`
        @keyframes mandu-sleep {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(2px); }
        }
        
        @keyframes mandu-wake {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.15) rotate(5deg); }
          75% { transform: scale(1.1) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        .mandu-sleeping {
          animation: mandu-sleep 2s ease-in-out infinite;
        }
        
        .mandu-sleeping-small {
          animation: mandu-sleep 3s ease-in-out infinite;
        }
        
        .mandu-awake {
          animation: mandu-wake 0.6s ease-out forwards;
        }
      `}</style>
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
