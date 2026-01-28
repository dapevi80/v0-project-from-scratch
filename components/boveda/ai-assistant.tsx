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
  ArrowRight,
  UserPlus,
} from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isFAQ?: boolean
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
  { icon: FileText, text: "¿Cómo inicio un reclamo en conciliación?", color: "bg-green-100 text-green-700" },
  { icon: Scale, text: "¿Me pueden despedir sin causa?", color: "bg-amber-100 text-amber-700" },
  { icon: HelpCircle, text: "¿Cuánto tiempo tengo para demandar?", color: "bg-purple-100 text-purple-700" },
]

// FAQ - Respuestas CORTAS y PERSUASIVAS
const FAQ_RESPONSES_LIA: Record<string, string> = {
  "¿Cómo calculo mi liquidación?": `**Es muy fácil calcular tu liquidación:**

Con nuestra **Calculadora** solo necesitas:
• Tu salario mensual
• Fecha de inicio y fin de tu trabajo

La app calcula automáticamente: **3 meses de indemnización + 20 días por año + aguinaldo + vacaciones**.

**Puedes guardar tu cálculo en la Bóveda** para tenerlo siempre disponible y mostrárselo a un abogado cuando lo necesites.

**¿Listo para saber cuánto te deben?** Crea tu cuenta de invitado y empieza ahora.`,

  "¿Cómo inicio un reclamo en conciliación?": `**Para iniciar tu reclamo necesitas:**

1. **Junta tus documentos**: INE, comprobante de domicilio, recibos de nómina
2. **Solicita cita** en el Centro de Conciliación (te ayudo a hacerlo)
3. **Asiste a la audiencia** y expón tu caso

**Tip importante:** Guarda todos tus documentos en la **Bóveda** antes de ir. Así los tendrás organizados y listos.

**Tienes 1 año desde tu despido** para reclamar. No pierdas tiempo.

**¿Empezamos?** Crea tu cuenta y organiza tus documentos.`,

  "¿Me pueden despedir sin causa?": `**Sí pueden despedirte, PERO deben pagarte:**

Sin causa justificada te corresponde:
• **3 meses de salario**
• **20 días por año trabajado**
• **Prima de antigüedad**
• Vacaciones y aguinaldo proporcionales

**¿Tu patrón no quiere pagar?** Podemos ayudarte con un abogado que solo cobra si ganas.

**Calcula cuánto te deben** con nuestra herramienta gratuita.`,

  "¿Cuánto tiempo tengo para demandar?": `**Tienes 1 AÑO desde tu despido.**

Después de ese plazo, pierdes el derecho a reclamar.

**Mi consejo:** No esperes. Entre más rápido actúes:
• Más fácil reunir pruebas
• Mejor posición para negociar
• Mayor probabilidad de éxito

**¿Cuándo te despidieron?** Calcula tu liquidación ahora y guarda tus documentos.`
}

// FAQ con personalidad de Mandu (gato perezoso)
const FAQ_RESPONSES_MANDU: Record<string, string> = {
  "¿Cómo calculo mi liquidación?": `*se estira lentamente*

Mira, calcular tu liquidación es más fácil que atrapar una bola de estambre...

Solo necesitas tu **salario** y **fechas de trabajo**. La app hace la matemática mientras yo duermo. 😺

Te corresponde: indemnización + aguinaldo + vacaciones... *ronronea*

**Guarda tu cálculo en la Bóveda** para cuando despiertes mañana y no recuerdes nada. Como yo con mis siestas.

¿Entramos a la app? Prometo no dormirme... *bosteza* ...mucho.`,

  "¿Cómo inicio un reclamo en conciliación?": `*abre un ojo*

Conciliación, dices... Es como cuando dos gatos pelean por territorio y llega el humano a separarnos.

**Paso 1:** Junta tus papeles (INE, nómina, etc.)
**Paso 2:** Pide cita en el Centro de Conciliación
**Paso 3:** Ve y expón tu caso

*se lame la pata*

Guarda todo en la **Bóveda** antes de ir. No seas como yo que olvido dónde escondí mis juguetes.

Tienes **1 año** para reclamar. Eso son como... 365 siestas. ¿Entramos? 🐱`,

  "¿Me pueden despedir sin causa?": `*levanta las orejas*

Técnicamente sí pueden correrte... igual que un humano puede quitarte tu lugar favorito en el sillón.

PERO si no hay causa justificada, te deben:
• 3 meses de lana 💰
• 20 días por año
• Prima de antigüedad

*se acurruca*

¿Quieres saber cuánto? Usa la calculadora mientras yo tomo mi siesta #47 del día.`,

  "¿Cuánto tiempo tengo para demandar?": `*bosteza enormemente*

Un año. 365 días. 8,760 horas de siestas... digo, de plazo.

Pero no seas como yo que dejo todo para después de dormir...

**Actúa rápido.** Entre más pronto, mejor. Como atrapar un ratón antes de que escape.

*ronronea*

¿Calculamos tu liquidación ahora? Solo toma 2 minutos... tiempo suficiente para una microsiesta. 😸`
}

