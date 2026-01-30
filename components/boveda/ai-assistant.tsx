"use client"

import Link from "next/link"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

// Metricas para analisis de rendimiento de agentes
interface ChatMetrics {
  sessionId: string
  assistant: string
  totalMessages: number
  faqResponses: number
  aiResponses: number
  fallbackResponses: number
  avgResponseTime: number
  ctaClicks: number
  conversationDuration: number
  startTime: number
}

// Guardar metricas en localStorage para analisis SEO futuro
function saveMetrics(metrics: ChatMetrics) {
  try {
    const stored = localStorage.getItem('chat_metrics') || '[]'
    const allMetrics = JSON.parse(stored)
    allMetrics.push({
      ...metrics,
      endTime: Date.now(),
      conversationDuration: Date.now() - metrics.startTime
    })
    // Mantener solo las ultimas 100 sesiones
    if (allMetrics.length > 100) allMetrics.shift()
    localStorage.setItem('chat_metrics', JSON.stringify(allMetrics))
  } catch (e) {
    console.error('Error saving metrics:', e)
  }
}

// Obtener metricas para dashboard futuro
export function getChatMetrics(): ChatMetrics[] {
  try {
    return JSON.parse(localStorage.getItem('chat_metrics') || '[]')
  } catch {
    return []
  }
}

interface UserProfile {
  id?: string
  email?: string
  fullName?: string
  role?: string
  codigoUsuario?: string
  verificationStatus?: string
}

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  documentText?: string
  documentName?: string
  userProfile?: UserProfile
  initialMessage?: string // Para enviar un mensaje inicial automaticamente (ej: resumen de documento)
  assistantType?: 'lia' | 'mandu' | 'bora' | 'licperez'
}

