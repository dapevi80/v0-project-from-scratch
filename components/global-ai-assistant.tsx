"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { AIAssistant } from "./boveda/ai-assistant"

export function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón flotante de IA con avatar - siempre visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center overflow-hidden border-2 border-green-400 bg-white"
        aria-label="Abrir asistente IA"
      >
        {/* Avatar del asistente */}
        <img 
          src="/ai-assistant-avatar.jpg" 
          alt="Asistente Legal IA" 
          className="w-full h-full object-cover"
        />
        
        {/* Anillo pulsante verde */}
        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30" />
        
        {/* Indicador de estrellas IA */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </button>

      {/* Asistente IA */}
      <AIAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
