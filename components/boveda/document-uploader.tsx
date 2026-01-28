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
  FileCheck
} from 'lucide-react'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'

// Categorias minimalistas con iconos descriptivos
const CATEGORIAS = [
  { value: 'contrato_laboral', label: 'Contrato', icon: PenLine },
  { value: 'evidencia_foto', label: 'Fotos', icon: ImageIcon },
  { value: 'evidencia_video', label: 'Video', icon: Video },
  { value: 'evidencia_audio', label: 'Audio', icon: Music2 },
  { value: 'ine_frente', label: 'INE', icon: CreditCard },
  { value: 'pasaporte', label: 'Pasaporte', icon: FileCheck },
  { value: 'comprobante_domicilio', label: 'Domicilio', icon: Home },
  { value: 'otro', label: 'Otro', icon: File },
] as const

// Detectar categoria automatica basada en tipo de archivo
function detectarCategoria(mimeType: string): CategoriaDocumento {
  if (mimeType.startsWith('image/')) return 'evidencia_foto'
  if (mimeType.startsWith('video/')) return 'evidencia_video'
  if (mimeType.startsWith('audio/')) return 'evidencia_audio'
  if (mimeType === 'application/pdf') return 'otro'
  return 'otro'
}

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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Actualizar categoria cuando cambie la prop
  useEffect(() => {
    if (defaultCategoria) {
      setCategoria(defaultCategoria)
    }
  }, [defaultCategoria])

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
    <div 
      className="bg-background rounded-xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Header minimalista */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="font-medium text-sm">Subir archivo</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Inputs ocultos */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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
      
      {/* Contenido */}
      <div className={`flex-1 overflow-y-auto p-4 ${dragActive ? 'bg-primary/5' : ''}`}>
        
        {/* Grid de categorias con iconos */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORIAS.map(cat => {
            const Icon = cat.icon
            const isSelected = categoria === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setCategoria(cat.value as CategoriaDocumento)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center
                  ${isSelected 
                    ? 'bg-primary/10 text-primary border border-primary/30' 
                    : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Zona de drop/seleccion - minimalista */}
        {files.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex justify-center gap-4 mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
                className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
              >
                <Camera className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Upload className="w-5 h-5 text-primary" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {dragActive ? 'Suelta aqui' : 'Arrastra o selecciona'}
            </p>
          </div>
        ) : (
          /* Lista de archivos compacta */
          <div className="space-y-2">
            {files.map((fileObj, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                {fileObj.preview ? (
                  <img src={fileObj.preview || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    {fileObj.file.type.startsWith('video/') ? <Video className="w-4 h-4 text-muted-foreground" /> :
                     fileObj.file.type.startsWith('audio/') ? <Music2 className="w-4 h-4 text-muted-foreground" /> :
                     fileObj.file.type === 'application/pdf' ? <FileText className="w-4 h-4 text-red-500" /> :
                     <File className="w-4 h-4 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{fileObj.file.name}</p>
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
            
            {/* Boton agregar mas */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-2 border border-dashed rounded-lg text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              + Agregar mas
            </button>
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
