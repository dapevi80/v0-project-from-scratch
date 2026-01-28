'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Award, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface VerificacionCelebrationProps {
  userName: string
  userAvatar?: string | null
  onComplete?: () => void
}

// Componente de confetti individual
const Confetti = ({ delay, x }: { delay: number; x: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const rotation = Math.random() * 360
  const size = Math.random() * 8 + 4
  
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ 
        left: `${x}%`,
        width: size,
        height: size * 1.5,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ 
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: rotation + 720,
        x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50]
      }}
      transition={{ 
        duration: 4 + Math.random() * 2,
        delay: delay,
        ease: 'easeOut'
      }}
    />
  )
}

// Componente de rayo
const LightningBolt = ({ onStrike }: { onStrike: () => void }) => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Flash de luz */}
      <motion.div
        className="absolute inset-0 bg-yellow-400/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      
      {/* Rayo SVG */}
      <motion.svg
        viewBox="0 0 100 200"
        className="w-32 h-64 absolute"
        style={{ top: '-50px' }}
        initial={{ opacity: 0, y: -100, scale: 0.5 }}
        animate={{ 
          opacity: [0, 1, 1, 0],
          y: [-100, 50, 50, 50],
          scale: [0.5, 1.2, 1, 0.8]
        }}
        transition={{ 
          duration: 0.8,
          times: [0, 0.3, 0.6, 1],
          delay: 0.3
        }}
        onAnimationComplete={onStrike}
      >
        <motion.path
          d="M50 0 L30 80 L45 80 L25 140 L70 60 L50 60 L70 0 Z"
          fill="url(#lightning-gradient)"
          filter="url(#glow)"
        />
        <defs>
          <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </motion.svg>
      
      {/* Partículas de electricidad */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
          style={{
            top: '50%',
            left: '50%',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 80,
            y: Math.sin(i * 45 * Math.PI / 180) * 80,
          }}
          transition={{ duration: 0.5, delay: 0.7 }}
        />
      ))}
    </motion.div>
  )
}

// Componente de onda de choque
const Shockwave = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute rounded-full border-2 border-yellow-400/50"
    style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    initial={{ width: 0, height: 0, opacity: 1 }}
    animate={{ width: 400, height: 400, opacity: 0 }}
    transition={{ duration: 1.5, delay, ease: 'easeOut' }}
  />
)

// Componente de herramienta desbloqueada con animacion
const UnlockedTool = ({ icon: Icon, title, delay }: { icon: React.ElementType; title: string; delay: number }) => (
  <motion.div 
    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
    initial={{ x: -30, opacity: 0, scale: 0.8 }}
    animate={{ x: 0, opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
  >
    <motion.div
      className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
      animate={{ 
        boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.5)', '0 0 0px rgba(34,197,94,0)'] 
      }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
    >
      <Icon className="w-5 h-5 text-white" />
    </motion.div>
    <span className="text-white font-medium">{title}</span>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: delay + 0.3, type: 'spring' }}
    >
      <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto" />
    </motion.div>
  </motion.div>
)

// Componente de escudo con medalla
const ShieldWithMedal = ({ userName, userAvatar }: { userName: string; userAvatar?: string | null }) => {
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ y: -200, opacity: 0, scale: 0.3 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 1.2
      }}
    >
      {/* Escudo */}
      <motion.div 
        className="relative"
        animate={{ 
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.5)',
            '0 0 40px rgba(59, 130, 246, 0.8)',
            '0 0 20px rgba(59, 130, 246, 0.5)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-28 h-32 relative">
          {/* Forma del escudo */}
          <svg viewBox="0 0 100 120" className="w-full h-full">
            <defs>
              <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <path
              d="M50 5 L95 20 L95 55 C95 85 50 115 50 115 C50 115 5 85 5 55 L5 20 Z"
              fill="url(#shield-gradient)"
              stroke="#60A5FA"
              strokeWidth="2"
            />
          </svg>
          
          {/* Avatar dentro del escudo */}
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            {userAvatar ? (
              <img 
                src={userAvatar || "/placeholder.svg"} 
                alt={userName}
                className="w-14 h-14 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-white">
                <span className="text-white font-bold text-lg">{initials || 'U'}</span>
              </div>
            )}
          </div>
          
          {/* Check de verificación */}
          <motion.div
            className="absolute -right-2 -top-2 bg-green-500 rounded-full p-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.8, type: 'spring' }}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Medalla */}
      <motion.div
        className="relative -mt-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 1.6,
          type: 'spring',
          stiffness: 200
        }}
      >
        <div className="relative">
          {/* Cinta de la medalla */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-red-500 to-red-600 rounded-t-sm" />
          
          {/* Medalla */}
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-yellow-200"
            animate={{ 
              boxShadow: [
                '0 0 10px rgba(234, 179, 8, 0.5)',
                '0 0 25px rgba(234, 179, 8, 0.8)',
                '0 0 10px rgba(234, 179, 8, 0.5)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Award className="w-6 h-6 text-yellow-800" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function VerificacionCelebration({ userName, userAvatar, onComplete }: VerificacionCelebrationProps) {
  const [phase, setPhase] = useState<'lightning' | 'shield' | 'complete'>('lightning')
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()
  
  const confettiPieces = [...Array(60)].map((_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100
  }))
  
  useEffect(() => {
    // Iniciar confetti después del rayo
    const confettiTimer = setTimeout(() => {
      setShowConfetti(true)
    }, 1000)
    
    return () => clearTimeout(confettiTimer)
  }, [])
  
  const handleLightningComplete = () => {
    setPhase('shield')
  }
  
  const handleContinue = () => {
    if (onComplete) {
      onComplete()
    }
    router.push('/dashboard?verified=true')
  }
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo con gradiente */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Estrellas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
      
      {/* Confetti */}
      {showConfetti && confettiPieces.map(piece => (
        <Confetti key={piece.id} delay={piece.delay} x={piece.x} />
      ))}
      
      {/* Ondas de choque */}
      {phase !== 'lightning' && (
        <>
          <Shockwave delay={1.3} />
          <Shockwave delay={1.5} />
          <Shockwave delay={1.7} />
        </>
      )}
      
      {/* Rayo */}
      <AnimatePresence>
        {phase === 'lightning' && (
          <LightningBolt onStrike={handleLightningComplete} />
        )}
      </AnimatePresence>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Escudo y medalla */}
        {phase !== 'lightning' && (
          <ShieldWithMedal userName={userName} userAvatar={userAvatar} />
        )}
        
        {/* Texto de felicitación */}
        <motion.div
          className="mt-8 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            className="flex items-center justify-center gap-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Cuenta Verificada</h1>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
          
          <p className="text-blue-200 text-lg">
            Felicidades <span className="font-semibold text-white">{userName}</span>
          </p>
          
          <p className="text-blue-300 text-sm max-w-xs mx-auto">
            Tu cuenta ha sido verificada exitosamente. Ahora tienes acceso a todas las herramientas premium.
          </p>
          
          {/* Nuevas herramientas desbloqueadas */}
          <motion.div
            className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.3 }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Herramientas Plus Desbloqueadas</span>
            </div>
            
            <div className="space-y-2">
              <UnlockedTool icon={Shield} title="MIS CASOS" delay={2.5} />
              <UnlockedTool icon={Zap} title="Chat con Abogado" delay={2.7} />
              <UnlockedTool icon={Award} title="Seguimiento en Tiempo Real" delay={2.9} />
            </div>
          </motion.div>
          
          {/* Botón continuar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.2 }}
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-orange-500/30"
            >
              <Zap className="w-5 h-5 mr-2" />
              Ir a Mi Dashboard
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