// Función para detectar FAQ
function findFAQResponse(question: string, isManduActive: boolean): string | null {
  const normalizedQuestion = question.toLowerCase().trim()
  const responses = isManduActive ? FAQ_RESPONSES_MANDU : FAQ_RESPONSES_LIA
  
  for (const [faqQuestion] of Object.entries(responses)) {
    const normalizedFAQ = faqQuestion.toLowerCase()
    if (normalizedQuestion === normalizedFAQ || 
        normalizedQuestion.includes(normalizedFAQ.replace("¿", "").replace("?", "")) ||
        normalizedFAQ.includes(normalizedQuestion.replace("¿", "").replace("?", ""))) {
      return responses[faqQuestion]
    }
  }
  
  // Detección por palabras clave
  if (normalizedQuestion.includes("calcul") && normalizedQuestion.includes("liquidaci")) {
    return responses["¿Cómo calculo mi liquidación?"]
  }
  if (normalizedQuestion.includes("conciliaci")) {
    return responses["¿Cómo inicio un reclamo en conciliación?"]
  }
  if (normalizedQuestion.includes("despedir") && normalizedQuestion.includes("sin causa")) {
    return responses["¿Me pueden despedir sin causa?"]
  }
  if (normalizedQuestion.includes("tiempo") && normalizedQuestion.includes("demandar")) {
    return responses["¿Cuánto tiempo tengo para demandar?"]
  }
  
  return null
}

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
      ? `¡Hola! Soy **Lía**, tu aliada legal. Veo que tienes "${docName}". ¿Qué quieres saber?`
      : `¡Hola! Soy **Lía**, tu asistente legal de Me Corrieron.\n\nPuedo ayudarte a **calcular tu liquidación**, entender tus derechos y guiarte en el proceso legal.\n\n¿En qué te ayudo?`,
    loadingText: "Lía está escribiendo...",
    ctaMessage: `**¡Ya tienes la información que necesitas!**\n\nPara calcular exactamente cuánto te deben y guardar tus documentos seguros, crea tu cuenta de invitado. Es gratis y toma 30 segundos.`
  },
  mandu: {
    name: "Mandu",
    subtitle: "El gato legal perezoso",
    avatar: "/mandu-avatar.jpg",
    gradient: "from-slate-600 to-slate-700",
    borderColor: "border-slate-300",
    buttonColor: "bg-slate-600 hover:bg-slate-700",
    api: "/api/mandu-assistant",
    welcomeMessage: () => `*bosteza* Soy **Mandu**, el gato legal... preferiría dormir pero te ayudo. 😺\n\n¿Qué necesitas? *se lame la pata*`,
    loadingText: "Mandu piensa... *bosteza*",
    ctaMessage: `*se estira*\n\n**Miau, ya sabes lo básico.**\n\nAhora entra a la app para calcular tu lana y guardar tus papeles. Yo seguiré aquí... durmiendo... 😸💤`
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
  const [faqCount, setFaqCount] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const assistant = ASSISTANTS[currentAssistant]
  const welcomeMessage = assistant.welcomeMessage(documentName)

  // Scroll suave solo al nuevo mensaje, no al final
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current
      // Scroll solo un poco para mostrar el inicio del nuevo mensaje
      const scrollAmount = Math.min(150, container.scrollHeight - container.scrollTop - container.clientHeight)
      if (scrollAmount > 0) {
        container.scrollBy({ top: scrollAmount, behavior: 'smooth' })
      }
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Limpiar mensajes al cambiar de asistente
  useEffect(() => {
    setMessages([])
    setStreamingContent("")
    setFaqCount(0)
    setShowCTA(false)
  }, [currentAssistant])

  // Mostrar CTA después de 2 FAQs respondidas
  useEffect(() => {
    if (faqCount >= 2 && !showCTA) {
      setShowCTA(true)
      // Agregar mensaje CTA
      setTimeout(() => {
        const ctaMessage: Message = {
          id: `cta-${Date.now()}`,
          role: "assistant",
          content: assistant.ctaMessage,
        }
        setMessages(prev => [...prev, ctaMessage])
      }, 1000)
    }
  }, [faqCount, showCTA, assistant.ctaMessage])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    
    // Verificar FAQ
    const faqResponse = findFAQResponse(text, currentAssistant === 'mandu')
    
    if (faqResponse) {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: faqResponse,
        isFAQ: true,
      }
      setMessages(prev => [...prev, assistantMessage])
      setFaqCount(prev => prev + 1)
      setIsLoading(false)
      return
    }
    
    // Si no hay FAQ, llamar a la IA
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
            Cambiar a {currentAssistant === 'lia' ? 'Mandu' : 'Lía'}
          </button>
        </div>

        {/* Mensajes */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
        >
          {/* Mensaje de bienvenida */}
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${assistant.borderColor} bg-white`}>
              <img 
                src={assistant.avatar || "/placeholder.svg"}
                alt={assistant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border shadow-sm">
              <div
                className="text-sm leading-relaxed"
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                <div
                  className="text-sm leading-relaxed"
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
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border shadow-sm">
                <div
                  className="text-sm leading-relaxed"
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

          {/* CTA - Botón crear cuenta */}
          {showCTA && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Continua en la app</span>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Crea tu cuenta de invitado gratis para calcular tu liquidación y guardar tus documentos.
              </p>
              <Link href="/?tab=register&guest=true" onClick={onClose}>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                  Crear cuenta de invitado
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
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
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <form id="chat-form" onSubmit={onFormSubmit} className="flex gap-2">
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
              className={`rounded-full w-10 h-10 ${assistant.buttonColor}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Botón flotante exportado para uso global
export function AIAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
      aria-label="Abrir Lía, tu asistente legal IA"
    >
      <Sparkles className="w-6 h-6 text-white" />
    </button>
  )
}
