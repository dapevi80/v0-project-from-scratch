'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  Calendar, 
  Phone, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Scale,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface CasoCreadoCelebrationProps {
  userName: string
  nombreEmpresa?: string
  onComplete?: () => void
}

// Confetti suave
const Confetti = ({ delay, x }: { delay: number; x: number }) => {
  const colors = ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#10B981', '#34D399']
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ 
        left: `${x}%`,
        width: 6,
        height: 10,
        backgroundColor: color,
        borderRadius: '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ 
        y: '100vh',
        opacity: [1, 1, 0],
        rotate: 720,
        x: [0, Math.random() * 60 - 30]
      }}
      transition={{ 
        duration: 4,
        delay: delay,
        ease: 'easeOut'
      }}
    />
  )
}

// Herramienta desbloqueada con animacion
const UnlockedTool = ({ 
  icon: Icon, 
  title, 
  description,
  delay,
  color = 'from-amber-400 to-amber-600'
}: { 
  icon: React.ElementType
  title: string
  description: string
  delay: number
  color?: string
}) => (
  <motion.div 
    className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
    initial={{ x: -50, opacity: 0, scale: 0.8 }}
    animate={{ x: 0, opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 150 }}
  >
    <motion.div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
      animate={{ 
        boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 25px rgba(251,191,36,0.6)', '0 0 0px rgba(251,191,36,0)'] 
      }}
      transition={{ duration: 2, repeat: Infinity, delay }}
    >
      <Icon className="w-6 h-6 text-white" />
    </motion.div>
    <div className="flex-1">
      <span className="text-white font-semibold block">{title}</span>
      <span className="text-white/70 text-sm">{description}</span>
    </div>
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: delay + 0.3, type: 'spring' }}
    >
      <CheckCircle2 className="w-6 h-6 text-green-400" />
    </motion.div>
  </motion.div>
)

export function CasoCreadoCelebration({ userName, nombreEmpresa, onComplete }: CasoCreadoCelebrationProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'tools' | 'message'>('intro')
  const [showConfetti, setShowConfetti] = useState(true)
  
  // 40 piezas de confetti
  const confettiPieces = [...Array(40)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2
  }))
  
  useEffect(() => {
    // Secuencia de animacion
    const timer1 = setTimeout(() => setPhase('tools'), 1500)
    const timer2 = setTimeout(() => setPhase('message'), 4000)
    const timer3 = setTimeout(() => setShowConfetti(false), 5000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])
  
  const handleContinue = () => {
    onComplete?.()
    router.push('/dashboard?caso_creado=true')
  }
  
  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo con gradiente naranja/amber */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      
      {/* Patron de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Confetti */}
      {showConfetti && confettiPieces.map(piece => (
        <Confetti key={piece.id} delay={piece.delay} x={piece.x} />
      ))}
      
      {/* Contenido principal */}
      <div className="relative z-10 max-w-lg w-full mx-4">
        {/* Icono de caso/maletin animado */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0, y: -50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
        >
          <motion.div 
            className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30"
            animate={{ 
              boxShadow: ['0 0 0px rgba(255,255,255,0.3)', '0 0 40px rgba(255,255,255,0.5)', '0 0 0px rgba(255,255,255,0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Briefcase className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Titulo */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-white mb-2"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Felicidades {userName}!
          </motion.h1>
          <p className="text-white/90 text-lg">
            Has creado tu primer caso
            {nombreEmpresa && <span className="font-semibold"> vs {nombreEmpresa}</span>}
          </p>
        </motion.div>
        
        {/* Herramientas desbloqueadas */}
        <AnimatePresence>
          {phase !== 'intro' && (
            <motion.div
              className="space-y-3 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.p 
                className="text-white/80 text-center text-sm mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                Herramientas desbloqueadas:
              </motion.p>
              
              <UnlockedTool 
                icon={Briefcase} 
                title="MIS CASOS" 
                description="Seguimiento de tu caso laboral"
                delay={1.8}
                color="from-blue-500 to-blue-700"
              />
              <UnlockedTool 
                icon={Phone} 
                title="CONTACTO DEL ABOGADO" 
                description="Ficha profesional de tu abogado"
                delay={2.1}
                color="from-green-500 to-green-700"
              />
              <UnlockedTool 
                icon={Calendar} 
                title="AGENDA Y ALERTAS" 
                description="Fechas de prescripcion y recordatorios"
                delay={2.4}
                color="from-purple-500 to-purple-700"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mensaje de siguiente paso */}
        <AnimatePresence>
          {phase === 'message' && (
            <motion.div
              className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.2 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Tu cuenta esta por verificarse</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Un abogado se comunicara contigo para brindarte la asesoria laboral que te mereces 
                    y terminar el proceso de verificacion de tu cuenta.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Boton continuar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full bg-white text-amber-700 hover:bg-white/90 font-semibold py-6 text-lg shadow-xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Ir a Mi Dashboard
          </Button>
        </motion.div>
        
        {/* Nota legal pequeña */}
        <motion.p
          className="text-center text-white/50 text-xs mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.5 }}
        >
          Las fechas de prescripcion se han agregado automaticamente a tu agenda
        </motion.p>
      </div>
    </motion.div>
  )
}
