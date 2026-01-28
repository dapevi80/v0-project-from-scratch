"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { AIAssistant } from "./boveda/ai-assistant"

export function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón flotante de IA - siempre visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="Abrir asistente IA"
      >
        {/* Efecto de brillo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Anillo pulsante */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
        
        {/* Icono de estrellas IA */}
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      </button>

      {/* Tooltip */}
      <div className="fixed bottom-[88px] right-20 z-50 pointer-events-none">
        <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          Asistente Legal IA
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-4 border-transparent border-l-slate-800" />
        </div>
      </div>

      {/* Asistente IA */}
      <AIAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
