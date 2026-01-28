'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  X, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  Building2,
  Search,
  ExternalLink,
  ArrowLeft,
  Map
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
  const [step, setStep] = useState<'search' | 'confirm' | 'saving' | 'saved'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [searching, setSearching] = useState(false)

  // Buscar direccion usando Nominatim (OpenStreetMap - gratis)
  const searchAddress = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=mx`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        setLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        })
        setStep('confirm')
      } else {
        alert('No se encontro la direccion. Intenta con mas detalles.')
      }
    } catch {
      alert('Error al buscar. Verifica tu conexion.')
    } finally {
      setSearching(false)
    }
  }

  // Guardar ubicacion
  const handleSave = async () => {
    if (!location) return
    
    setStep('saving')
    
    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`,
      mapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      timestamp: new Date().toISOString()
    }
    
    try {
      const result = await actualizarUbicacionCaso(casoId || null, locationData)
      if (result.error) {
        console.log('[v0] Error guardando ubicacion:', result.error)
      }
      setStep('saved')
      setTimeout(() => {
        onSave(locationData)
      }, 1500)
    } catch (err) {
      console.log('[v0] Error:', err)
      setStep('confirm')
    }
  }

  // Abrir Google Maps para verificar
  const openGoogleMaps = () => {
    if (!location) return
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')
  }

  // Abrir Street View
  const openStreetView = () => {
    if (!location) return
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`, '_blank')
  }

  return (
    <div className="bg-background rounded-xl shadow-xl border overflow-hidden w-full">
      
      {/* ===== BUSQUEDA ===== */}
      {step === 'search' && (
        <>
          {/* Header con animacion */}
          <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-5">
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ubicacion del trabajo</h2>
                <p className="text-white/80 text-xs">Para notificaciones del CCL</p>
              </div>
            </div>
          </div>
          
          {/* Busqueda */}
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion del lugar de trabajo</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: Av. Reforma 123, CDMX"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                  className="flex-1"
                />
                <Button 
                  onClick={searchAddress} 
                  disabled={searching || !searchQuery.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Escribe la direccion completa: calle, numero, colonia, ciudad
              </p>
            </div>
            
            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-amber-800">Por que es importante?</p>
              <ul className="text-[10px] text-amber-700 space-y-0.5">
                <li>- Se usara para enviar citatorios oficiales</li>
                <li>- El CCL verificara que el domicilio exista</li>
                <li>- Una direccion incorrecta retrasa tu proceso</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ===== CONFIRMAR ===== */}
      {step === 'confirm' && location && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <button 
              onClick={() => setStep('search')} 
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">Confirmar ubicacion</span>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mapa estatico */}
          <div className="relative aspect-video bg-muted">
            <img 
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=17&size=400x250&markers=color:red%7C${location.lat},${location.lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
              alt="Mapa"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback a OpenStreetMap si falla Google
                (e.target as HTMLImageElement).src = `https://staticmap.openstreetmap.de/staticmap.php?center=${location.lat},${location.lng}&zoom=17&size=400x250&markers=${location.lat},${location.lng},red`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" style={{ transform: 'translateY(-50%)' }} />
            </div>
          </div>
          
          {/* Direccion */}
          <div className="p-3 bg-muted/30 border-b">
            <p className="text-xs text-muted-foreground mb-1">Direccion encontrada:</p>
            <p className="text-sm font-medium line-clamp-2">{location.address}</p>
          </div>
          
          {/* Botones de verificacion */}
          <div className="p-3 space-y-2">
            <p className="text-xs text-center text-muted-foreground mb-2">Verifica que sea el lugar correcto:</p>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openGoogleMaps}
                className="gap-1.5 text-xs bg-transparent"
              >
                <Map className="w-3.5 h-3.5" />
                Ver en Maps
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openStreetView}
                className="gap-1.5 text-xs bg-transparent"
              >
                <Building2 className="w-3.5 h-3.5" />
                Street View
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Boton guardar */}
            <Button 
              onClick={handleSave}
              className="w-full h-11 mt-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Si, esta es la ubicacion
            </Button>
            
            {/* Buscar otra */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('search')}
              className="w-full text-xs text-muted-foreground"
            >
              Buscar otra direccion
            </Button>
          </div>
        </>
      )}

      {/* ===== GUARDANDO ===== */}
      {step === 'saving' && (
        <div className="p-10 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="font-medium mt-4">Guardando...</p>
          <p className="text-xs text-muted-foreground">Vinculando a tu caso</p>
        </div>
      )}

      {/* ===== GUARDADO ===== */}
      {step === 'saved' && (
        <div className="p-10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="font-semibold text-green-600 mt-4">Ubicacion guardada</p>
          <p className="text-xs text-muted-foreground">Se vinculo a tu caso</p>
        </div>
      )}
    </div>
  )
}
