'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Check, Lock, Briefcase, Calculator, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface AccountLimitsBannerProps {
  role: string
  casosActuales: number
  calculosActuales: number
  documentosActuales?: number
  maxCasos: number
  maxCalculos: number
  maxDocumentos?: number
  compact?: boolean
  showUpgradeButton?: boolean
}

export function AccountLimitsBanner({
  role,
  casosActuales,
  calculosActuales,
  documentosActuales = 0,
  maxCasos,
  maxCalculos,
  maxDocumentos = -1,
  compact = false,
  showUpgradeButton = true
}: AccountLimitsBannerProps) {
  const isGuestLawyer = role === 'guestlawyer'
  const isUnlimited = maxCasos === -1 || maxCasos === Infinity
  
  // Calcular porcentajes
  const casosPorcentaje = isUnlimited ? 0 : Math.min(100, (casosActuales / maxCasos) * 100)
  const calculosPorcentaje = maxCalculos === -1 || maxCalculos === Infinity ? 0 : Math.min(100, (calculosActuales / maxCalculos) * 100)
  
  // Determinar si esta cerca del limite
  const cercaDelLimite = casosPorcentaje >= 80 || calculosPorcentaje >= 80
  const limiteAlcanzado = casosPorcentaje >= 100 || calculosPorcentaje >= 100
  
  // Si tiene cuenta ilimitada, no mostrar nada
  if (isUnlimited && !isGuestLawyer) {
    return null
  }
  
  // Version compacta para headers/sidebars
  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${
        limiteAlcanzado 
          ? 'bg-red-50 border-red-200' 
          : cercaDelLimite 
            ? 'bg-amber-50 border-amber-200'
            : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {limiteAlcanzado ? (
              <Lock className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm font-medium">
              {casosActuales}/{maxCasos === Infinity ? '∞' : maxCasos} casos
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-sm font-medium">
              {calculosActuales}/{maxCalculos === Infinity ? '∞' : maxCalculos} calculos
            </span>
          </div>
          {isGuestLawyer && showUpgradeButton && (
            <Link href="/oficina-virtual/guestlawyer">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                Verificar
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }
  
  // Version completa
  return (
    <Card className={`border-2 ${
      limiteAlcanzado 
        ? 'border-red-300 bg-red-50/50' 
        : cercaDelLimite 
          ? 'border-amber-300 bg-amber-50/50'
          : 'border-blue-200 bg-blue-50/30'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              {limiteAlcanzado ? (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-600" />
                </div>
              ) : cercaDelLimite ? (
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm">
                  {limiteAlcanzado 
                    ? 'Limites de cuenta alcanzados' 
                    : cercaDelLimite 
                      ? 'Cerca de tus limites'
                      : 'Uso de tu cuenta'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isGuestLawyer 
                    ? 'Abogado en verificacion - Acceso limitado'
                    : `Cuenta ${role}`}
                </p>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="grid grid-cols-2 gap-4">
              {/* Casos */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="w-3 h-3" />
                    Casos
                  </span>
                  <span className={`font-medium ${
                    casosPorcentaje >= 100 ? 'text-red-600' : 
                    casosPorcentaje >= 80 ? 'text-amber-600' : 'text-foreground'
                  }`}>
                    {casosActuales} / {maxCasos === Infinity ? '∞' : maxCasos}
                  </span>
                </div>
                <Progress 
                  value={casosPorcentaje} 
                  className={`h-2 ${
                    casosPorcentaje >= 100 ? '[&>div]:bg-red-500' : 
                    casosPorcentaje >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'
                  }`}
                />
              </div>
              
              {/* Calculos */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calculator className="w-3 h-3" />
                    Calculos
                  </span>
                  <span className={`font-medium ${
                    calculosPorcentaje >= 100 ? 'text-red-600' : 
                    calculosPorcentaje >= 80 ? 'text-amber-600' : 'text-foreground'
                  }`}>
                    {calculosActuales} / {maxCalculos === Infinity ? '∞' : maxCalculos}
                  </span>
                </div>
                <Progress 
                  value={calculosPorcentaje} 
                  className={`h-2 ${
                    calculosPorcentaje >= 100 ? '[&>div]:bg-red-500' : 
                    calculosPorcentaje >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-blue-500'
                  }`}
                />
              </div>
            </div>
            
            {/* Mensaje de upgrade */}
            {isGuestLawyer && (
              <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded border">
                {limiteAlcanzado 
                  ? 'Has alcanzado los limites de tu cuenta. Verifica tu cuenta como abogado para desbloquear acceso ilimitado a casos y calculos.'
                  : 'Verifica tu cuenta como abogado para desbloquear acceso ilimitado y todas las herramientas profesionales.'}
              </p>
            )}
          </div>
          
          {/* Boton de upgrade */}
          {isGuestLawyer && showUpgradeButton && (
            <div className="flex-shrink-0">
              <Link href="/oficina-virtual/guestlawyer">
                <Button 
                  className={`${
                    limiteAlcanzado 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Verificar cuenta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para mostrar cuando se alcanza el limite en un modal
export function LimitReachedModal({
  tipo,
  actual,
  limite,
  role,
  onClose
}: {
  tipo: 'caso' | 'calculo'
  actual: number
  limite: number
  role: string
  onClose: () => void
}) {
  const isGuestLawyer = role === 'guestlawyer'
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md border-red-200 bg-white">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-red-800">
              Limite de {tipo === 'caso' ? 'casos' : 'calculos'} alcanzado
            </h2>
            <p className="text-muted-foreground mt-1">
              Has usado {actual} de {limite} {tipo === 'caso' ? 'casos' : 'calculos'} disponibles
            </p>
          </div>
          
          {isGuestLawyer && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 font-medium">
                Verifica tu cuenta como abogado
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Desbloquea {tipo === 'caso' ? 'casos' : 'calculos'} ilimitados y todas las herramientas profesionales
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cerrar
            </Button>
            {isGuestLawyer && (
              <Link href="/oficina-virtual/guestlawyer" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Verificar ahora
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
