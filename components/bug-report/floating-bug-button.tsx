'use client'

import { useState } from 'react'
import { Bug, X, Send, Camera, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { crearReporteBug } from '@/app/bug-report/actions'
import { cn } from '@/lib/utils'

export function FloatingBugButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'funcionalidad' as 'ui' | 'funcionalidad' | 'rendimiento' | 'otro',
  })

  const handleSubmit = async () => {
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await crearReporteBug({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        pagina_url: window.location.href,
        categoria: formData.categoria,
      })

      if (result.success) {
        setSuccess(true)
        setFormData({ titulo: '', descripcion: '', categoria: 'funcionalidad' })
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 3000)
      } else {
        setError(result.error || 'Error al enviar el reporte')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'flex items-center gap-1.5 px-3 py-1.5',
          'bg-amber-500/90 hover:bg-amber-500 text-white',
          'rounded-full shadow-lg hover:shadow-xl',
          'transition-all duration-200 hover:scale-105',
          'text-xs font-medium',
          'backdrop-blur-sm'
        )}
      >
        <Bug className="h-3.5 w-3.5" />
        <span>Reportar</span>
        <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">
          +1 credito
        </Badge>
      </button>

      {/* Modal de reporte */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-amber-500" />
              Reportar un problema
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Gracias por tu reporte</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Recibiras 1 credito cuando revisemos tu reporte
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner Beta */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-amber-800">
                      Estamos en desarrollo beta
                    </p>
                    <p className="text-amber-700 mt-0.5">
                      Creciendo a la velocidad del despido. Tus reportes nos ayudan a mejorar. 
                      <span className="font-semibold"> Te regalamos 1 credito por falla reportada.</span>
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo del problema</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: El boton de guardar no funciona"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value: 'ui' | 'funcionalidad' | 'rendimiento' | 'otro') => 
                    setFormData(prev => ({ ...prev, categoria: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">Interfaz / Diseño</SelectItem>
                    <SelectItem value="funcionalidad">Funcionalidad</SelectItem>
                    <SelectItem value="rendimiento">Rendimiento / Lentitud</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe que paso, que esperabas que pasara, y los pasos para reproducir el problema..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  disabled={loading}
                  rows={4}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Pagina actual:</span>{' '}
                <code className="bg-muted px-1 rounded">
                  {typeof window !== 'undefined' ? window.location.pathname : '/'}
                </code>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar reporte
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
