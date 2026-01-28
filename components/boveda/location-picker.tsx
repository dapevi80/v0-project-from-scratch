'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  X, 
  MapPin, 
  Loader2, 
  CheckCircle,
  Eye,
  ChevronRight,
  Search,
  RotateCcw,
  Camera,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw
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
  streetViewImageUrl: string
  mapsUrl: string
  timestamp: string
  heading?: number
  pitch?: number
}

export function LocationPicker({ onSave, onClose, casoId }: LocationPickerProps) {
  const [step, setStep] = useState<'intro' | 'search' | 'streetview' | 'confirm' | 'saving' | 'saved'>('intro')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Ubicacion seleccionada (coordenadas del lugar de trabajo)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  
  // Parametros de Street View para la fachada
  const [streetViewParams, setStreetViewParams] = useState({
    heading: 0,    // Direccion de la camara (0-360)
    pitch: 0,      // Inclinacion (-90 a 90)
    zoom: 1        // Zoom de Street View
  })
  
  const [savingMessage, setSavingMessage] = useState('Guardando ubicacion...')
  const [streetViewAvailable, setStreetViewAvailable] = useState(true)

  // Buscar direccion usando Nominatim (OpenStreetMap) - gratis y sin API key
  const searchAddress = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    setSearchError(null)
    
    try {
      // Agregar "Mexico" al query para mejorar resultados
      const query = searchQuery.includes('Mexico') ? searchQuery : `${searchQuery}, Mexico`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'mecorrieron.mx' } }
      )
      
      const results = await response.json()
      
      if (results && results.length > 0) {
        const result = results[0]
        setSelectedLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        })
        setSelectedAddress(result.display_name)
        setStreetViewParams({ heading: 0, pitch: 0, zoom: 1 })
        setStep('streetview')
      } else {
        setSearchError('No se encontro la direccion. Intenta ser mas especifico (calle, numero, colonia, ciudad).')
      }
    } catch (error) {
      setSearchError('Error al buscar. Verifica tu conexion e intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  // Ajustar la vista de Street View
  const adjustStreetView = (adjustment: 'left' | 'right' | 'up' | 'down' | 'zoomIn' | 'zoomOut' | 'reset') => {
    setStreetViewParams(prev => {
      switch (adjustment) {
        case 'left':
          return { ...prev, heading: (prev.heading - 30 + 360) % 360 }
        case 'right':
          return { ...prev, heading: (prev.heading + 30) % 360 }
        case 'up':
          return { ...prev, pitch: Math.min(prev.pitch + 15, 90) }
        case 'down':
          return { ...prev, pitch: Math.max(prev.pitch - 15, -90) }
        case 'zoomIn':
          return { ...prev, zoom: Math.min(prev.zoom + 0.5, 4) }
        case 'zoomOut':
          return { ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }
        case 'reset':
          return { heading: 0, pitch: 0, zoom: 1 }
        default:
          return prev
      }
    })
  }

  // URL de imagen estatica de Street View (esta se guarda)
  const getStreetViewImageUrl = useCallback(() => {
    if (!selectedLocation) return ''
    return `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${selectedLocation.lat},${selectedLocation.lng}&heading=${streetViewParams.heading}&pitch=${streetViewParams.pitch}&fov=${90 / streetViewParams.zoom}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`
  }, [selectedLocation, streetViewParams])

  // Guardar ubicacion y la imagen de Street View
  const handleSave = async () => {
    if (!selectedLocation) return
    
    setStep('saving')
    setSavingMessage('Guardando ubicacion...')
    
    const timestamp = new Date().toISOString()
    const streetViewImageUrl = getStreetViewImageUrl()
    
    const locationData: LocationData = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedAddress,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedLocation.lat},${selectedLocation.lng}&heading=${streetViewParams.heading}&pitch=${streetViewParams.pitch}`,
      streetViewImageUrl,
      mapsUrl: `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,
      timestamp,
      heading: streetViewParams.heading,
      pitch: streetViewParams.pitch
    }
    
    try {
      // 1. Actualizar el caso con la ubicacion
      await actualizarUbicacionCaso(casoId || null, locationData)
      
      // 2. Generar PDF "Guia para Notificador" con la imagen de Street View correcta
      setSavingMessage('Generando guia PDF con fachada...')
      const pdfBlob = await generateNotifierGuidePDF({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        timestamp,
        address: selectedAddress,
        heading: streetViewParams.heading,
        pitch: streetViewParams.pitch,
        streetViewImageUrl
      })
      
      // 3. Guardar PDF en la boveda
      setSavingMessage('Guardando en boveda...')
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

  return (
    <div className="bg-background overflow-hidden w-full">
      
      {/* ===== INTRO ===== */}
      {step === 'intro' && (
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-4 overflow-hidden shrink-0">
            <button 
              onClick={onClose} 
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Fachada del trabajo</h2>
                <p className="text-white/80 text-xs">Para notificaciones legales</p>
              </div>
            </div>
          </div>
          
          {/* Explicacion */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Vamos a guardar la ubicacion exacta y foto de la fachada del lugar de trabajo
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium">Busca la direccion</p>
                  <p className="text-xs text-muted-foreground">Escribe la calle y numero</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium">Ajusta la vista</p>
                  <p className="text-xs text-muted-foreground">Gira hasta ver la fachada correcta</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium">Guarda la ubicacion</p>
                  <p className="text-xs text-muted-foreground">Se crea una guia PDF automatica</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boton */}
          <div className="p-4 border-t bg-background shrink-0">
            <Button 
              onClick={() => setStep('search')}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold gap-2"
            >
              <Search className="w-5 h-5" />
              Buscar direccion
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== BUSQUEDA ===== */}
      {step === 'search' && (
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <button onClick={() => setStep('intro')} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium flex-1">Buscar direccion del trabajo</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Buscador */}
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Av. Insurgentes 1500, Roma Norte, CDMX"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                className="flex-1"
                autoFocus
              />
              <Button 
                onClick={searchAddress}
                disabled={searching || !searchQuery.trim()}
                className="shrink-0"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            
            {searchError && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{searchError}</p>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Tips para mejor resultado:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Incluye calle y numero</li>
                <li>Agrega colonia o fraccionamiento</li>
                <li>Incluye ciudad y estado</li>
              </ul>
            </div>
          </div>
          
          {/* Mapa de preview si hay ubicacion */}
          {selectedLocation && (
            <div className="flex-1 p-4 pt-0">
              <div className="relative h-40 rounded-lg overflow-hidden border">
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedLocation.lat},${selectedLocation.lng}&zoom=17&size=400x200&markers=color:red%7C${selectedLocation.lat},${selectedLocation.lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
                  alt="Mapa"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">{selectedAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== STREET VIEW - AJUSTAR FACHADA ===== */}
      {step === 'streetview' && selectedLocation && (
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center gap-2 p-2 border-b bg-muted/30 shrink-0">
            <button onClick={() => setStep('search')} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Ajusta la vista de la fachada</p>
              <p className="text-[10px] text-muted-foreground truncate">{selectedAddress}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Street View con controles */}
          <div className="relative flex-1 min-h-[200px] bg-black">
            {/* Imagen de Street View */}
            <img 
              src={getStreetViewImageUrl() || "/placeholder.svg"}
              alt="Vista de calle"
              className="w-full h-full object-cover"
              onError={() => setStreetViewAvailable(false)}
              onLoad={() => setStreetViewAvailable(true)}
            />
            
            {!streetViewAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center p-4">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Street View no disponible</p>
                  <p className="text-xs text-muted-foreground">No hay imagenes de esta ubicacion</p>
                </div>
              </div>
            )}
            
            {/* Controles de navegacion */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-xl p-1.5">
              <button 
                onClick={() => adjustStreetView('left')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Girar izquierda"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => adjustStreetView('up')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Mirar arriba"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => adjustStreetView('down')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Mirar abajo"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button 
                onClick={() => adjustStreetView('right')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Girar derecha"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-white/20" />
              <button 
                onClick={() => adjustStreetView('zoomIn')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => adjustStreetView('zoomOut')}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
            
            {/* Indicador de direccion */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
              {streetViewParams.heading}°
            </div>
          </div>
          
          {/* Info y boton confirmar */}
          <div className="p-3 space-y-2 bg-green-50 border-t border-green-100 shrink-0">
            <p className="text-xs text-green-700 text-center">
              Usa los controles para girar hasta ver la fachada del edificio
            </p>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => adjustStreetView('reset')}
                className="flex-1 h-10"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reiniciar
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                className="flex-1 h-10 bg-green-600 hover:bg-green-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                Esta es!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRMACION FINAL ===== */}
      {step === 'confirm' && selectedLocation && (
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <button onClick={() => setStep('streetview')} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium flex-1">Confirmar ubicacion</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Preview de la fachada que se guardara */}
            <div className="rounded-lg overflow-hidden border-2 border-green-500">
              <img 
                src={getStreetViewImageUrl() || "/placeholder.svg"}
                alt="Fachada seleccionada"
                className="w-full h-48 object-cover"
              />
            </div>
            
            {/* Direccion */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Direccion:</p>
              <p className="text-sm font-medium">{selectedAddress}</p>
            </div>
            
            {/* Coordenadas */}
            <div className="flex gap-2">
              <div className="flex-1 p-2 bg-muted rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Latitud</p>
                <p className="text-xs font-mono">{selectedLocation.lat.toFixed(6)}</p>
              </div>
              <div className="flex-1 p-2 bg-muted rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Longitud</p>
                <p className="text-xs font-mono">{selectedLocation.lng.toFixed(6)}</p>
              </div>
              <div className="flex-1 p-2 bg-muted rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Direccion camara</p>
                <p className="text-xs font-mono">{streetViewParams.heading}°</p>
              </div>
            </div>
            
            {/* Que se guardara */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-2">Se guardara:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Coordenadas exactas del lugar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Imagen de la fachada (esta vista)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> PDF guia para notificador
                </li>
              </ul>
            </div>
          </div>
          
          {/* Boton guardar */}
          <div className="p-4 border-t bg-background shrink-0">
            <Button 
              onClick={handleSave}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg gap-2 shadow-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Guardar ubicacion
            </Button>
          </div>
        </div>
      )}

      {/* ===== GUARDANDO ===== */}
      {step === 'saving' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="font-medium mt-4">{savingMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">Esto puede tardar unos segundos...</p>
        </div>
      )}

      {/* ===== GUARDADO ===== */}
      {step === 'saved' && (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold text-green-600 mt-4 text-lg">Listo!</p>
          <p className="text-sm text-muted-foreground text-center">Ubicacion y fachada guardadas</p>
          <p className="text-xs text-green-600 mt-1">Guia para notificador creada</p>
        </div>
      )}
    </div>
  )
}
