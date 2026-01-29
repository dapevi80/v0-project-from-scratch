'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Briefcase, Building2, Calendar, DollarSign, FileText, Loader2, User, Video, MapPin } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { crearCaso } from '../actions'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'

export default function NuevoCasoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    titulo: '',
    empresa_nombre: '',
    descripcion: '',
    fecha_despido: '',
    monto_reclamado: '',
    citado_tipo_persona: 'moral' as 'fisica' | 'moral',  // Por defecto moral (empresa)
    modalidad_conciliacion: 'remota' as 'presencial' | 'remota'  // Por defecto remota
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.titulo.trim() || !formData.empresa_nombre.trim()) {
      setError('El titulo y nombre de empresa son requeridos')
      return
    }
    
    setLoading(true)
    const res = await crearCaso({
      titulo: formData.titulo.trim(),
      empresa_nombre: formData.empresa_nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      fecha_despido: formData.fecha_despido || undefined,
      monto_reclamado: formData.monto_reclamado ? parseFloat(formData.monto_reclamado) : undefined,
      citado_tipo_persona: formData.citado_tipo_persona,
      modalidad_conciliacion: formData.modalidad_conciliacion
    })
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    
    if (res.data) {
      router.push(`/caso/${res.data.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/casos" className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Nuevo Caso</span>
            </div>
          </div>
          <AyudaUrgenteButton />
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crear nuevo caso</CardTitle>
            <CardDescription>
              Ingresa la informacion basica de tu caso de despido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}
              
              {/* Titulo */}
              <div className="space-y-2">
                <Label htmlFor="titulo" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Titulo del caso *
                </Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Despido injustificado marzo 2024"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              
              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="empresa" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nombre del demandado *
                </Label>
                <Input
                  id="empresa"
                  placeholder="Ej: Empresa S.A. de C.V. o Juan Perez"
                  value={formData.empresa_nombre}
                  onChange={(e) => setFormData({ ...formData, empresa_nombre: e.target.value })}
                  required
                />
              </div>

              {/* Tipo de persona del demandado */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Tipo de persona del demandado *
                </Label>
                <RadioGroup
                  value={formData.citado_tipo_persona}
                  onValueChange={(value: 'fisica' | 'moral') => 
                    setFormData({ ...formData, citado_tipo_persona: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moral" id="moral" />
                    <Label htmlFor="moral" className="font-normal cursor-pointer">
                      Persona Moral (empresa)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica" className="font-normal cursor-pointer">
                      Persona Fisica
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Selecciona si el demandado es una empresa (persona moral) o un individuo (persona fisica)
                </p>
              </div>

              {/* Modalidad de conciliacion */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Modalidad de conciliacion *
                </Label>
                <RadioGroup
                  value={formData.modalidad_conciliacion}
                  onValueChange={(value: 'presencial' | 'remota') => 
                    setFormData({ ...formData, modalidad_conciliacion: value })
                  }
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="remota" id="remota" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="remota" className="font-medium cursor-pointer flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-500" />
                        Conciliacion Remota (Recomendada)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Audiencia por videollamada. Requiere llamar al CCL para agendar confirmacion de solicitud.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="presencial" id="presencial" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="presencial" className="font-medium cursor-pointer flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        Conciliacion Presencial
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Debes acudir personalmente al CCL a confirmar la solicitud dentro de 3 dias habiles.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Fecha despido */}
              <div className="space-y-2">
                <Label htmlFor="fecha" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de despido
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha_despido}
                  onChange={(e) => setFormData({ ...formData, fecha_despido: e.target.value })}
                />
              </div>
              
              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="monto" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto reclamado (MXN)
                </Label>
                <Input
                  id="monto"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.monto_reclamado}
                  onChange={(e) => setFormData({ ...formData, monto_reclamado: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes usar la calculadora para estimar tu liquidacion
                </p>
              </div>
              
              {/* Descripcion */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion del caso</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe brevemente lo que paso..."
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href="/casos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear caso'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
