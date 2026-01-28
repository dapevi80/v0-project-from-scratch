'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  MapPin, 
  Loader2, 
  CheckCircle,
  Navigation,
  Eye,
  ChevronRight
} from 'lucide-react'
import { actualizarUbicacionCaso } from '@/app/casos/actions'
import { subirDocumento } from '@/app/boveda/actions'
import { generateNotifierGuidePDF, pdfBlobToBase64 } from '@/lib/generate-notifier-guide-pdf'

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [savingMessage, setSavingMessage] = useState('Guardando ubicacion...')

  // Obtener ubicacion del usuario como punto de partida
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          setSelectedLocation(loc) // Punto inicial, el usuario lo cambiara
          setLoadingLocation(false)
        },
        () => {
          // Si falla, usar ubicacion por defecto (CDMX)
          const defaultLoc = { lat: 19.4326, lng: -99.1332 }
          setUserLocation(defaultLoc)
          setSelectedLocation(defaultLoc)
          setLoadingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // Guardar ubicacion y generar PDF
  const handleSave = async () => {
    if (!selectedLocation) return
    
    setStep('saving')
    setSavingMessage('Guardando ubicacion...')
    
    const timestamp = new Date().toISOString()
    const locationData: LocationData = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedLocation.lat},${selectedLocation.lng}`,
      mapsUrl: `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
      timestamp
    }
    
    try {
      // 1. Actualizar el caso con la ubicacion
      await actualizarUbicacionCaso(casoId || null, locationData)
      
      // 2. Generar PDF "Guia para Notificador"
      setSavingMessage('Generando guia PDF...')
      const pdfBlob = await generateNotifierGuidePDF({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timestamp
      })
      
      // 3. Guardar PDF en la boveda
      setSavingMessage('Guardando guia en boveda...')
      const pdfBase64 = await pdfBlobToBase64(pdfBlob)
      await subirDocumento({
        archivo: pdfBase64,
        nombre: 'Guia para Notificador - Ubicacion del trabajo',
        nombreOriginal: `guia_notificador_${Date.now()}.pdf`,
        categoria: 'foto_lugar',
        mimeType: 'application/pdf',
        tamanioBytes: pdfBlob.size,
        metadata: locationData
      })
      
      setStep('saved')
      setTimeout(() => {
        onSave(locationData)
      }, 1500)
    } catch (error) {
      console.error('Error guardando ubicacion:', error)
      setStep('streetview')
    }
  }

  // Cuando el usuario mueve el mapa, actualizar coordenadas del centro
  const handleMapMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'mapCenter') {
      setSelectedLocation({ lat: event.data.lat, lng: event.data.lng })
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMapMessage)
    return () => window.removeEventListener('message', handleMapMessage)
  }, [])

  return (
    <div className="bg-background overflow-hidden w-full">
      
      {/* ===== INTRO - Tutorial visual ===== */}
      {step === 'intro' && (
        <div className="flex flex-col h-full max-h-[75vh]">
          {/* Header compacto */}
          <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-4 overflow-hidden shrink-0">
            <div className="absolute top-2 right-8 w-12 h-12 bg-white/10 rounded-full animate-pulse" />
            
            <button 
              onClick={onClose} 
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ubicacion del trabajo</h2>
                <p className="text-white/80 text-xs">Para notificaciones del CCL</p>
              </div>
            </div>
          </div>
          
          {/* Pasos - scrolleable si es necesario */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground text-center">Como funciona:</p>
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
              <p className="text-xs flex-1"><b>Navega el mapa</b> - arrastra y pellizca</p>
              <Navigation className="w-4 h-4 text-blue-500 animate-pulse" />
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <p className="text-xs flex-1"><b>Ver fachada</b> - confirma con Street View</p>
              <Eye className="w-4 h-4 text-purple-500" />
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
              <p className="text-xs flex-1"><b>Presiona "Aqui es!"</b> - guarda ubicacion</p>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
          
          {/* Boton fijo abajo */}
          <div className="p-3 border-t bg-background shrink-0">
            <Button 
              onClick={() => setStep('map')}
              disabled={loadingLocation}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold gap-2"
            >
              {loadingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Abrir mapa
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ===== MAPA INTERACTIVO ===== */}
      {step === 'map' && selectedLocation && (
        <>
          {/* Header compacto */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <span className="text-sm font-medium">Ubica el lugar de trabajo</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mapa embebido - interactivo */}
          <div className="relative h-64 bg-muted">
            <iframe
              src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${selectedLocation.lat},${selectedLocation.lng}&zoom=16&maptype=roadmap`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Pin central fijo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" style={{ transform: 'translateY(-20px)' }} />
            </div>
            
            {/* Instruccion */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs text-center py-1.5 px-3 rounded-lg">
              Mueve el mapa para centrar el pin en el trabajo
            </div>
          </div>
          
          {/* Coordenadas actuales */}
          <div className="p-2 bg-muted/50 border-b text-center">
            <p className="text-[10px] text-muted-foreground font-mono">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
          
          {/* Boton ver fachada */}
          <div className="p-3 space-y-2">
            <Button 
              onClick={() => setStep('streetview')}
              variant="outline"
              className="w-full h-10 gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            >
              <Eye className="w-4 h-4" />
              Ver fachada (Street View)
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground">
              Verifica que sea el edificio correcto
            </p>
          </div>
        </>
      )}

      {/* ===== STREET VIEW ===== */}
      {step === 'streetview' && selectedLocation && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <button 
              onClick={() => setStep('map')} 
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              ← Volver al mapa
            </button>
            <span className="text-sm font-medium">Es esta la fachada?</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Street View embebido */}
          <div className="relative h-56 bg-black">
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${selectedLocation.lat},${selectedLocation.lng}&heading=0&pitch=0&fov=90`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          </div>
          
          {/* Confirmacion */}
          <div className="p-3 bg-green-50 border-t border-green-100">
            <p className="text-xs text-green-700 text-center mb-3">
              Si esta es la ubicacion correcta del trabajo:
            </p>
            
            <Button 
              onClick={handleSave}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg gap-2 shadow-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Aqui es!
            </Button>
          </div>
        </>
      )}

      {/* ===== GUARDANDO ===== */}
      {step === 'saving' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="font-medium mt-4">{savingMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">Creando guia para notificador...</p>
        </div>
      )}

      {/* ===== GUARDADO ===== */}
      {step === 'saved' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold text-green-600 mt-4 text-lg">Listo!</p>
          <p className="text-sm text-muted-foreground text-center">Ubicacion guardada</p>
          <p className="text-xs text-green-600 mt-1">Guia para notificador creada</p>
        </div>
      )}
    </div>
  )
}
