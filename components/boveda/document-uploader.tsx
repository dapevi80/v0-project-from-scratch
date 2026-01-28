'use client'

import { useEffect } from "react"

import React from "react"
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  ImageIcon, 
  Video, 
  FileText, 
  Music2,
  CreditCard,
  MapPin,
  X,
  Loader2,
  CheckCircle,
  Camera,
  ChevronDown,
  File,
  AlertCircle
} from 'lucide-react'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'

// Categorías simplificadas con iconos
const CATEGORIAS = [
  { value: 'evidencia_foto', label: 'Fotos', icon: ImageIcon, accept: 'image/*' },
  { value: 'evidencia_video', label: 'Videos', icon: Video, accept: 'video/*' },
  { value: 'evidencia_audio', label: 'Audios', icon: Music2, accept: 'audio/*' },
  { value: 'contrato_laboral', label: 'Contrato', icon: FileText, accept: 'image/*,application/pdf' },
  { value: 'ine_frente', label: 'INE Frente', icon: CreditCard, accept: 'image/*,application/pdf' },
  { value: 'ine_reverso', label: 'INE Reverso', icon: CreditCard, accept: 'image/*,application/pdf' },
  { value: 'pasaporte', label: 'Pasaporte', icon: CreditCard, accept: 'image/*,application/pdf' },
  { value: 'cedula_profesional', label: 'Cedula Prof.', icon: CreditCard, accept: 'image/*,application/pdf' },
  { value: 'comprobante_domicilio', label: 'Domicilio', icon: MapPin, accept: 'image/*,application/pdf' },
  { value: 'otro', label: 'Otro', icon: File, accept: '*' },
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
  const [categoria, setCategoria] = useState<CategoriaDocumento>(defaultCategoria || 'evidencia_foto')
  const [files, setFiles] = useState<FileToUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showTips, setShowTips] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Actualizar categoría cuando cambie la prop
  useEffect(() => {
    if (defaultCategoria) {
      setCategoria(defaultCategoria)
    }
  }, [defaultCategoria])
  
  const categoriaConfig = CATEGORIAS.find(c => c.value === categoria)

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
          
          // Guardar flag si es documento de identificación (para verificación de cuenta)
          if (['ine_frente', 'ine_reverso', 'identificacion', 'pasaporte'].includes(categoria)) {
            const uploaded = JSON.parse(localStorage.getItem('boveda_docs_uploaded') || '{}')
            if (categoria === 'ine_frente') {
              uploaded.ine_frente = true
              uploaded.ine = true // también el flag general
            } else if (categoria === 'ine_reverso') {
              uploaded.ine_reverso = true
              uploaded.ine = true // también el flag general
            } else if (categoria === 'pasaporte') {
              uploaded.pasaporte = true
            } else if (categoria === 'identificacion') {
              uploaded.identificacion = true
              uploaded.ine = true
            }
            localStorage.setItem('boveda_docs_uploaded', JSON.stringify(uploaded))
          }
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
    // El usuario cerrara manualmente con el boton "Guardar y cerrar"
  }, [files, categoria])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-background rounded-xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header fijo con botón cerrar */}
      <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <h3 className="font-semibold text-lg">Subir Documento</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-destructive/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selector de categoría como chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map(cat => {
            const Icon = cat.icon
            const isSelected = categoria === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setCategoria(cat.value as CategoriaDocumento)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700">Tomar Foto</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-primary/5 border-2 border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Elegir Archivo</span>
          </button>
        </div>
        
        {/* Zona de drop minimalista */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${dragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/20 hover:border-primary/40'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={categoriaConfig?.accept}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground">
            Arrastra archivos aquí
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Max 50 MB</p>
        </div>
        
        {/* Lista de archivos */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((fileObj, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border"
              >
                {fileObj.preview ? (
                  <img 
                    src={fileObj.preview || "/placeholder.svg"} 
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <File className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileObj.file.size)}</p>
                </div>
                
                {fileObj.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                {fileObj.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                )}
                {fileObj.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                )}
                {fileObj.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tips colapsables */}
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 text-sm"
        >
          <span className="text-muted-foreground">Documentos sugeridos</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTips ? 'rotate-180' : ''}`} />
        </button>
        
        {showTips && (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-background">Contrato</Badge>
              <Badge variant="outline" className="bg-background">INE</Badge>
              <Badge variant="outline" className="bg-background">Recibos</Badge>
              <Badge variant="outline" className="bg-background">WhatsApp</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-primary/5 border-primary/20">Solicitud Conciliación</Badge>
              <Badge variant="outline" className="bg-primary/5 border-primary/20">Notificación</Badge>
              <Badge variant="outline" className="bg-amber-50 border-amber-200">Actas Audiencia</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-green-50 border-green-200">Convenio</Badge>
              <Badge variant="outline" className="bg-green-50 border-green-200">Acta Pago</Badge>
              <Badge variant="outline" className="bg-red-50 border-red-200">No Conciliación</Badge>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer fijo con botones */}
      {files.length > 0 && (
        <div className="p-4 border-t bg-background sticky bottom-0 space-y-2">
          {files.every(f => f.status === 'success') ? (
            // Todos los archivos subidos - mostrar boton Guardar para cerrar
            <Button
              onClick={() => {
                setFiles([])
                onUploaded?.()
                onClose?.()
              }}
              className="w-full h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              Guardar y cerrar
            </Button>
          ) : (
            // Archivos pendientes - mostrar boton Subir
            <Button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full h-12 text-base gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
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

// Componente simplificado para botón rápido
export function QuickUploadButton({ 
  categoria, 
  onUploaded 
}: { 
  categoria: CategoriaDocumento
  onUploaded?: () => void 
}) {
  const config = CATEGORIAS.find(c => c.value === categoria)
  const IconComponent = config?.icon || ImageIcon
  
  return (
    <button className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors w-full">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <IconComponent className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-medium text-sm">{config?.label || 'Documento'}</p>
        <p className="text-xs text-muted-foreground">Toca para subir</p>
      </div>
    </button>
  )
}
