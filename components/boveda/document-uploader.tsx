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
  Users
} from 'lucide-react'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'
import { LocationPicker, type LocationData } from './location-picker'

// Categorias expandidas organizadas por grupo
const CATEGORIAS_SUGERIDAS = [
  // Documentos principales
  { value: 'contrato_laboral', label: 'Contrato laboral', shortLabel: 'Contrato', icon: PenLine, color: 'bg-blue-100 text-blue-600' },
  { value: 'hojas_firmadas', label: 'Hojas en blanco firmadas', shortLabel: 'Firmadas', icon: FileSignature, color: 'bg-amber-100 text-amber-600' },
  { value: 'recibo_nomina', label: 'Recibo de nomina', shortLabel: 'Nomina', icon: Receipt, color: 'bg-green-100 text-green-600' },
  { value: 'recibo_dinero', label: 'Recibo de pago', shortLabel: 'Recibo', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
  
  // Evidencias multimedia
  { value: 'evidencia_foto', label: 'Fotos de evidencia', shortLabel: 'Fotos', icon: ImageIcon, color: 'bg-purple-100 text-purple-600' },
  { value: 'evidencia_video', label: 'Video de evidencia', shortLabel: 'Video', icon: Video, color: 'bg-pink-100 text-pink-600' },
  { value: 'video_despido', label: 'Video del despido', shortLabel: 'Despido', icon: Video, color: 'bg-red-100 text-red-600' },
  { value: 'evidencia_audio', label: 'Grabacion de audio', shortLabel: 'Audio', icon: Music2, color: 'bg-orange-100 text-orange-600' },
  { value: 'grabacion_llamada', label: 'Grabacion de llamada', shortLabel: 'Llamada', icon: Phone, color: 'bg-cyan-100 text-cyan-600' },
  
  // Identificaciones
  { value: 'ine_frente', label: 'INE / Credencial', shortLabel: 'INE', icon: CreditCard, color: 'bg-slate-100 text-slate-600' },
  { value: 'pasaporte', label: 'Pasaporte', shortLabel: 'Pasaporte', icon: FileCheck, color: 'bg-indigo-100 text-indigo-600' },
  
  // Proceso legal
  { value: 'solicitud_conciliacion', label: 'Solicitud de conciliacion', shortLabel: 'Solicitud', icon: FileText, color: 'bg-sky-100 text-sky-600' },
  { value: 'notificacion', label: 'Notificacion oficial', shortLabel: 'Notificacion', icon: FileText, color: 'bg-violet-100 text-violet-600' },
  { value: 'acuse', label: 'Acuse de recibo', shortLabel: 'Acuse', icon: FileCheck2, color: 'bg-teal-100 text-teal-600' },
  { value: 'expediente', label: 'Expediente del caso', shortLabel: 'Expediente', icon: FileText, color: 'bg-gray-100 text-gray-600' },
  
  // Audiencia y conciliacion
  { value: 'foto_lugar', label: 'Foto del lugar de trabajo', shortLabel: 'Lugar', icon: Building2, color: 'bg-stone-100 text-stone-600' },
  { value: 'acta_audiencia', label: 'Acta de audiencia', shortLabel: 'Audiencia', icon: Scale, color: 'bg-amber-100 text-amber-700' },
  { value: 'acta_conciliacion', label: 'Acta de conciliacion', shortLabel: 'Conciliacion', icon: FileCheck2, color: 'bg-green-100 text-green-700' },
  { value: 'constancia_no_conciliacion', label: 'Constancia de no conciliacion', shortLabel: 'No concilio', icon: FileX, color: 'bg-red-100 text-red-700' },
  
  // Resolucion
  { value: 'convenio', label: 'Convenio', shortLabel: 'Convenio', icon: FileSignature, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'sentencia', label: 'Sentencia', shortLabel: 'Sentencia', icon: Gavel, color: 'bg-purple-100 text-purple-700' },
  
  // Domicilio
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio', shortLabel: 'Domicilio', icon: Home, color: 'bg-rose-100 text-rose-600' },
  
  // Testigos
  { value: 'testigos', label: 'Datos de testigos', shortLabel: 'Testigos', icon: Users, color: 'bg-blue-100 text-blue-700' },
  
  // Otro
  { value: 'otro', label: 'Otro documento', shortLabel: 'Otro', icon: File, color: 'bg-gray-100 text-gray-500' },
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

  // Guardar ubicacion como documento
  const handleSaveLocation = async (locationData: LocationData) => {
    const docData = {
      type: 'ubicacion_trabajo',
      coordinates: { lat: locationData.lat, lng: locationData.lng },
      ...locationData
    }
    
    const blob = new Blob([JSON.stringify(docData, null, 2)], { type: 'application/json' })
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
      metadata: docData
    })
    
    if (result.success) {
      setShowLocationPicker(false)
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

  // Mostrar LocationPicker si esta activo
  if (showLocationPicker) {
    return (
      <LocationPicker 
        onSave={handleSaveLocation}
        onClose={() => setShowLocationPicker(false)}
      />
    )
  }

  return (
    <div 
      className="bg-background rounded-xl shadow-lg border max-h-[85vh] overflow-hidden flex flex-col w-full max-w-sm"
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
          <span className="font-medium text-sm">{categoriaActual?.label || 'Subir'}</span>
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
      <div className="border-b py-2">
        {/* Titulo */}
        <p className="text-[10px] text-muted-foreground text-center mb-2">Reune tus pruebas</p>
        
        {/* Carrusel con flechas */}
        <div className="relative">
          <button 
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-background/90 rounded-full shadow-sm flex items-center justify-center hover:bg-muted"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          <div 
            ref={carouselRef}
            className="flex gap-1 px-6 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORIAS_SUGERIDAS.map(cat => {
              const Icon = cat.icon
              const isSelected = categoria === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoria(cat.value as CategoriaDocumento)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all shrink-0 w-11
                    ${isSelected ? `${cat.color} ring-1 ring-current` : 'hover:bg-muted/50'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/50' : cat.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-[8px] leading-tight text-center truncate w-full">{cat.shortLabel}</span>
                </button>
              )
            })}
          </div>
          
          <button 
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-background/90 rounded-full shadow-sm flex items-center justify-center hover:bg-muted"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        {/* Categoria seleccionada - titulo completo */}
        {categoriaActual && (
          <p className="text-xs font-medium text-center mt-2 text-foreground">{categoriaActual.label}</p>
        )}
      </div>
      
      {/* Contenido */}
      <div className={`flex-1 overflow-y-auto p-3 ${dragActive ? 'bg-primary/5' : ''}`}>
        
        {/* Zona de drop/seleccion */}
        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}
          >
            {/* Acciones */}
            <div className="flex justify-center gap-3 mb-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                title="Tomar foto"
              >
                <Camera className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Elegir archivo"
              >
                <Upload className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors"
                title="Ubicacion trabajo"
              >
                <MapPin className="w-4 h-4 text-orange-600" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {dragActive ? 'Suelta aqui' : 'Foto | Archivo | Ubicacion'}
            </p>
          </div>
        ) : (
          /* Lista de archivos */
          <div className="space-y-1.5">
            {files.map((fileObj, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                {fileObj.preview ? (
                  <img src={fileObj.preview || "/placeholder.svg"} alt="" className="w-8 h-8 rounded object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    {fileObj.file.type.startsWith('video/') ? <Video className="w-3.5 h-3.5 text-muted-foreground" /> :
                     fileObj.file.type.startsWith('audio/') ? <Music2 className="w-3.5 h-3.5 text-muted-foreground" /> :
                     fileObj.file.type === 'application/pdf' ? <FileText className="w-3.5 h-3.5 text-red-500" /> :
                     <File className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium truncate">{fileObj.file.name}</p>
                  <p className="text-[9px] text-muted-foreground">{formatFileSize(fileObj.file.size)}</p>
                </div>
                {fileObj.status === 'pending' && (
                  <button onClick={() => removeFile(index)} className="p-0.5 hover:bg-muted rounded">
                    <X className="w-3 h-3" />
                  </button>
                )}
                {fileObj.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                {fileObj.status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                {fileObj.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
              </div>
            ))}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-1.5 border border-dashed rounded-lg text-[10px] text-muted-foreground hover:bg-muted/30"
            >
              + Agregar mas
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {files.length > 0 && (
        <div className="p-3 border-t">
          {files.every(f => f.status === 'success') ? (
            <Button
              onClick={() => {
                setFiles([])
                onUploaded?.()
                onClose?.()
              }}
              className="w-full h-9 text-xs gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Guardar y cerrar
            </Button>
          ) : (
            <Button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full h-9 text-xs gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Subir {files.length}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
