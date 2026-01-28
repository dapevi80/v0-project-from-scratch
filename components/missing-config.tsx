'use client'

import { AlertTriangle, Settings, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MissingConfigProps {
  missingVars?: string[]
  context?: string
}

export function MissingConfig({ missingVars = [], context }: MissingConfigProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-amber-200 bg-amber-50/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl text-amber-900">Configuracion Pendiente</CardTitle>
          <CardDescription className="text-amber-700">
            {context || 'Esta funcionalidad requiere configuracion adicional'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingVars.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Variables de entorno faltantes:
              </p>
              <ul className="space-y-1">
                {missingVars.map((varName) => (
                  <li key={varName} className="flex items-center gap-2 text-sm text-amber-800">
                    <Settings className="w-3 h-3" />
                    <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                      {varName}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="text-center text-sm text-amber-700">
            <p>Contacta al administrador para completar la configuracion.</p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-700"
              asChild
            >
              <a href="/" className="flex items-center gap-1">
                Ir al inicio
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook para verificar configuracion antes de renderizar
 */
export function useConfigCheck(requiredVars: string[]): {
  isConfigured: boolean
  missingVars: string[]
} {
  const missingVars = requiredVars.filter(
    (key) => typeof window !== 'undefined' && !process.env[key]
  )
  
  return {
    isConfigured: missingVars.length === 0,
    missingVars
  }
}
