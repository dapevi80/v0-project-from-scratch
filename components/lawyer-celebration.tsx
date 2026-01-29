'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { 
  Award, 
  Shield, 
  Scale, 
  Briefcase, 
  CheckCircle2, 
  Star,
  Sparkles,
  Building2,
  FileCheck,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MENSAJES_CELEBRACION_ABOGADO, type LawyerUpgradeType } from '@/lib/lawyer-verification-utils'

interface LawyerCelebrationProps {
  userId?: string
  upgradeType: LawyerUpgradeType
  userName?: string
  onClose?: () => void
}

export function LawyerCelebration({ 
  userId, 
  upgradeType, 
  userName,
  onClose 
}: LawyerCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
    
    // Marcar celebracion como mostrada
    if (userId) {
      const markShown = async () => {
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ celebration_shown: true })
          .eq('id', userId)
      }
      markShown()
    }
    
    // Detener confetti despues de 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [userId])
  
  const mensaje = MENSAJES_CELEBRACION_ABOGADO[upgradeType] || {
    titulo: 'Felicidades',
    mensaje: 'Tu cuenta ha sido actualizada exitosamente.',
    icono: 'star',
    color: 'blue'
  }
  
  const getIcon = () => {
    switch (upgradeType) {
      case 'verification_approved':
        return <Award className="w-16 h-16 text-emerald-500" />
      case 'firm_verified':
        return <Building2 className="w-16 h-16 text-purple-500" />
      case 'registration_complete':
        return <CheckCircle2 className="w-16 h-16 text-blue-500" />
      case 'documents_submitted':
        return <FileCheck className="w-16 h-16 text-amber-500" />
      case 'reactivation':
        return <Zap className="w-16 h-16 text-green-500" />
      default:
        return <Star className="w-16 h-16 text-yellow-500" />
    }
  }
  
  const getGradient = () => {
    switch (upgradeType) {
      case 'verification_approved':
        return 'from-emerald-500 via-emerald-600 to-teal-700'
      case 'firm_verified':
        return 'from-purple-500 via-purple-600 to-indigo-700'
      case 'reactivation':
        return 'from-green-500 via-green-600 to-emerald-700'
      default:
        return 'from-blue-500 via-blue-600 to-indigo-700'
    }
  }
  
  const beneficios = [
    { icon: Scale, text: 'Acceso a herramientas AutoCCL' },
    { icon: Briefcase, text: 'Marketplace de casos' },
    { icon: Shield, text: 'Cedula digital verificada' },
    { icon: Star, text: 'Perfil en directorio publico' }
  ]
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        {/* Confetti */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.1}
            colors={['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#3b82f6']}
          />
        )}
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md"
        >
          {/* Rayos de luz */}
          <div className="absolute inset-0 -z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-40 bg-gradient-to-t from-transparent via-yellow-400/30 to-transparent"
                  style={{ transform: `rotate(${i * 30}deg) translateY(-50%)` }}
                />
              ))}
            </motion.div>
          </div>
          
          {/* Card principal */}
          <div className={`bg-gradient-to-br ${getGradient()} rounded-3xl shadow-2xl overflow-hidden`}>
            {/* Header con efecto de brillo */}
            <div className="relative pt-10 pb-6 px-6 text-center">
              {/* Sparkles animados */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-4 right-8"
              >
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute top-8 left-8"
              >
                <Sparkles className="w-4 h-4 text-white/60" />
              </motion.div>
              
              {/* Icono principal con animacion */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4"
              >
                {getIcon()}
              </motion.div>
              
              {/* Titulo */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {mensaje.titulo}
              </motion.h2>
              
              {/* Nombre del usuario */}
              {userName && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/80 text-lg"
                >
                  Lic. {userName}
                </motion.p>
              )}
            </div>
            
            {/* Contenido */}
            <div className="bg-white rounded-t-3xl px-6 py-8">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-600 text-center mb-6"
              >
                {mensaje.mensaje}
              </motion.p>
              
              {/* Beneficios (solo para verificacion completa) */}
              {upgradeType === 'verification_approved' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3 mb-6"
                >
                  <p className="text-sm font-medium text-slate-500 text-center mb-3">
                    Ahora tienes acceso a:
                  </p>
                  {beneficios.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-emerald-800">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Boton de continuar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={onClose}
                  className={`w-full bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-lg`}
                >
                  Comenzar a trabajar
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
