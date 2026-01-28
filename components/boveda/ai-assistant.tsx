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
  ArrowRight,
  UserPlus,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"

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
  { icon: Calculator, text: "Calcular liquidacion", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { icon: FileText, text: "Iniciar conciliacion", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { icon: Scale, text: "Despido sin causa", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { icon: HelpCircle, text: "Plazo para demandar", color: "bg-purple-50 text-purple-600 border-purple-200" },
]

// FAQ por asistente - Con urgencia de 60 dias
const FAQ_RESPONSES: Record<string, Record<string, string>> = {
  lia: {
    "Calcular liquidacion": `**Para calcular tu liquidacion:**

Solo necesitas tu **salario** y **fechas de trabajo**.

La app calcula: 3 meses + 20 dias/año + aguinaldo + vacaciones.

**Importante:** Los primeros **60 dias** son clave para negociar. Despues la empresa se pone mas dificil.

Calcula ahora y guarda en tu Boveda.`,
    "Iniciar conciliacion": `**Para iniciar conciliacion:**

1. Junta tus documentos (INE, nomina)
2. Pide cita en el Centro de Conciliacion
3. Asiste y expon tu caso

**Ojo:** Tienes solo **60 dias** desde el problema para tener mas fuerza legal. Despues se complica.

Guarda todo en la Boveda y actua rapido.`,
    "Despido sin causa": `**Si te despiden sin causa, te deben:**

- 3 meses de salario
- 20 dias por año trabajado
- Prima de antiguedad

**Tip:** En los primeros **60 dias** tienes mejor posicion para negociar. No dejes pasar el tiempo.

Calcula cuanto te deben ahora.`,
    "Plazo para demandar": `**Plazos importantes:**

- **60 dias:** Mejor momento para negociar (la empresa aun quiere arreglar)
- **1 año:** Limite legal para demandar

Entre mas rapido actues, mejor resultado. Las pruebas estan frescas y la empresa negocia.

Calcula tu liquidacion ahora.`
  },
  mandu: {
    "Calcular liquidacion": `*bosteza* Solo pon tu salario y fechas...

La app hace la matematica. Yo duermo.

*abre un ojo* Oye, tienes **60 dias** para que la empresa te tome en serio. Despues... meh.

Hazlo ya. *se estira*`,
    "Iniciar conciliacion": `*abre un ojo*

Junta papeles, pide cita, ve a la audiencia.

*se lame la pata* Son **60 dias** para actuar con fuerza. Despues la empresa se hace la dormida... como yo.

Guarda todo en la Boveda.`,
    "Despido sin causa": `*levanta las orejas*

Te deben 3 meses + 20 dias/año + prima.

*ronronea* Pero actua en los primeros **60 dias**... o la empresa se pone dificil.

Calcula tu lana ya.`,
    "Plazo para demandar": `*bosteza* 60 dias para negociar bien. Un año limite.

Entre mas duermas, peor. *ironia gatuna*

Calculamos? *se rasca la oreja*`
  },
  bora: {
    "Calcular liquidacion": `*suspira pesadamente*

Ay mijo... Pon tu salario y fechas. Ya.

*te mira seria* Tienes **60 dias** para que te hagan caso. Despues se hacen los sordos. Lo he visto mil veces.

Calculalo ya. *se acuesta*`,
    "Iniciar conciliacion": `*te mira con ojos entrecerrados*

Papeles. Cita. Audiencia. Listo.

*gruñe* **60 dias**. Ese es tu tiempo de oro. Despues la empresa ya no te pela. Hazme caso, soy vieja y sabia.

Guarda todo en la Boveda. *mueve la cola molesta*`,
    "Despido sin causa": `*ronquido interrumpido*

Te deben 3 meses, 20 dias por año, prima... lo de siempre.

*te ve fijamente* Pero si dejas pasar **60 dias**, la empresa ya no negocia igual. Aprende de esta gata vieja.

Calcula ahora. *se da la vuelta*`,
    "Plazo para demandar": `*te observa con desden*

En mis tiempos la gente actuaba rapido. Ahora todo lo dejan.

**60 dias** para negociar con fuerza. Un año limite. Tictac.

Hazlo ahora. *cierra los ojos*`
  }
}

// Configuracion por asistente
const ASSISTANTS = {
  lia: {
    name: "Lia",
    emoji: "✨",
    avatar: "/lia-avatar.jpg",
    color: "bg-emerald-500",
    api: "/api/legal-assistant",
    welcomeMessage: `Hola! Soy **Lia**, tu asistente legal. Recuerda: los primeros **60 dias** son clave para tu caso. En que te ayudo?`,
    loadingText: "Escribiendo...",
    ctaMessage: `**El tiempo corre!** Crea tu cuenta gratis y calcula tu liquidacion antes de que pasen los 60 dias.`
  },
  mandu: {
    name: "Mandu",
    emoji: "😺",
    avatar: "/mandu-avatar.jpg",
    color: "bg-slate-500",
    api: "/api/mandu-assistant",
    welcomeMessage: `*bosteza* Soy **Mandu**... Oye, no duermas tanto como yo. Tienes **60 dias** para actuar. Que necesitas?`,
    loadingText: "Pensando... zzz",
    ctaMessage: `*se estira* Ya sabes lo basico. Ahora deja de ronronear y entra a la app. El tiempo no espera.`
  },
  bora: {
    name: "Bora",
    emoji: "😾",
    avatar: "/bora-avatar.jpg",
    color: "bg-orange-500",
    api: "/api/bora-assistant",
    welcomeMessage: `*te mira* Soy **Bora**. Vieja y sabia. Se que tienes problemas laborales... y se que tienes **60 dias** para actuar. Que quieres saber?`,
    loadingText: "Pensando... *suspira*",
    ctaMessage: `*suspira* Ya te di la informacion. Ahora actua. Los 60 dias pasan rapido. Entra a la app.`
  }
}

type AssistantType = keyof typeof ASSISTANTS
const ASSISTANT_ORDER: AssistantType[] = ['lia', 'mandu', 'bora']

function findFAQResponse(question: string, assistant: AssistantType): string | null {
  const q = question.toLowerCase()
  const responses = FAQ_RESPONSES[assistant]
  
  if (q.includes("calcul") || q.includes("liquidaci")) return responses["Calcular liquidacion"]
  if (q.includes("concilia") || q.includes("reclamo")) return responses["Iniciar conciliacion"]
  if (q.includes("despid") && q.includes("causa")) return responses["Despido sin causa"]
  if (q.includes("tiempo") || q.includes("plazo") || q.includes("demandar")) return responses["Plazo para demandar"]
  
  return null
}

// Identificar mensajes que deben mostrar el boton de app
function shouldShowAppButton(messageId: string, messages: Message[]): boolean {
  const msg = messages.find(m => m.id === messageId)
  if (!msg || msg.role !== "assistant") return false
  // Mostrar boton en respuestas FAQ (no en errores ni CTA)
  return !messageId.includes("error") && !messageId.includes("cta")
}

export function AIAssistant({ isOpen, onClose, documentText, documentName }: AIAssistantProps) {
  const [currentAssistant, setCurrentAssistant] = useState<AssistantType>('lia')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [faqCount, setFaqCount] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const assistant = ASSISTANTS[currentAssistant]

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    setMessages([])
    setFaqCount(0)
    setShowCTA(false)
  }, [currentAssistant])

  useEffect(() => {
    if (faqCount >= 2 && !showCTA) {
      setShowCTA(true)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `cta-${Date.now()}`,
          role: "assistant",
          content: assistant.ctaMessage,
        }])
      }, 500)
    }
  }, [faqCount, showCTA, assistant.ctaMessage])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: text }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    
    const faqResponse = findFAQResponse(text, currentAssistant)
    
    if (faqResponse) {
      setIsLoading(true)
      await new Promise(r => setTimeout(r, 300))
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: faqResponse }])
      setFaqCount(prev => prev + 1)
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(assistant.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          documentContext: documentText,
          documentName: documentName,
        }),
      })

      const data = await response.json()
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: data.content || "Error." }])
    } catch {
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: "Error. Intenta de nuevo." }])
    } finally {
      setIsLoading(false)
    }
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-500">$1</em>')
      .replace(/\n/g, '<br/>')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative w-full max-w-sm h-[75vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-slate-50">
          <div className="relative">
            <button 
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border hover:bg-slate-50"
            >
              <div className={`w-6 h-6 rounded-full overflow-hidden ${assistant.color}`}>
                <img src={assistant.avatar || "/placeholder.svg"} alt={assistant.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-medium text-sm">{assistant.name}</span>
              <span>{assistant.emoji}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            
            {showPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-lg py-1 min-w-[150px] z-10">
                {ASSISTANT_ORDER.map(type => (
                  <button
                    key={type}
                    onClick={() => { setCurrentAssistant(type); setShowPicker(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 ${currentAssistant === type ? 'bg-slate-100' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded-full overflow-hidden ${ASSISTANTS[type].color}`}>
                      <img src={ASSISTANTS[type].avatar || "/placeholder.svg"} alt={ASSISTANTS[type].name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm">{ASSISTANTS[type].name}</span>
                    <span className="text-xs">{ASSISTANTS[type].emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Welcome */}
          <div className="flex gap-2">
            <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${assistant.color}`}>
              <img src={assistant.avatar || "/placeholder.svg"} alt={assistant.name} className="w-full h-full object-cover" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatContent(assistant.welcomeMessage) }} />
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "user" ? (
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${assistant.color}`}>
                  <img src={assistant.avatar || "/placeholder.svg"} alt={assistant.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={`rounded-2xl px-3 py-2 ${
                  msg.role === "user" ? "bg-blue-500 text-white rounded-tr-sm" : "bg-slate-100 rounded-tl-sm"
                }`}>
                  <p className="text-sm" dangerouslySetInnerHTML={{ 
                    __html: msg.role === "assistant" ? formatContent(msg.content) : msg.content 
                  }} />
                </div>
                {/* Boton Abrir App para respuestas del asistente */}
                {shouldShowAppButton(msg.id, messages) && (
                  <Link href="/?tab=register&guest=true" onClick={onClose}>
                    <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs rounded-xl">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Abrir App - Crear cuenta gratis
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Quick questions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border hover:scale-105 disabled:opacity-50 ${q.color}`}
                >
                  <q.icon className="w-3.5 h-3.5" />
                  {q.text}
                </button>
              ))}
            </div>
          )}

          {/* CTA despues de 2 preguntas */}
          {showCTA && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-800 text-sm">El tiempo corre - 60 dias</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">Ya tienes la info. Ahora actua antes de que sea tarde.</p>
              <Link href="/?tab=register&guest=true" onClick={onClose}>
                <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-1.5 text-xs">
                  <UserPlus className="w-3.5 h-3.5" />
                  Crear cuenta de invitado
                </Button>
              </Link>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-2">
              <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${assistant.color}`}>
                <img src={assistant.avatar || "/placeholder.svg"} alt={assistant.name} className="w-full h-full object-cover" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">{assistant.loadingText}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue) }} className="p-3 border-t bg-slate-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3 py-2 rounded-full border bg-white focus:border-emerald-400 outline-none text-sm"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="rounded-full bg-emerald-500 hover:bg-emerald-600 w-9 h-9">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AIAssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg flex items-center justify-center" aria-label="Abrir asistente">
      <Sparkles className="w-6 h-6 text-white" />
    </button>
  )
}
