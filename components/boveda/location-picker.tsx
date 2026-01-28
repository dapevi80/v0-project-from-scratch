'use client'

import React from "react"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle, 
  Building2,
  ChevronRight,
  Sparkles,
  Target,
  Eye
} from 'lucide-react'
import { actualizarUbicacionCaso } from '@/app/casos/actions'

interface LocationPickerProps {
  onSave: (locationData: LocationData) => void
  onClose: () => void
  casoId?: string
}

export interface LocationData {
  lat: number
  lng: number
  address?: string
  streetViewUrl: string
  mapsUrl: string
  timestamp: string
}

export function LocationPicker({ onSave, onClose, casoId }: LocationPickerProps) {
  const [step, setStep] = useState<'intro' | 'map' | 'streetview' | 'saving'>('intro')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Obtener ubicacion actual como punto de inicio
  const startLocationFlow = useCallback(() => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLoading(false)
          setStep('map')
        },
        () => {
          // Si no hay permiso, usar ubicacion por defecto (CDMX)
          setLocation({ lat: 19.4326, lng: -99.1332 })
          setLoading(false)
          setStep('map')
        }
      )
    } else {
      setLocation({ lat: 19.4326, lng: -99.1332 })
      setLoading(false)
      setStep('map')
    }
  }, [])

  // Manejar mensaje de Google Maps embebido
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Escuchar mensajes del iframe de Google Maps (si se implementa con API)
      if (event.data?.type === 'locationSelected') {
        setLocation(event.data.location)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Guardar ubicacion
  const handleSave = async () => {
    if (!location) return
    
    setStep('saving')
    
    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`,
      mapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      timestamp: new Date().toISOString()
    }
    
    // Si hay casoId, actualizar el caso directamente
    if (casoId) {
      await actualizarUbicacionCaso(casoId, locationData)
    }
    
    // Simular guardado
    await new Promise(r => setTimeout(r, 800))
    setSaved(true)
    
    // Esperar un momento y cerrar
    setTimeout(() => {
      onSave(locationData)
      onClose()
    }, 1000)
  }

  // Actualizar ubicacion desde el mapa
  const handleMapClick = (e: React.MouseEvent<HTMLIFrameElement>) => {
    // El iframe de Google Maps no permite capturar clicks directamente
    // El usuario debe usar el boton "Aqui es" despues de navegar
  }

  return (
    <div className="bg-background rounded-xl shadow-lg border overflow-hidden flex flex-col w-full max-w-sm max-h-[90vh]">
      {/* Header minimalista */}
      <div className="flex items-center justify-between p-2.5 border-b bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
            <MapPin className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm">Ubicacion del patron</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Intro animado */}
      {step === 'intro' && (
        <div className="flex-1 p-5 flex flex-col">
          {/* Animacion central */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="relative">
              {/* Circulos animados */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-20 h-20 rounded-full bg-orange-200/50" />
              </div>
              <div className="absolute inset-2 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-orange-300/50" />
              </div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="font-bold text-lg mt-6 text-center">Donde trabaja(ba)s?</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-[250px]">
              Selecciona la ubicacion exacta para que puedan notificar a tu patron
            </p>
          </div>
          
          {/* Pasos visuales */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Navega en el mapa</p>
                <p className="text-[10px] text-muted-foreground">Busca la direccion del trabajo</p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Verifica con Street View</p>
                <p className="text-[10px] text-muted-foreground">Confirma que es la fachada correcta</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Presiona "Aqui es"</p>
                <p className="text-[10px] text-muted-foreground">Se guarda automaticamente en tu caso</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          </div>
          
          {/* CTA */}
          <Button 
            onClick={startLocationFlow} 
            disabled={loading}
            className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Obteniendo ubicacion...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Comenzar
              </>
            )}
          </Button>
          
          {/* Nota CCL */}
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Esta ubicacion se usara para llenar tu solicitud del CCL
          </p>
        </div>
      )}
      
      {/* Mapa embebido */}
      {step === 'map' && location && (
        <div className="flex-1 flex flex-col">
          {/* Mapa de Google embebido */}
          <div className="relative flex-1 min-h-[300px]">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location.lat},${location.lng}&zoom=17`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Boton flotante "Aqui es" */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button 
                onClick={() => setStep('streetview')}
                className="h-11 px-6 gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl shadow-black/25 rounded-full"
              >
                <Eye className="w-4 h-4" />
                Ver Street View
              </Button>
            </div>
            
            {/* Instruccion flotante */}
            <div className="absolute top-3 left-3 right-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-xs">Navega hasta encontrar el lugar de trabajo</p>
              </div>
            </div>
          </div>
          
          {/* Input para buscar direccion */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar direccion..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    // Abrir busqueda en Google Maps
                    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(target.value)}`
                    window.open(searchUrl, '_blank')
                  }
                }}
              />
              <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Street View */}
      {step === 'streetview' && location && (
        <div className="flex-1 flex flex-col">
          {/* Street View embebido */}
          <div className="relative flex-1 min-h-[300px]">
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${location.lat},${location.lng}&heading=0&pitch=0&fov=90`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Boton flotante "Aqui es" */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button 
                onClick={handleSave}
                className="h-12 px-8 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl shadow-black/25 rounded-full text-base font-semibold animate-pulse"
              >
                <CheckCircle className="w-5 h-5" />
                Aqui es!
              </Button>
            </div>
            
            {/* Instruccion flotante */}
            <div className="absolute top-3 left-3 right-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500 shrink-0" />
                <p className="text-xs">Es esta la fachada del lugar de trabajo?</p>
              </div>
            </div>
            
            {/* Boton volver al mapa */}
            <button 
              onClick={() => setStep('map')}
              className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <MapPin className="w-4 h-4 text-orange-500" />
            </button>
          </div>
          
          {/* Info de ubicacion */}
          <div className="p-3 border-t bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Ubicacion seleccionada</span>
              </div>
              <span className="text-[10px] text-green-600 font-mono">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Guardando */}
      {step === 'saving' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {!saved ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-sm font-medium mt-4">Guardando ubicacion...</p>
              <p className="text-xs text-muted-foreground mt-1">Vinculando con tu caso</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium mt-4 text-green-700">Ubicacion guardada!</p>
              <p className="text-xs text-muted-foreground mt-1">Lista para tu solicitud CCL</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
