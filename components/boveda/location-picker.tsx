'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle, 
  Info,
  ExternalLink,
  Camera,
  Building2,
  FileText,
  ChevronRight
} from 'lucide-react'

interface LocationPickerProps {
  onSave: (locationData: LocationData) => void
  onClose: () => void
}

export interface LocationData {
  lat: number
  lng: number
  address?: string
  streetViewUrl: string
  mapsUrl: string
  timestamp: string
}

export function LocationPicker({ onSave, onClose }: LocationPickerProps) {
  const [step, setStep] = useState<'tutorial' | 'picker' | 'confirm'>('tutorial')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapsUrl, setMapsUrl] = useState('')

  // Obtener ubicacion actual como punto de inicio
  const getCurrentLocation = useCallback(() => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          // Abrir Google Maps en nueva ventana para que el usuario seleccione la ubicacion exacta
          const url = `https://www.google.com/maps/@${latitude},${longitude},18z`
          setMapsUrl(url)
          setLoading(false)
          setStep('picker')
        },
        () => {
          // Si no hay permiso, usar ubicacion por defecto (CDMX)
          setLocation({ lat: 19.4326, lng: -99.1332 })
          setMapsUrl('https://www.google.com/maps/@19.4326,-99.1332,18z')
          setLoading(false)
          setStep('picker')
        }
      )
    } else {
      setLocation({ lat: 19.4326, lng: -99.1332 })
      setMapsUrl('https://www.google.com/maps/@19.4326,-99.1332,18z')
      setLoading(false)
      setStep('picker')
    }
  }, [])

  // Manejar cuando el usuario ingresa coordenadas manualmente
  const handleCoordsChange = (coords: string) => {
    // Formato esperado: "19.4326, -99.1332" o URL de Google Maps
    const urlMatch = coords.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    const coordsMatch = coords.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    
    if (urlMatch) {
      setLocation({ lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) })
    } else if (coordsMatch) {
      setLocation({ lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) })
    }
  }

  // Guardar ubicacion
  const handleSave = () => {
    if (!location) return
    
    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`,
      mapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      timestamp: new Date().toISOString()
    }
    
    onSave(locationData)
  }

  return (
    <div className="bg-background rounded-xl shadow-lg border max-h-[85vh] overflow-hidden flex flex-col w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-orange-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-medium text-sm">Ubicacion del trabajo</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Tutorial */}
        {step === 'tutorial' && (
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-semibold text-base">Registra el domicilio del patron</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Esta ubicacion es crucial para tu caso laboral
              </p>
            </div>
            
            {/* Por que es importante */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Info className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">Por que es importante?</span>
              </div>
              <ul className="text-[11px] text-blue-600 space-y-1.5 ml-6">
                <li>El CCL (Centro de Conciliacion Laboral) necesita la direccion exacta del patron</li>
                <li>Se usara para enviar notificaciones oficiales y citatorios</li>
                <li>Una ubicacion incorrecta puede retrasar tu proceso</li>
                <li>Street View ayuda a verificar que el domicilio existe</li>
              </ul>
            </div>
            
            {/* Como funciona */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Como funciona:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Abre Google Maps</p>
                    <p className="text-[10px] text-muted-foreground">Busca la direccion exacta del trabajo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Usa Street View</p>
                    <p className="text-[10px] text-muted-foreground">Verifica la fachada del edificio</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Copia el enlace o coordenadas</p>
                    <p className="text-[10px] text-muted-foreground">Pegalo aqui para guardar</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Compatibilidad CCL */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">Compatibilidad CCL</span>
              </div>
              <p className="text-[10px] text-green-600">
                Esta informacion se usara automaticamente para llenar los formularios del Centro de Conciliacion Laboral (CCL) cuando inicies tu solicitud.
              </p>
            </div>
            
            <Button 
              onClick={getCurrentLocation} 
              disabled={loading}
              className="w-full h-10 gap-2 bg-orange-600 hover:bg-orange-700"
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
          </div>
        )}
        
        {/* Picker */}
        {step === 'picker' && (
          <div className="p-4 space-y-3">
            {/* Instrucciones compactas */}
            <div className="bg-amber-50 rounded-lg p-2 text-[11px] text-amber-700">
              <strong>Instrucciones:</strong> Abre Google Maps, busca el lugar de trabajo, 
              y pega el enlace o coordenadas aqui.
            </div>
            
            {/* Boton para abrir Maps */}
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Abrir Google Maps</p>
                  <p className="text-[10px] text-blue-600">Busca la ubicacion exacta</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </a>
            
            {/* Input para pegar enlace */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Pega el enlace o coordenadas:</label>
              <input
                type="text"
                placeholder="https://maps.google.com/... o 19.4326, -99.1332"
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                onChange={(e) => handleCoordsChange(e.target.value)}
              />
            </div>
            
            {/* Preview de ubicacion actual */}
            {location && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Ubicacion seleccionada:</span>
                  <span className="text-[10px] text-muted-foreground">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
                
                {/* Mini preview con links */}
                <div className="flex gap-2">
                  <a 
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] bg-background rounded border hover:bg-muted"
                  >
                    <MapPin className="w-3 h-3" />
                    Ver en Maps
                  </a>
                  <a 
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] bg-background rounded border hover:bg-muted"
                  >
                    <Camera className="w-3 h-3" />
                    Street View
                  </a>
                </div>
              </div>
            )}
            
            {/* Tip */}
            <p className="text-[10px] text-muted-foreground text-center">
              Tip: En Google Maps, haz clic derecho y selecciona "Que hay aqui?" para ver las coordenadas exactas.
            </p>
          </div>
        )}
        
        {/* Confirm */}
        {step === 'confirm' && location && (
          <div className="p-4 space-y-3">
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm">Ubicacion lista</h3>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
              <p><strong>Latitud:</strong> {location.lat.toFixed(6)}</p>
              <p><strong>Longitud:</strong> {location.lng.toFixed(6)}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {step === 'picker' && location && (
        <div className="p-3 border-t">
          <Button 
            onClick={handleSave}
            className="w-full h-10 gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Guardar ubicacion
          </Button>
        </div>
      )}
    </div>
  )
}
