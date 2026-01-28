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

// FAQ por asistente - Con urgencia de 60 dias y pregunta persuasiva
const FAQ_RESPONSES: Record<string, Record<string, string>> = {
  lia: {
    "Calcular liquidacion": `**Para calcular tu liquidacion:**

Solo necesitas tu **salario** y **fechas de trabajo**.

La app calcula: 3 meses + 20 dias/año + aguinaldo + vacaciones.

**Importante:** Los primeros **60 dias** son clave para negociar.

Ya tienes todo para empezar. **Quieres calcular tu liquidacion ahora mismo?**`,
    "Iniciar conciliacion": `**Para iniciar conciliacion:**

1. Junta documentos (INE, nomina)
2. Pide cita en el Centro de Conciliacion
3. Asiste y expon tu caso

**Ojo:** Tienes solo **60 dias** para tener mas fuerza legal.

**Te ayudo a organizar tus documentos en la app?**`,
    "Despido sin causa": `**Si te despiden sin causa, te deben:**

- 3 meses de salario
- 20 dias por año trabajado
- Prima de antiguedad

**Tip:** En los primeros **60 dias** tienes mejor posicion.

**Quieres ver cuanto te corresponde exactamente?**`,
    "Plazo para demandar": `**Plazos importantes:**

- **60 dias:** Mejor momento para negociar
- **1 año:** Limite legal para demandar

Entre mas rapido actues, mejor resultado.

**Empezamos con tu calculo ahora?**`
  },
  mandu: {
    "Calcular liquidacion": `*bosteza* Salario y fechas... la app hace todo.

*abre un ojo* **60 dias** para que te tomen en serio.

**Entramos a la app? Prometo no dormirme...**`,
    "Iniciar conciliacion": `*abre un ojo* Papeles, cita, audiencia.

*se lame la pata* **60 dias** para actuar con fuerza.

**Guardamos tus documentos? Yo vigilo mientras duermo...**`,
    "Despido sin causa": `*levanta las orejas* 3 meses + 20 dias/año + prima.

*ronronea* **60 dias** o la empresa se pone dificil.

**Calculamos tu lana? No me cuesta nada... solo siestas.**`,
    "Plazo para demandar": `*bosteza* 60 dias para negociar. Un año limite.

**Hacemos numeros? Sera rapido, como mi siesta #47...**`
  },
  bora: {
    "Calcular liquidacion": `*suspira* Ay mijo... Salario y fechas. Ya.

*te mira seria* **60 dias** o se hacen los sordos.

**Vas a calcular o seguimos platicando? No tengo todo el dia... bueno, si tengo.**`,
    "Iniciar conciliacion": `*ojos entrecerrados* Papeles. Cita. Audiencia.

*gruñe* **60 dias**. Tu tiempo de oro.

**Organizamos tus papeles o prefieres perder tu caso? Tu decides.**`,
    "Despido sin causa": `*ronquido interrumpido* 3 meses, 20 dias/año, prima.

*te ve fijamente* **60 dias** o pierdes ventaja.

**Calculamos de una vez? Esta gata vieja no tiene paciencia.**`,
    "Plazo para demandar": `*te observa* 60 dias para negociar. Un año limite.

**Vas a actuar o seguiras preguntando? Porque yo tengo sueño.**`
  },
  licperez: {
    "Calcular liquidacion": `*se acomoda lentamente* Mmm... liquidacion...

Salario, fechas... la app lo hace... eventualmente...

*parpadea despacio* **60 dias**... es importante... aunque todo es relativo...

**Vamos a la app? Yo te guio... a mi ritmo...**`,
    "Iniciar conciliacion": `*se rasca la cabeza lentamente*

Documentos... cita... audiencia... paso a paso...

*bosteza suavemente* **60 dias**... el tiempo vuela... o camina despacio como yo...

**Te ayudo a guardar tus papeles? Sin prisa... pero sin pausa...**`,
    "Despido sin causa": `*ajusta sus lentes despacio*

3 meses... 20 dias por año... prima... matematicas simples...

*parpadea* **60 dias** para negociar bien...

**Calculamos juntos? Lento pero seguro gana la carrera...**`,
    "Plazo para demandar": `*reflexiona pausadamente*

60 dias... optimo... un año... limite...

*se estira muy lento* El tiempo pasa... incluso para un perezoso...

**Empezamos? Prometo ser... eficiente... a mi manera...**`
  }
}

// Respuesta generica cuando no se conoce la respuesta (despues de 2 intentos)
const FALLBACK_RESPONSES: Record<string, string> = {
  lia: `Mmm, esa pregunta es muy especifica. Para darte la mejor respuesta, necesito que uses la app donde tengo acceso a toda la informacion legal.

**Creamos tu cuenta en 30 segundos?** Asi puedo ayudarte mejor.`,
  mandu: `*se rasca la oreja* Eso esta muy complicado para contestar aqui...

*bosteza* En la app tengo mas herramientas... y una cama mas comoda.

**Entramos? Te prometo despertar para ayudarte...**`,
  bora: `*suspira* Mira mijo, eso no te lo puedo contestar bien aqui afuera.

*mueve la cola* En la app tengo todo lo que necesitas. Soy vieja pero no tonta.

**Vas a entrar o seguimos perdiendo el tiempo?**`,
  licperez: `*parpadea lentamente* Mmm... esa pregunta... requiere mas... contexto...

*se acomoda* En la app tengo... todas las herramientas... eventualmente...

**Vamos juntos? Despacio... pero llegaremos...**`
}