// Preguntas prediseñadas
const QUICK_QUESTIONS = [
  { icon: Calculator, text: "Calcular liquidacion", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { icon: FileText, text: "Iniciar conciliacion", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { icon: Scale, text: "Despido sin causa", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { icon: HelpCircle, text: "Ayuda con la app", color: "bg-slate-50 text-slate-600 border-slate-200" },
]

// FAQ por asistente - respuestas base
const FAQ_RESPONSES: Record<string, Record<string, string>> = {
  lia: {
    "Calcular liquidacion": `**Para calcular tu liquidacion:**

Solo necesitas tu **salario** y **fechas de trabajo**.

La app calcula: 3 meses + 20 dias/año + aguinaldo + vacaciones.

Si quieres, te guio con tu calculo paso a paso.`,
    "Iniciar conciliacion": `**Para iniciar conciliacion:**

1. Junta documentos (INE, nomina)
2. Pide cita en el Centro de Conciliacion
3. Asiste y expon tu caso

Si quieres, revisamos los documentos que ya tienes.`,
    "Centro conciliacion Cancun": `**Centro de Conciliacion en Cancun (Q. Roo):**

El directorio oficial cambia por municipio, asi que lo mas seguro es consultar el **CCL de Quintana Roo** y buscar la sede de Cancun.

Si me confirmas tu municipio y situacion, te ayudo a ubicar la sede correcta y la lista exacta de documentos.`,
    "Despido sin causa": `**Si te despiden sin causa, te deben:**

- 3 meses de salario
- 20 dias por año trabajado
- Prima de antiguedad

Si quieres, estimamos un rango aproximado.`,
    "Plazo para demandar": `**Plazos importantes:**

- **60 dias:** Momento fuerte para negociar
- **1 año:** Limite legal para demandar

Si quieres, te digo que informacion conviene reunir.`,
    "Ayuda con la app": `**Te explico como usar la app:**

**Mi Boveda** - Guarda tus documentos de forma segura (recibos, contratos, INE)

**Calculadora** - Calcula tu liquidacion en segundos

**Mis Casos** - Administra tu proceso de conciliacion

**Buro de Empresas** - Comenta sobre tu empresa en modo anonimo

**Que seccion te gustaria explorar primero?**`
  },
  mandu: {
    "Calcular liquidacion": `*bosteza* Salario y fechas... la app hace todo.`,
    "Iniciar conciliacion": `*abre un ojo* Papeles, cita, audiencia. Te digo que llevar si quieres.`,
    "Centro conciliacion Cancun": `*abre un ojo* Para Cancun, revisa el directorio oficial del CCL de Quintana Roo. Si me dices tu municipio, te ubico la sede.`,
    "Despido sin causa": `*levanta las orejas* 3 meses + 20 dias/año + prima. Podemos estimar.`,
    "Plazo para demandar": `*bosteza* 60 dias para negociar. Un año limite. Te ayudo a ordenar fechas.`,
    "Ayuda con la app": `*abre un ojo perezosamente*

**Boveda** - Tus papeles seguros... como mi cama...
**Calculadora** - Numeros... rapido... zzz
**Mis Casos** - Tu proceso... yo vigilo mientras duermo
**Buro** - Habla de tu empresa... anonimamente...

*se estira* **Cual exploramos? Prometo no dormirme... mucho...**`
  },
  bora: {
    "Calcular liquidacion": `*suspira* Ay mijo... Salario y fechas. Ya. Si quieres, lo hacemos.`,
    "Iniciar conciliacion": `*ojos entrecerrados* Papeles. Cita. Audiencia. Te digo que llevar.`,
    "Centro conciliacion Cancun": `*te mira* Para Cancun, busca el directorio del CCL de Quintana Roo. Dime tu municipio y te digo a cual ir.`,
    "Despido sin causa": `*ronquido interrumpido* 3 meses, 20 dias/año, prima. Podemos estimar.`,
    "Plazo para demandar": `*te observa* 60 dias para negociar. Un año limite.`,
    "Ayuda con la app": `*te mira por encima de sus lentes*

Ay mijo, es facil:

**Boveda** - Guarda tus papeles. No los pierdas.
**Calculadora** - Saca cuentas. Sin excusas.
**Mis Casos** - Tu proceso legal. Organizado.
**Buro** - Denuncia a tu empresa. Anonimo.

*suspira* **Por donde empezamos? No tengo toda la vida... bueno, si tengo.**`
  },
  licperez: {
    "Calcular liquidacion": `*se acomoda lentamente* Mmm... liquidacion...

Salario, fechas... la app lo hace... eventualmente...

**Vamos a la app? Yo te guio... a mi ritmo...**`,
    "Iniciar conciliacion": `*se rasca la cabeza lentamente*

Documentos... cita... audiencia... paso a paso...

**Te ayudo a guardar tus papeles? Sin prisa... pero sin pausa...**`,
    "Centro conciliacion Cancun": `*parpadea lento* Cancun... revisa el directorio del CCL de Quintana Roo. Si me dices tu municipio, lo ubicamos.`,
    "Despido sin causa": `*ajusta sus lentes despacio*

3 meses... 20 dias por año... prima... matematicas simples...

**Calculamos juntos? Lento pero seguro gana la carrera...**`,
    "Plazo para demandar": `*reflexiona pausadamente*

60 dias... optimo... un año... limite...

*se estira muy lento* El tiempo pasa... incluso para un perezoso...

**Empezamos? Prometo ser... eficiente... a mi manera...**`,
    "Ayuda con la app": `*parpadea lentamente*

Veamos... despacio... pero seguro...

**Boveda**... tus documentos... seguros... como yo en mi rama...
**Calculadora**... matematicas... sin prisa...
**Mis Casos**... tu proceso... paso... a... paso...
**Buro**... opiniones... anonimas... tranquilo...

*se acomoda* **Cual te interesa...? Tenemos... todo el tiempo... del mundo...**`
  }
}

// Respuesta generica cuando no se conoce la respuesta
const FALLBACK_RESPONSES: Record<string, string> = {
  lia: `Mmm, esa pregunta es muy especifica. Dime mas contexto y lo reviso contigo.`,
  mandu: `*se rasca la oreja* Necesito mas detalles para responder bien. Cuentame un poco mas...`,
  bora: `*suspira* Eso necesita mas contexto. Explicame bien y seguimos.`,
  licperez: `*parpadea lentamente* Necesito mas... contexto... para darte una buena respuesta.`
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
  
  if ((q.includes("cancun") || q.includes("quintana roo")) && (q.includes("concili") || q.includes("centro"))) {
    return responses["Centro conciliacion Cancun"]
  }
  if (q.includes("calcul") || q.includes("liquidaci")) return responses["Calcular liquidacion"]
  if (q.includes("concilia") || q.includes("reclamo")) return responses["Iniciar conciliacion"]
  if (q.includes("despid") && q.includes("causa")) return responses["Despido sin causa"]
  if (q.includes("tiempo") || q.includes("plazo") || q.includes("demandar")) return responses["Plazo para demandar"]
  if (q.includes("ayuda") || q.includes("como funciona") || q.includes("usar") || q.includes("app") || q.includes("tutorial")) return responses["Ayuda con la app"]
  
  return null
}

// Identificar mensajes que deben mostrar el boton de app
function shouldShowAppButton(messageId: string, messages: Message[], hasSession: boolean, isInAppRoute: boolean): boolean {
  if (hasSession || isInAppRoute) return false
  const msg = messages.find(m => m.id === messageId)
  if (!msg || msg.role !== "assistant") return false
  // Mostrar boton en respuestas FAQ (no en errores ni CTA)
  return !messageId.includes("error") && !messageId.includes("cta")
}

function shouldShowInAppActions(messageId: string, messages: Message[], hasSession: boolean): boolean {
  if (!hasSession) return false
  const msg = messages.find(m => m.id === messageId)
  if (!msg || msg.role !== "assistant") return false
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant")
  if (!lastAssistant || lastAssistant.id !== messageId) return false
  return !messageId.includes("error") && !messageId.includes("cta")
}

export function AIAssistant({ 
  isOpen, 
  onClose, 
  documentText, 
  documentName, 
  userProfile,
  initialMessage,
  assistantType = 'lia'
}: AIAssistantProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentAssistant, setCurrentAssistant] = useState<AssistantType>(assistantType)
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [faqCount, setFaqCount] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  const [chatExpired, setChatExpired] = useState(false)
  const [chatStartTime, setChatStartTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  
  // Metricas de la sesion
  const [metrics, setMetrics] = useState<ChatMetrics>({
    sessionId: `session-${Date.now()}`,
    assistant: 'lia',
    totalMessages: 0,
    faqResponses: 0,
    aiResponses: 0,
    fallbackResponses: 0,
    avgResponseTime: 0,
    ctaClicks: 0,
    conversationDuration: 0,
    startTime: Date.now()
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const assistant = ASSISTANTS[currentAssistant]
  const hasSession = Boolean(userProfile?.id)
  const isInAppRoute = Boolean(
    pathname &&
      (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/abogado') ||
        pathname.startsWith('/boveda') ||
        pathname.startsWith('/calculadora') ||
        pathname.startsWith('/casos') ||
        pathname.startsWith('/agenda') ||
        pathname.startsWith('/perfil') ||
        pathname.startsWith('/oficina-virtual') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/recompensas')
      )
  )
  const sessionKey = `ai-chat-session-${userProfile?.id ?? 'guest'}`
  const MAX_CHAT_DURATION_MS = 5 * 60 * 1000
  const expirationMessage = `Tengo que atender mas casos. Puedes seguir usando la app y al volver a iniciar sesion se restauran tus 5 minutos de chat.`
  
  // Detectar teclado virtual en movil
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    
    const handleResize = () => {
      const viewport = window.visualViewport
      if (!viewport) return
      
      // Calcular altura del teclado
      const keyboardH = window.innerHeight - viewport.height
      setKeyboardHeight(keyboardH > 50 ? keyboardH : 0)
      
      // Scroll al input cuando el teclado se abre
      if (keyboardH > 50) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 100)
      }
    }
    
    window.visualViewport.addEventListener('resize', handleResize)
    window.visualViewport.addEventListener('scroll', handleResize)
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('scroll', handleResize)
    }
  }, [isOpen])
  
  // Navegar a registro de invitado - rapido y directo
  const goToGuestRegister = useCallback(() => {
    // Guardar metricas con click en CTA
    setMetrics(prev => {
      const updated = { ...prev, ctaClicks: prev.ctaClicks + 1 }
      saveMetrics(updated)
      return updated
    })
    // Cerrar modal y navegar inmediatamente a la pagina de acceso con tab de registro
    onClose()
    window.location.href = '/acceso?tab=registro'
  }, [onClose])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  // Procesar mensaje inicial (ej: resumen de documento)
  useEffect(() => {
    if (isOpen && initialMessage && !hasProcessedInitialMessage) {
      setHasProcessedInitialMessage(true)
      // Enviar automaticamente el mensaje inicial para analisis
      setTimeout(() => {
        analyzeDocument(initialMessage)
      }, 500)
    }
  }, [isOpen, initialMessage, hasProcessedInitialMessage])

  // Reset cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setHasProcessedInitialMessage(false)
    }
  }, [isOpen])

  // Control de duracion de conversacion (5 minutos por sesion)
  useEffect(() => {
    if (!isOpen) return
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem(sessionKey)
    const parsed = stored ? Number.parseInt(stored, 10) : NaN
    const start = Number.isNaN(parsed) ? Date.now() : parsed
    sessionStorage.setItem(sessionKey, start.toString())
    setChatStartTime(start)
    setChatExpired(Date.now() - start >= MAX_CHAT_DURATION_MS)
  }, [isOpen, sessionKey])

  useEffect(() => {
    if (!isOpen || !chatStartTime) return
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - chatStartTime
      const remaining = Math.max(0, MAX_CHAT_DURATION_MS - elapsed)
      setTimeRemaining(remaining)
      if (remaining === 0) {
        setChatExpired(true)
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isOpen, chatStartTime])

  useEffect(() => {
    if (!chatExpired) return
    setMessages(prev => {
      const already = prev.some(msg => msg.id.startsWith('expired-'))
      if (already) return prev
      return [
        ...prev,
        {
          id: `expired-${Date.now()}`,
          role: "assistant",
          content: expirationMessage
        }
      ]
    })
  }, [chatExpired, expirationMessage])

  useEffect(() => {
    setMessages([])
    setFaqCount(0)
    setShowCTA(false)
    setChatExpired(false)
    // Actualizar asistente en metricas
    setMetrics(prev => ({ ...prev, assistant: currentAssistant }))
  }, [currentAssistant])
  
  // Funcion para analizar documento con IA
  const analyzeDocument = async (docText: string) => {
    setIsLoading(true)
    
    // Mensaje del sistema indicando que se esta analizando
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: `**Analizando documento${documentName ? `: "${documentName}"` : ''}...**\n\n*Cruzando informacion con la Ley Federal del Trabajo...*`
    }
    setMessages([systemMessage])
    
    try {
      const creditResponse = await fetch('/api/ai-credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costo: 1,
          source: 'document',
          assistant: currentAssistant
        })
      })

      if (!creditResponse.ok) {
        const creditData = await creditResponse.json()
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: creditData.error || 'No tienes monedas IA disponibles para analizar documentos.'
          }
        ])
        return
      }

      const response = await fetch(assistant.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
        content: `Explica de forma clara y concisa qué es este documento laboral y para qué sirve.
Incluye:
- Tipo de documento y etapa del proceso.
- Puntos clave (fechas, obligaciones, derechos).
- Plazos importantes o acciones inmediatas.
- Siguiente paso recomendado para la persona usuaria.

Responde en bullets y no excedas 8 puntos.

Documento:
${docText.slice(0, 4000)}`
          }],
          documentContext: docText,
          documentName: documentName,
          userProfile: userProfile,
        }),
      })

      const data = await response.json()
      
      // Agregar el analisis como respuesta
      setMessages([{
        id: `analysis-${Date.now()}`,
        role: "assistant",
        content: data.content || "No pude analizar el documento. Intenta de nuevo."
      }])
      
      setMetrics(prev => ({ ...prev, aiResponses: prev.aiResponses + 1 }))
    } catch {
      setMessages([{
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Error al analizar el documento. Por favor intenta de nuevo."
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Guardar metricas al cerrar o desmontar
  useEffect(() => {
    return () => {
      if (metrics.totalMessages > 0) {
        saveMetrics(metrics)
      }
    }
  }, [metrics])

  useEffect(() => {
    if (faqCount >= 2 && !showCTA && !userProfile?.id) {
      setShowCTA(true)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `cta-${Date.now()}`,
          role: "assistant",
          content: assistant.ctaMessage,
        }])
      }, 500)
    }
  }, [faqCount, showCTA, assistant.ctaMessage, userProfile?.id])

  const getContextualResponse = (text: string) => {
    const normalized = text.toLowerCase()
    const role = userProfile?.role
    const isLawyer = role === 'lawyer' || role === 'admin' || role === 'superadmin' || role === 'webagent'
    const isWorker = role === 'worker' || role === 'guest'

    if (isLawyer && (normalized.includes('nuevo caso') || normalized.includes('crear caso') || normalized.includes('cliente'))) {
      const codigo = userProfile?.codigoUsuario ? `Tu codigo de referido: **${userProfile.codigoUsuario}**.` : ''
      return `Para crear un caso nuevo como abogado:
1. Abre la **Calculadora** y genera el calculo del cliente.
2. Al finalizar, elige **"Guardar y crear cliente"**.
3. Comparte el folio y el enlace de referido con tu cliente para que abra su cuenta y vea el calculo.

[Ir a la Calculadora](/calculadora) ${codigo}`.trim()
    }

    if (isWorker && userProfile?.verificationStatus !== 'verified' && normalized.includes('verificar')) {
      return `Puedo ayudarte a completar tu verificacion.
Revisa que tengas tu **CURP**, telefono y un calculo guardado.

[Ir a Mi Perfil](/perfil)`
    }

    return null
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || chatExpired) return
    const startTime = Date.now()

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: text }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    
    // Actualizar metricas
    setMetrics(prev => ({ ...prev, totalMessages: prev.totalMessages + 1, assistant: currentAssistant }))
    
    const contextualResponse = getContextualResponse(text)
    if (contextualResponse) {
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: contextualResponse }])
      setMetrics(prev => ({ ...prev, aiResponses: prev.aiResponses + 1 }))
      return
    }

    // Primero buscar en FAQ
    const faqResponse = findFAQResponse(text, currentAssistant)
    
    if (faqResponse) {
      setIsLoading(true)
      await new Promise(r => setTimeout(r, 250))
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: faqResponse }])
      setFaqCount(prev => prev + 1)
      setMetrics(prev => ({ ...prev, faqResponses: prev.faqResponses + 1 }))
      setIsLoading(false)
      return
    }
    
    // Llamar a Grok AI para preguntas especificas
    setIsLoading(true)
    try {
      const creditResponse = await fetch('/api/ai-credits/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costo: 1,
          source: 'chat',
          assistant: currentAssistant
        })
      })

      if (!creditResponse.ok) {
        const creditData = await creditResponse.json()
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: creditData.error || 'No tienes monedas IA disponibles. Revisa tu plan o cupones.'
          }
        ])
        return
      }

      const response = await fetch(assistant.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          documentContext: documentText,
          documentName: documentName,
          userProfile: userProfile,
        }),
      })

      const data = await response.json()
      const responseTime = Date.now() - startTime
      
      // Agregar pregunta persuasiva al final de la respuesta de la IA
      const followups = FOLLOWUP_QUESTIONS[currentAssistant]
      const randomFollowup = followups[Math.floor(Math.random() * followups.length)]
      const contentWithFollowup = `${data.content || "No tengo esa informacion."}\n\n**${randomFollowup}**`
      
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: contentWithFollowup }])
      setMetrics(prev => ({ 
        ...prev, 
        aiResponses: prev.aiResponses + 1,
        avgResponseTime: (prev.avgResponseTime + responseTime) / 2
      }))
    } catch {
      // En caso de error, usar respuesta generica
      const fallback = FALLBACK_RESPONSES[currentAssistant]
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: fallback }])
      setMetrics(prev => ({ ...prev, fallbackResponses: prev.fallbackResponses + 1 }))
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

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Generar mensaje de bienvenida personalizado segun el perfil del usuario
  const getPersonalizedWelcome = () => {
    const base = assistant.welcomeMessage
    
    if (!userProfile?.id) {
      // Usuario no logueado
      return base
    }
    
    const name = userProfile.fullName?.split(' ')[0] || 'amigo'
    const isVerified = userProfile.verificationStatus === 'verified'
    const role = userProfile.role
    
    // Personalizar segun el asistente
    if (currentAssistant === 'lia') {
      if (role === 'lawyer' || role === 'guestlawyer') {
        return `Hola **${name}**! Soy Lia, tu asistente legal. Veo que eres abogado. Estoy aqui para ayudarte con analisis de documentos y casos. En que te ayudo?`
      }
      if (isVerified) {
        return `Hola **${name}**! Que gusto verte de nuevo. Soy Lia, tu asistente legal. Los primeros **60 dias** son clave. En que te ayudo hoy?`
      }
      return `Hola **${name}**! Soy **Lia**, tu asistente legal. Los primeros **60 dias** son clave. En que te ayudo?`
    }
    
    if (currentAssistant === 'mandu') {
      return `*bosteza* Hola **${name}**... ya te vi entrar. Tienes **60 dias** para actuar. Que necesitas? *se estira*`
    }
    
    if (currentAssistant === 'bora') {
      return `*te mira* Ah, eres tu **${name}**. Vieja y sabia soy. **60 dias** tienes. Que quieres saber?`
    }
    
    if (currentAssistant === 'licperez') {
      return `*parpadea lentamente* Hola... **${name}**... soy el **Lic. Perez**... **60 dias** tienes... en que te ayudo... sin prisa?`
    }
    
    return base
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ 
          height: keyboardHeight > 0 
            ? `calc(100vh - ${keyboardHeight}px - env(safe-area-inset-top, 0px))` 
            : '75vh',
          maxHeight: keyboardHeight > 0 ? 'none' : '75vh',
          transition: 'height 0.15s ease-out'
        }}
      >
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
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              {chatExpired ? 'Sesion finalizada' : `Tiempo: ${formatRemaining(timeRemaining)}`}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Welcome - personalizado si hay usuario logueado */}
          <div className="flex gap-2">
            <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${assistant.color}`}>
              <img src={assistant.avatar || "/placeholder.svg"} alt={assistant.name} className="w-full h-full object-cover" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatContent(getPersonalizedWelcome()) }} />
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
                {shouldShowAppButton(msg.id, messages, hasSession, isInAppRoute) && (
                  <Button 
                    size="sm" 
                    onClick={goToGuestRegister}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 text-xs rounded-xl"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Abrir App
                  </Button>
                )}
                {shouldShowInAppActions(msg.id, messages, hasSession) && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link href="/calculadora">Calculadora</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link href="/casos">Mis casos</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link href="/agenda">Alertas</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link href="/perfil">Mi perfil</Link>
                    </Button>
                  </div>
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
          {showCTA && !hasSession && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-800 text-sm">60 dias para actuar</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">Ya tienes la info. Actua ahora.</p>
              <Button 
                size="sm" 
                onClick={goToGuestRegister}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-1.5 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Entrar a la App
              </Button>
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

        {/* Input - sticky al fondo */}
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue) }} 
          className="p-3 border-t bg-slate-50 shrink-0"
          style={{ paddingBottom: keyboardHeight > 0 ? '8px' : 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={chatExpired ? "Sesion finalizada" : "Escribe tu pregunta..."}
              className="flex-1 px-3 py-2 rounded-full border bg-white focus:border-emerald-400 outline-none text-sm"
              disabled={isLoading || chatExpired}
              enterKeyHint="send"
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || chatExpired} className="rounded-full bg-emerald-500 hover:bg-emerald-600 w-9 h-9 shrink-0">
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
