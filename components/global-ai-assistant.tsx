"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sparkles } from "lucide-react"
import { AIAssistant } from "./boveda/ai-assistant"

type Position = { x: number; y: number }
type Edge = 'left' | 'right'

const BUBBLE_SIZE_IDLE = 48
const BUBBLE_SIZE_HOVER = 56
const BUBBLE_SIZE_ACTIVE = 64
const EDGE_MARGIN = 12
const STORAGE_KEY = 'ai-bubble-position'

export function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState<Position>({ x: -1, y: -1 })
  const [edge, setEdge] = useState<Edge>('right')
  const [isIdle, setIsIdle] = useState(false)
  
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const idleTimer = useRef<NodeJS.Timeout | null>(null)
  const lastInteraction = useRef<number>(Date.now())
  const hasMoved = useRef<boolean>(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })

  // Tamaño actual basado en estado
  const currentSize = isOpen ? BUBBLE_SIZE_ACTIVE : isHovered || isDragging ? BUBBLE_SIZE_HOVER : isIdle ? BUBBLE_SIZE_IDLE - 8 : BUBBLE_SIZE_IDLE

  // Cargar posición guardada
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { y, edge: savedEdge } = JSON.parse(saved)
        setEdge(savedEdge || 'right')
        setPosition({
          x: savedEdge === 'left' ? EDGE_MARGIN : window.innerWidth - BUBBLE_SIZE_IDLE - EDGE_MARGIN,
          y: Math.min(Math.max(y, EDGE_MARGIN), window.innerHeight - BUBBLE_SIZE_IDLE - EDGE_MARGIN)
        })
      } catch {
        setDefaultPosition()
      }
    } else {
      setDefaultPosition()
    }
  }, [])

  const setDefaultPosition = () => {
    setPosition({
      x: window.innerWidth - BUBBLE_SIZE_IDLE - EDGE_MARGIN,
      y: window.innerHeight - 160
    })
    setEdge('right')
  }

  // Timer para modo idle (burbuja se hace pequeña)
  useEffect(() => {
    const checkIdle = () => {
      const timeSinceInteraction = Date.now() - lastInteraction.current
      if (timeSinceInteraction > 5000 && !isOpen && !isHovered && !isDragging) {
        setIsIdle(true)
      }
    }

    idleTimer.current = setInterval(checkIdle, 1000)
    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current)
    }
  }, [isOpen, isHovered, isDragging])

  const resetIdle = useCallback(() => {
    lastInteraction.current = Date.now()
    setIsIdle(false)
  }, [])

  // Snap to edge más cercano
  const snapToEdge = useCallback((x: number, y: number) => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const midX = windowWidth / 2

    const newEdge: Edge = x < midX ? 'left' : 'right'
    const newX = newEdge === 'left' ? EDGE_MARGIN : windowWidth - currentSize - EDGE_MARGIN
    const newY = Math.min(Math.max(y, EDGE_MARGIN + 60), windowHeight - currentSize - EDGE_MARGIN - 80)

    setEdge(newEdge)
    setPosition({ x: newX, y: newY })

    // Guardar posición
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ y: newY, edge: newEdge }))
  }, [currentSize])

  // Handlers de drag
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!bubbleRef.current) return
    resetIdle()
    setIsDragging(true)
    hasMoved.current = false
    dragStartPos.current = { x: clientX, y: clientY }
    
    const rect = bubbleRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }, [resetIdle])

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    
    // Detectar si hubo movimiento real (más de 5px)
    const deltaX = Math.abs(clientX - dragStartPos.current.x)
    const deltaY = Math.abs(clientY - dragStartPos.current.y)
    if (deltaX > 5 || deltaY > 5) {
      hasMoved.current = true
    }
    
    const newX = clientX - dragOffset.current.x
    const newY = clientY - dragOffset.current.y
    
    setPosition({ x: newX, y: newY })
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    // Solo hacer snap si hubo movimiento
    if (hasMoved.current) {
      snapToEdge(position.x, position.y)
    }
  }, [isDragging, position, snapToEdge])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  // Global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY)
    const handleMouseUp = () => handleDragEnd()
    const handleTouchEndGlobal = () => handleDragEnd()

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0]
        handleDragMove(touch.clientX, touch.clientY)
      })
      document.addEventListener('touchend', handleTouchEndGlobal)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEndGlobal)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: edge === 'left' ? EDGE_MARGIN : window.innerWidth - currentSize - EDGE_MARGIN,
        y: Math.min(prev.y, window.innerHeight - currentSize - EDGE_MARGIN - 80)
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [edge, currentSize])

  const handleClick = () => {
    // Solo abrir si no hubo movimiento (fue un click real, no un drag)
    if (!hasMoved.current) {
      resetIdle()
      setIsOpen(true)
    }
    // Reset para el siguiente click
    hasMoved.current = false
  }

  if (position.x === -1) return null

  return (
    <>
      {/* Burbuja flotante arrastrable */}
      <button
        ref={bubbleRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onClick={handleClick}
        onMouseEnter={() => { setIsHovered(true); resetIdle() }}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          left: position.x,
          top: position.y,
          width: currentSize,
          height: currentSize,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`
          fixed z-[60] rounded-full shadow-lg flex items-center justify-center overflow-hidden
          border-2 bg-white cursor-grab active:cursor-grabbing select-none
          ${isDragging ? 'shadow-2xl scale-110 border-green-500' : 'hover:shadow-xl'}
          ${isIdle ? 'border-green-300 opacity-70' : 'border-green-400 opacity-100'}
        `}
        aria-label="Abrir Lía - arrastra para mover"
      >
        {/* Avatar */}
        <img 
          src="/ai-assistant-avatar.jpg" 
          alt="Asistente Legal IA" 
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        
        {/* Indicador de estrellas IA - solo visible cuando no está idle */}
        <div 
          className={`
            absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full 
            flex items-center justify-center shadow-lg transition-all duration-300
            ${isIdle ? 'w-3 h-3 opacity-50' : 'w-5 h-5 opacity-100'}
          `}
        >
          <Sparkles className={`text-white transition-all duration-300 ${isIdle ? 'w-2 h-2' : 'w-3 h-3'}`} />
        </div>

        {/* Anillo pulsante - solo cuando no está idle ni arrastrando */}
        {!isIdle && !isDragging && (
          <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20 pointer-events-none" />
        )}

        {/* Indicador de arrastre */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 pointer-events-none" />
        )}
      </button>

      {/* Tooltip de ayuda al hover (no en móvil ni cuando está idle) */}
      {isHovered && !isDragging && !isIdle && (
        <div
          style={{
            position: 'fixed',
            top: position.y + currentSize / 2 - 16,
            left: edge === 'right' ? position.x - 140 : position.x + currentSize + 8,
          }}
          className="z-[59] bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in duration-200"
        >
          <span className="font-medium">Lía - Asistente Legal</span>
          <p className="text-slate-400 text-[10px]">Toca para abrir - Arrastra para mover</p>
        </div>
      )}

      {/* Asistente IA */}
      <AIAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