// Preguntas persuasivas para mantener la conversacion
const FOLLOWUP_QUESTIONS: Record<string, string[]> = {
  lia: [
    "Te gustaria calcular tu liquidacion ahora?",
    "Quieres que te explique algo mas?",
    "Necesitas ayuda con tus documentos?",
    "Empezamos con tu caso?"
  ],
  mandu: [
    "Calculamos? *se estira*",
    "Algo mas? *bosteza*",
    "Entramos a la app? *abre un ojo*",
    "Te ayudo con algo? *ronronea*"
  ],
  bora: [
    "Vas a actuar o no?",
    "Algo mas? *suspira*",
    "Entramos de una vez?",
    "Mas preguntas? *te mira fijamente*"
  ],
  licperez: [
    "Continuamos... despacio?",
    "Algo mas... sin prisa?",
    "Vamos a la app... eventualmente?",
    "Te ayudo... con calma?"
  ]
}

// Configuracion por asistente
const ASSISTANTS = {
  lia: {
    name: "Lia",
    emoji: "✨",
    avatar: "/lia-avatar.jpg",
    color: "bg-emerald-500",
    api: "/api/legal-assistant",
    welcomeMessage: `Hola! Soy **Lia**, tu asistente legal. Los primeros **60 dias** son clave. En que te ayudo?`,
    loadingText: "Escribiendo...",
    ctaMessage: `**El tiempo corre!** Crea tu cuenta y calcula tu liquidacion ahora.`
  },
  mandu: {
    name: "Mandu",
    emoji: "😺",
    avatar: "/mandu-avatar.jpg",
    color: "bg-slate-500",
    api: "/api/mandu-assistant",
    welcomeMessage: `*bosteza* Soy **Mandu**... Tienes **60 dias** para actuar. Que necesitas? *se estira*`,
    loadingText: "Pensando... zzz",
    ctaMessage: `*se estira* Ya sabes lo basico. Entra a la app antes de que me duerma.`
  },
  bora: {
    name: "Bora",
    emoji: "😾",
    avatar: "/bora-avatar.jpg",
    color: "bg-orange-500",
    api: "/api/bora-assistant",
    welcomeMessage: `*te mira* Soy **Bora**. Vieja y sabia. **60 dias** tienes. Que quieres saber?`,
    loadingText: "Pensando... *suspira*",
    ctaMessage: `*suspira* Ya te di la info. Actua. Los 60 dias pasan rapido.`
  },
  licperez: {
    name: "Lic. Perez",
    emoji: "🦥",
    avatar: "/licperez-avatar.jpg",
    color: "bg-amber-600",
    api: "/api/licperez-assistant",
    welcomeMessage: `*parpadea lentamente* Hola... soy el **Lic. Perez**... perezoso de profesion... pero muy eficiente... **60 dias** tienes... en que te ayudo... sin prisa?`,
    loadingText: "Pensando... despacio...",
    ctaMessage: `*se acomoda* Bueno... ya tienes info... ahora... entremos a la app... con calma...`
  }
}

type AssistantType = keyof typeof ASSISTANTS
const ASSISTANT_ORDER: AssistantType[] = ['lia', 'mandu', 'bora', 'licperez']

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
    
    // Contar preguntas no-FAQ del usuario
    const nonFaqQuestions = messages.filter(m => m.role === "user").length + 1
    
    // Primero buscar en FAQ
    const faqResponse = findFAQResponse(text, currentAssistant)
    
    if (faqResponse) {
      setIsLoading(true)
      await new Promise(r => setTimeout(r, 300))
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: faqResponse }])
      setFaqCount(prev => prev + 1)
      setIsLoading(false)
      return
    }
    
    // Si ya hizo 2+ preguntas no-FAQ, usar respuesta generica que dirige a la app
    if (nonFaqQuestions >= 2) {
      setIsLoading(true)
      await new Promise(r => setTimeout(r, 400))
      const fallback = FALLBACK_RESPONSES[currentAssistant]
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: fallback }])
      setIsLoading(false)
      return
    }
    
    // Llamar a Grok AI para preguntas especificas
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
      // Agregar pregunta persuasiva al final de la respuesta de la IA
      const followups = FOLLOWUP_QUESTIONS[currentAssistant]
      const randomFollowup = followups[Math.floor(Math.random() * followups.length)]
      const contentWithFollowup = `${data.content || "No tengo esa informacion."}\n\n**${randomFollowup}**`
      
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: contentWithFollowup }])
    } catch {
      // En caso de error, usar respuesta generica
      const fallback = FALLBACK_RESPONSES[currentAssistant]
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: fallback }])
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
