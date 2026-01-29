'use client'

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, Zap, Shield, Clock, CheckCircle, FileText, 
  User, Key, RefreshCw, ArrowRight, Sparkles
} from 'lucide-react'

interface AutomationStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  status: 'completed' | 'active' | 'pending'
}

interface SinacolAutomationInfoProps {
  currentStep?: number
  isAuthorized?: boolean
  hasAccount?: boolean
  folioGenerado?: string
}

export function SinacolAutomationInfo({
  currentStep = 0,
  isAuthorized = false,
  hasAccount = false,
  folioGenerado
}: SinacolAutomationInfoProps) {
  
  const automationSteps: AutomationStep[] = [
    {
      id: 'auth',
      title: 'Autorizacion del Trabajador',
      description: 'El trabajador firma electronicamente la autorizacion para que MeCorrieron.mx y el abogado gestionen su caso ante SINACOL',
      icon: Shield,
      status: isAuthorized ? 'completed' : currentStep === 0 ? 'active' : 'pending'
    },
    {
      id: 'agent',
      title: 'Agente Inteligente Activo',
      description: 'Nuestro agente de IA prepara automaticamente todos los datos del caso: CURP, datos laborales, prestaciones y empresa demandada',
      icon: Bot,
      status: isAuthorized && !hasAccount ? 'active' : hasAccount ? 'completed' : 'pending'
    },
    {
      id: 'account',
      title: 'Creacion de Cuenta SINACOL',
      description: 'El sistema genera automaticamente las credenciales de acceso al portal SINACOL usando los datos validados del trabajador',
      icon: Key,
      status: hasAccount ? 'completed' : 'pending'
    },
    {
      id: 'folio',
      title: 'Generacion de Folio Unico',
      description: 'Se genera un folio de referencia interno y se prepara la solicitud para obtener el folio oficial de SINACOL',
      icon: FileText,
      status: folioGenerado ? 'completed' : 'pending'
    }
  ]

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Bot className="h-5 w-5" />
            </div>
            Agente Inteligente SINACOL
          </CardTitle>
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Automatizado
          </Badge>
        </div>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Automatizacion completa del proceso de conciliacion laboral
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Descripcion del proceso */}
        <div className="p-4 bg-white dark:bg-black rounded-lg border border-blue-100 dark:border-blue-900">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Como funciona la automatizacion
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cuando autorizas explicitamente, nuestro <strong>agente inteligente</strong> se encarga 
            de todo el proceso: genera automaticamente un <strong>folio unico</strong> basado en tus 
            credenciales y datos proporcionados, crea tu <strong>usuario con contrasena</strong> en 
            el portal SINACOL, y gestiona tu caso para <strong>reducir significativamente</strong> el 
            tiempo y eliminar los errores del llenado manual.
          </p>
        </div>

        {/* Pasos del proceso */}
        <div className="space-y-3">
          {automationSteps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === automationSteps.length - 1
            
            return (
              <div key={step.id} className="relative">
                <div className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                  step.status === 'completed' 
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                    : step.status === 'active'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 animate-pulse'
                    : 'bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 opacity-60'
                }`}>
                  <div className={`p-2 rounded-full ${
                    step.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                    step.status === 'active' ? 'bg-blue-100 dark:bg-blue-900' :
                    'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className={`h-4 w-4 ${
                        step.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${
                        step.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                        step.status === 'active' ? 'text-blue-700 dark:text-blue-300' :
                        'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      {step.status === 'active' && (
                        <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">
                          <RefreshCw className="h-2 w-2 mr-1 animate-spin" />
                          En proceso
                        </Badge>
                      )}
                      {step.status === 'completed' && (
                        <Badge className="text-xs bg-green-600">
                          Completado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Conector */}
                {!isLast && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className={`h-4 w-4 ${
                      step.status === 'completed' ? 'text-green-400' : 'text-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Beneficios */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-xs font-medium text-green-700 dark:text-green-300">90% menos tiempo</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">0 errores manuales</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-center">
            <Bot className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">100% automatico</p>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Importante:</strong> El agente inteligente de MeCorrieron.mx actua como intermediario 
            tecnologico para facilitar tu proceso de conciliacion. La solicitud final se registra en el 
            portal oficial SINACOL del gobierno mexicano. Despues del pre-registro automatizado, se requiere 
            ratificacion presencial con identificacion oficial dentro de 5 dias habiles.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
