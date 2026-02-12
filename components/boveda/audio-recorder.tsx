'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MicOff } from 'lucide-react'

interface AudioRecorderProps {
  onSaved?: () => void
  onCancel?: () => void
}

export function AudioRecorder({ onSaved, onCancel }: AudioRecorderProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <MicOff className="w-4 h-4" />
          Grabaciones deshabilitadas
        </CardTitle>
        <CardDescription className="text-amber-700 text-xs">
          La bóveda solo admite PDFs e imágenes escaneadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-amber-700">
        Sube documentos legales, identificaciones y archivos generados por el CCL.
      </CardContent>
    </Card>
  )
}
