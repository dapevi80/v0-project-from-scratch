'use client'

import React from "react"

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  ImageIcon, 
  Video, 
  FileText, 
  Music2,
  CreditCard,
  X,
  Loader2,
  CheckCircle,
  Camera,
  File,
  AlertCircle,
  PenLine,
  Home,
  FileCheck,
  MapPin,
  Mic,
  Phone,
  DollarSign,
  FileSignature,
  Building2,
  Scale,
  Gavel,
  FileX,
  FileCheck2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Navigation
} from 'lucide-react'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'

// Categorias expandidas organizadas por grupo
const CATEGORIAS_SUGERIDAS = [
  // Documentos principales
  { value: 'contrato_laboral', label: 'Contrato', icon: PenLine, color: 'bg-blue-100 text-blue-600' },
  { value: 'hojas_firmadas', label: 'Hojas firmadas', icon: FileSignature, color: 'bg-amber-100 text-amber-600' },
  { value: 'recibo_nomina', label: 'Nomina', icon: Receipt, color: 'bg-green-100 text-green-600' },
  { value: 'recibo_dinero', label: 'Recibo', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
  
  // Evidencias multimedia
  { value: 'evidencia_foto', label: 'Fotos', icon: ImageIcon, color: 'bg-purple-100 text-purple-600' },
  { value: 'evidencia_video', label: 'Video', icon: Video, color: 'bg-pink-100 text-pink-600' },
  { value: 'video_despido', label: 'Video despido', icon: Video, color: 'bg-red-100 text-red-600' },
  { value: 'evidencia_audio', label: 'Audio', icon: Music2, color: 'bg-orange-100 text-orange-600' },
  { value: 'grabacion_llamada', label: 'Llamada', icon: Phone, color: 'bg-cyan-100 text-cyan-600' },
  
  // Identificaciones
  { value: 'ine_frente', label: 'INE', icon: CreditCard, color: 'bg-slate-100 text-slate-600' },
  { value: 'pasaporte', label: 'Pasaporte', icon: FileCheck, color: 'bg-indigo-100 text-indigo-600' },
  
  // Proceso legal
  { value: 'solicitud_conciliacion', label: 'Solicitud', icon: FileText, color: 'bg-sky-100 text-sky-600' },
  { value: 'notificacion', label: 'Notificacion', icon: FileText, color: 'bg-violet-100 text-violet-600' },
  { value: 'acuse', label: 'Acuse', icon: FileCheck2, color: 'bg-teal-100 text-teal-600' },
  { value: 'expediente', label: 'Expediente', icon: FileText, color: 'bg-gray-100 text-gray-600' },
  
  // Audiencia y conciliacion
  { value: 'foto_lugar', label: 'Lugar trabajo', icon: Building2, color: 'bg-stone-100 text-stone-600' },
  { value: 'acta_audiencia', label: 'Acta audiencia', icon: Scale, color: 'bg-amber-100 text-amber-700' },
  { value: 'acta_conciliacion', label: 'Acta conciliacion', icon: FileCheck2, color: 'bg-green-100 text-green-700' },
  { value: 'constancia_no_conciliacion', label: 'No conciliacion', icon: FileX, color: 'bg-red-100 text-red-700' },
  
  // Resolucion
  { value: 'convenio', label: 'Convenio', icon: FileSignature, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'sentencia', label: 'Sentencia', icon: Gavel, color: 'bg-purple-100 text-purple-700' },
  
  // Domicilio
  { value: 'comprobante_domicilio', label: 'Domicilio', icon: Home, color: 'bg-rose-100 text-rose-600' },
  
  // Otro
  { value: 'otro', label: 'Otro', icon: File, color: 'bg-gray-100 text-gray-500' },
] as const

interface FileToUpload {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface DocumentUploaderProps {
  onUploaded?: () => void
  onClose?: () => void
  defaultCategoria?: CategoriaDocumento
}

export function DocumentUploader({ onUploaded, onClose, defaultCategoria }: DocumentUploaderProps) {
  const [categoria, setCategoria] = useState<CategoriaDocumento>(defaultCategoria || 'otro')
  const [files, setFiles] = useState<FileToUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (defaultCategoria) {
      setCategoria(defaultCategoria)
    }
  }, [defaultCategoria])

  // Scroll del carrusel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Obtener ubicacion actual
  const getCurrentLocation = () => {
    setLoadingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLoadingLocation(false)
          setShowLocationPicker(true)
        },
        (error) => {
          console.error('Error obteniendo ubicacion:', error)
          setLoadingLocation(false)
          alert('No se pudo obtener la ubicacion. Verifica los permisos.')
        }
      )
    } else {
      setLoadingLocation(false)
      alert('Tu navegador no soporta geolocalizacion')
    }
  }

  // Guardar ubicacion como documento
  const saveLocation = async () => {
    if (!location) return
    
    const locationData = {
      type: 'ubicacion_trabajo',
      coordinates: location,
      timestamp: new Date().toISOString(),
      googleMapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
      streetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`
    }
    
    // Crear un archivo JSON con la ubicacion
    const blob = new Blob([JSON.stringify(locationData, null, 2)], { type: 'application/json' })
    const file = new File([blob], `ubicacion_trabajo_${Date.now()}.json`, { type: 'application/json' })
    
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        resolve(dataUrl.split(',')[1])
      }
      reader.onerror = reject
    })
    reader.readAsDataURL(file)
    const base64 = await base64Promise
    
    const result = await subirDocumento({
      archivo: base64,
      nombre: 'Ubicacion del lugar de trabajo',
      nombreOriginal: file.name,
      categoria: 'foto_lugar' as CategoriaDocumento,
      mimeType: 'application/json',
      tamanioBytes: file.size,
      metadata: locationData
    })
    
    if (result.success) {
      setShowLocationPicker(false)
      setLocation(null)
      onUploaded?.()
    }
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    
    const newFiles: FileToUpload[] = Array.from(selectedFiles).map(file => {
      const fileObj: FileToUpload = {
        file,
        progress: 0,
        status: 'pending'
      }
      
      if (file.type.startsWith('image/')) {
        fileObj.preview = URL.createObjectURL(file)
      }
      
      return fileObj
    })
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return
    
    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'success') continue
      
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 0 }
        return newFiles
      })
      
      try {
        const file = files[i].file
        
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const dataUrl = reader.result as string
            resolve(dataUrl.split(',')[1])
          }
          reader.onerror = reject
        })
        reader.readAsDataURL(file)
        const base64 = await base64Promise
        
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i] = { ...newFiles[i], progress: 50 }
          return newFiles
        })
        
        const result = await subirDocumento({
          archivo: base64,
          nombre: file.name.split('.')[0],
          nombreOriginal: file.name,
          categoria,
          mimeType: file.type,
          tamanioBytes: file.size,
          metadata: { uploadedAt: new Date().toISOString() }
        })
        
        if (result.success) {
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = { ...newFiles[i], status: 'success', progress: 100 }
            return newFiles
          })
        } else {
          throw new Error(result.error || 'Error al subir')
        }
        
      } catch (error) {
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i] = { 
            ...newFiles[i], 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          }
          return newFiles
        })
      }
    }
    
    setUploading(false)
  }, [files, categoria])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const categoriaActual = CATEGORIAS_SUGERIDAS.find(c => c.value === categoria)

  return (
    <div 
      className="bg-background rounded-xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col w-full max-w-md"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {categoriaActual && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${categoriaActual.color}`}>
              <categoriaActual.icon className="w-3 h-3" />
            </div>
          )}
          <span className="font-medium text-sm">{categoriaActual?.label || 'Subir archivo'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Inputs ocultos */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      {/* Carrusel de sugerencias */}
      <div className="relative border-b">
        <button 
          onClick={() => scrollCarousel('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-background/80 rounded-full shadow flex items-center justify-center hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div 
          ref={carouselRef}
          className="flex gap-1 p-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIAS_SUGERIDAS.map(cat => {
            const Icon = cat.icon
            const isSelected = categoria === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setCategoria(cat.value as CategoriaDocumento)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all shrink-0 min-w-[52px]
                  ${isSelected ? `${cat.color} ring-1 ring-current` : 'hover:bg-muted'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/50' : cat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] leading-tight text-center max-w-[48px] truncate">{cat.label}</span>
              </button>
            )
          })}
        </div>
        
        <button 
          onClick={() => scrollCarousel('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-background/80 rounded-full shadow flex items-center justify-center hover:bg-muted"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Contenido */}
      <div className={`flex-1 overflow-y-auto p-3 ${dragActive ? 'bg-primary/5' : ''}`}>
        
        {/* Modal de ubicacion */}
        {showLocationPicker && location && (
          <div className="mb-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Ubicacion guardada</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </div>
            <div className="flex gap-2">
              <a 
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
              >
                Ver Street View
              </a>
              <button
                onClick={saveLocation}
                className="flex-1 text-xs py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Guardar ubicacion
              </button>
            </div>
          </div>
        )}

        {/* Zona de drop/seleccion */}
        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}
          >
            {/* Acciones rapidas */}
            <div className="flex justify-center gap-3 mb-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                title="Tomar foto"
              >
                <Camera className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Elegir archivo"
              >
                <Upload className="w-5 h-5 text-primary" />
              </button>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors disabled:opacity-50"
                title="Guardar ubicacion"
              >
                {loadingLocation ? (
                  <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5 text-orange-600" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {dragActive ? 'Suelta aqui' : 'Foto | Archivo | Ubicacion'}
            </p>
          </div>
        ) : (
          /* Lista de archivos */
          <div className="space-y-1.5">
            {files.map((fileObj, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                {fileObj.preview ? (
                  <img src={fileObj.preview || "/placeholder.svg"} alt="" className="w-9 h-9 rounded object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
                    {fileObj.file.type.startsWith('video/') ? <Video className="w-4 h-4 text-muted-foreground" /> :
                     fileObj.file.type.startsWith('audio/') ? <Music2 className="w-4 h-4 text-muted-foreground" /> :
                     fileObj.file.type === 'application/pdf' ? <FileText className="w-4 h-4 text-red-500" /> :
                     <File className="w-4 h-4 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{fileObj.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(fileObj.file.size)}</p>
                </div>
                {fileObj.status === 'pending' && (
                  <button onClick={() => removeFile(index)} className="p-1 hover:bg-muted rounded">
                    <X className="w-3 h-3" />
                  </button>
                )}
                {fileObj.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {fileObj.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {fileObj.status === 'error' && <AlertCircle className="w-4 h-4 text-destructive" />}
              </div>
            ))}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-1.5 border border-dashed rounded-lg text-[11px] text-muted-foreground hover:bg-muted/30"
            >
              + Agregar mas
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {files.length > 0 && (
        <div className="p-3 border-t bg-background">
          {files.every(f => f.status === 'success') ? (
            <Button
              onClick={() => {
                setFiles([])
                onUploaded?.()
                onClose?.()
              }}
              className="w-full h-10 text-sm gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Guardar y cerrar
            </Button>
          ) : (
            <Button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full h-10 text-sm gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
