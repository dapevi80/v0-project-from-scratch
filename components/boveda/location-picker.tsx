'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  MapPin, 
  Navigation,
  Loader2, 
  CheckCircle, 
  Building2,
  ChevronRight,
  Eye,
  ArrowLeft
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
  const [step, setStep] = useState<'intro' | 'map' | 'streetview' | 'saving' | 'saved'>('intro')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)

  // Obtener ubicacion GPS
  const startLocationFlow = useCallback(() => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
          setLoading(false)
          setStep('map')
        },
        () => {
          // Default: CDMX
          setLocation({ lat: 19.4326, lng: -99.1332 })
          setLoading(false)
          setStep('map')
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    } else {
      setLocation({ lat: 19.4326, lng: -99.1332 })
      setLoading(false)
      setStep('map')
    }
  }, [])

  // Guardar ubicacion directamente en el caso
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
    
    try {
      await actualizarUbicacionCaso(casoId || null, locationData)
      setStep('saved')
      setTimeout(() => {
        onSave(locationData)
      }, 1200)
    } catch {
      setStep('streetview')
    }
  }

  return (
    <div className="bg-background rounded-2xl shadow-2xl border overflow-hidden w-full max-w-sm">
      
      {/* ===== INTRO ===== */}
      {step === 'intro' && (
        <>
          {/* Header con gradiente y animacion */}
          <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 overflow-hidden">
            {/* Burbujas animadas */}
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            {/* Cerrar */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            {/* Icono animado */}
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 bg-white/30 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Building2 className="w-10 h-10 text-white drop-shadow" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white text-center">Ubicacion del trabajo</h2>
            <p className="text-white/80 text-sm text-center mt-1">Para notificar a tu exempleador</p>
          </div>
          
          {/* Contenido */}
          <div className="p-5 space-y-4">
            {/* Por que importa */}
            <div className="space-y-2">
              {[
                { icon: Navigation, text: 'Enviar citatorios oficiales', color: 'bg-blue-100 text-blue-600' },
                { icon: Eye, text: 'Verificar que el domicilio existe', color: 'bg-amber-100 text-amber-600' },
                { icon: CheckCircle, text: 'Requerido por el CCL', color: 'bg-green-100 text-green-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            
            {/* Flujo visual */}
            <div className="flex items-center justify-center gap-1 py-2 bg-muted/50 rounded-lg">
              <div className="text-center px-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-[9px] text-muted-foreground">Mapa</span>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground animate-pulse" />
              <div className="text-center px-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-[9px] text-muted-foreground">Street View</span>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground animate-pulse" />
              <div className="text-center px-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-[9px] text-muted-foreground">Guardar</span>
              </div>
            </div>
            
            {/* Boton */}
            <Button 
              onClick={startLocationFlow} 
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-base font-semibold shadow-lg shadow-orange-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Obteniendo ubicacion...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5 mr-2" />
                  Comenzar
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* ===== MAPA ===== */}
      {step === 'map' && location && (
        <>
          {/* Mapa embebido */}
          <div className="relative h-[350px]">
            <iframe
              src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=17&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
            
            {/* Instruccion */}
            <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-center">Navega y encuentra el lugar de trabajo</p>
            </div>
            
            {/* Cerrar */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Boton flotante */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button 
                onClick={() => setStep('streetview')}
                className="h-11 px-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver fachada
              </Button>
            </div>
          </div>
          
          {/* Coordenadas */}
          <div className="p-3 bg-muted/30 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Coordenadas:</span>
            <span className="text-xs font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
          </div>
        </>
      )}

      {/* ===== STREET VIEW ===== */}
      {step === 'streetview' && location && (
        <>
          {/* Street View embebido */}
          <div className="relative h-[350px]">
            <iframe
              src={`https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1s!2m2!1d${location.lat}!2d${location.lng}!3f0!4f0!5f0.7820865974627469`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
            
            {/* Instruccion */}
            <div className="absolute top-3 left-3 right-12 bg-white/95 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-center">Es esta la fachada correcta?</p>
            </div>
            
            {/* Volver al mapa */}
            <button 
              onClick={() => setStep('map')} 
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            {/* BOTON AQUI ES */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button 
                onClick={handleSave}
                className="h-14 px-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold shadow-2xl shadow-green-500/40 gap-2 animate-pulse"
              >
                <CheckCircle className="w-6 h-6" />
                Aqui es!
              </Button>
            </div>
          </div>
          
          {/* Info */}
          <div className="p-3 bg-green-50 border-t border-green-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700">Ubicacion lista para guardar</span>
          </div>
        </>
      )}

      {/* ===== GUARDANDO ===== */}
      {step === 'saving' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-3 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="font-medium mt-4">Guardando ubicacion...</p>
          <p className="text-xs text-muted-foreground mt-1">Vinculando a tu caso</p>
        </div>
      )}

      {/* ===== GUARDADO ===== */}
      {step === 'saved' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <p className="font-semibold text-green-600 mt-4 text-lg">Ubicacion guardada</p>
          <p className="text-xs text-muted-foreground mt-1">Se vinculo a tu caso</p>
        </div>
      )}
    </div>
  )
}
