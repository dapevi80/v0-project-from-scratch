'use client'

import React from "react"
import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Camera, 
  Upload, 
  X, 
  RotateCw, 
  ScanLine, 
  FileText,
  Loader2,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Crop,
  Wand2,
  Move,
  Sun,
  Contrast,
  CreditCard,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { 
  processImageOCR,
  imageToCanvas,
  rotateImage,
  generatePageId,
  detectDocumentCorners,
  applyPerspectiveTransform,
  autoEnhanceDocument,
  fileToBase64,
  type DocumentBounds,
  type Corner
} from '@/lib/ocr-scanner'
import { 
  parseINEFromOCR, 
  combinarDatosINE,
  validarCURP,
  type INEData 
} from '@/lib/ine-parser'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'

interface INEScannerProps {
  onClose: () => void
  onComplete: (data: { 
    ineData: INEData
    frenteUrl: string
    reversoUrl?: string
  }) => void
  lado: 'frente' | 'reverso'
  datosExistentes?: INEData
}

type Step = 'capture' | 'crop' | 'processing' | 'review' | 'saving' | 'done'

export function INEScanner({ onClose, onComplete, lado, datosExistentes }: INEScannerProps) {
  const [step, setStep] = useState<Step>('capture')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ineData, setIneData] = useState<INEData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentBounds, setDocumentBounds] = useState<DocumentBounds | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [draggedCorner, setDraggedCorner] = useState<string | null>(null)
  const [enhancement, setEnhancement] = useState({ brightness: 0, contrast: 0 })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  // Procesar imagen capturada
  const handleImageCapture = async (file: File) => {
    setError(null)
    setIsProcessing(true)
    
    try {
      const base64 = await fileToBase64(file)
      setImageUrl(base64)
      
      // Auto detectar y recortar
      let canvas = await imageToCanvas(base64)
      const bounds = detectDocumentCorners(canvas)
      
      if (bounds.detected && bounds.confidence > 0.3) {
        canvas = applyPerspectiveTransform(canvas, bounds)
      }
      
      // Auto mejorar
      canvas = autoEnhanceDocument(canvas)
      
      const processedBase64 = canvas.toDataURL('image/jpeg', 0.92)
      setProcessedUrl(processedBase64)
      
      // Iniciar OCR
      setStep('processing')
      await processOCR(processedBase64)
      
    } catch (err) {
      console.error('Error procesando imagen:', err)
      setError('Error al procesar la imagen')
    } finally {
      setIsProcessing(false)
    }
  }

  // Procesar OCR
  const processOCR = async (imageBase64: string) => {
    setOcrProgress(0)
    
    try {
      const result = await processImageOCR(imageBase64, (progress) => {
        setOcrProgress(Math.round(progress.progress * 100))
      })
      
      if (result.text) {
        const parsedData = parseINEFromOCR(result.text)
        
        // Si tenemos datos existentes (del otro lado), combinar
        if (datosExistentes) {
          const combinado = lado === 'reverso' 
            ? combinarDatosINE(datosExistentes, parsedData)
            : combinarDatosINE(parsedData, datosExistentes)
          setIneData(combinado)
        } else {
          setIneData(parsedData)
        }
        
        setStep('review')
      } else {
        setError('No se pudo extraer texto de la imagen')
        setStep('capture')
      }
    } catch (err) {
      console.error('Error en OCR:', err)
      setError('Error al analizar la imagen')
      setStep('capture')
    }
  }

  // Rotar imagen
  const handleRotate = async () => {
    if (!processedUrl) return
    setIsProcessing(true)
    
    try {
      const canvas = await imageToCanvas(processedUrl)
      const rotatedCanvas = rotateImage(canvas, 90)
      const rotatedUrl = rotatedCanvas.toDataURL('image/jpeg', 0.92)
      setProcessedUrl(rotatedUrl)
    } catch (err) {
      console.error('Error rotando:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Detectar esquinas y entrar en modo recorte
  const handleDetectCorners = async () => {
    if (!processedUrl) return
    setIsProcessing(true)
    
    try {
      const canvas = await imageToCanvas(processedUrl)
      setImageSize({ width: canvas.width, height: canvas.height })
      const bounds = detectDocumentCorners(canvas)
      setDocumentBounds(bounds)
      setStep('crop')
    } catch (err) {
      console.error('Error detectando esquinas:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Aplicar recorte y mejora
  const handleApplyCrop = async () => {
    if (!processedUrl || !documentBounds) return
    setIsProcessing(true)
    
    try {
      let canvas = await imageToCanvas(processedUrl)
      canvas = applyPerspectiveTransform(canvas, documentBounds)
      canvas = autoEnhanceDocument(canvas)
      
      const newUrl = canvas.toDataURL('image/jpeg', 0.92)
      setProcessedUrl(newUrl)
      setDocumentBounds(null)
      setStep('processing')
      await processOCR(newUrl)
    } catch (err) {
      console.error('Error aplicando recorte:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Auto mejorar sin recorte
  const handleAutoEnhance = async () => {
    if (!processedUrl) return
    setIsProcessing(true)
    
    try {
      let canvas = await imageToCanvas(processedUrl)
      canvas = autoEnhanceDocument(canvas)
      const newUrl = canvas.toDataURL('image/jpeg', 0.92)
      setProcessedUrl(newUrl)
    } catch (err) {
      console.error('Error mejorando:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Arrastrar esquina
  const handleCornerDrag = (corner: string, clientX: number, clientY: number) => {
    if (!cropContainerRef.current || !documentBounds) return
    
    const rect = cropContainerRef.current.getBoundingClientRect()
    const scaleX = imageSize.width / rect.width
    const scaleY = imageSize.height / rect.height
    
    const x = Math.max(0, Math.min(imageSize.width, (clientX - rect.left) * scaleX))
    const y = Math.max(0, Math.min(imageSize.height, (clientY - rect.top) * scaleY))
    
    setDocumentBounds(prev => prev ? { ...prev, [corner]: { x, y } } : prev)
  }

  // Convertir coordenadas
  const getScreenCoords = (corner: Corner) => {
    if (!cropContainerRef.current) return { x: 0, y: 0 }
    const rect = cropContainerRef.current.getBoundingClientRect()
    return {
      x: (corner.x / imageSize.width) * rect.width,
      y: (corner.y / imageSize.height) * rect.height
    }
  }

  // Guardar y continuar
  const handleSave = async () => {
    if (!processedUrl || !ineData) return
    
    setStep('saving')
    
    try {
      // Subir imagen a la bóveda
      await subirDocumento({
        archivo: processedUrl,
        nombre: `INE ${lado === 'frente' ? 'Frente' : 'Reverso'}`,
        nombreOriginal: `ine_${lado}_${Date.now()}.jpg`,
        categoria: (lado === 'frente' ? 'ine_frente' : 'ine_reverso') as CategoriaDocumento,
        mimeType: 'image/jpeg',
        tamanioBytes: Math.round(processedUrl.length * 0.75),
        metadata: {
          ineData,
          lado,
          fechaEscaneo: new Date().toISOString()
        }
      })
      
      setStep('done')
      
      setTimeout(() => {
        onComplete({
          ineData,
          frenteUrl: lado === 'frente' ? processedUrl : '',
          reversoUrl: lado === 'reverso' ? processedUrl : undefined
        })
      }, 1000)
      
    } catch (err) {
      console.error('Error guardando:', err)
      setError('Error al guardar el documento')
      setStep('review')
    }
  }

  // Handlers de input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageCapture(file)
  }

  return (
    <div className="bg-background flex flex-col h-full max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">Escanear INE - {lado === 'frente' ? 'Frente' : 'Reverso'}</h3>
            <p className="text-[10px] text-white/80">Captura inteligente con OCR</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        
        {/* === CAPTURA === */}
        {step === 'capture' && (
          <div className="p-4 space-y-4">
            {/* Guía visual */}
            <div className="relative aspect-[1.586/1] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden">
              {/* Marco de INE */}
              <div className="absolute inset-4 border-2 border-blue-400 rounded-lg opacity-50" />
              
              <CreditCard className="w-16 h-16 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-600">
                {lado === 'frente' ? 'Frente de la INE' : 'Reverso de la INE'}
              </p>
              <p className="text-xs text-slate-500 text-center px-4 mt-1">
                {lado === 'frente' 
                  ? 'Lado con tu foto y nombre'
                  : 'Lado con CURP y clave de elector'
                }
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-1">Tips para mejor lectura:</p>
              <ul className="text-[10px] text-amber-700 space-y-0.5">
                <li>• Buena iluminación, evita sombras</li>
                <li>• INE completamente visible sin dedos</li>
                <li>• Superficie plana y fondo contrastante</li>
              </ul>
            </div>

            {/* Botones de captura */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white flex-col gap-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span className="text-xs">Tomar foto</span>
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-12 flex-col gap-1 bg-transparent"
                disabled={isProcessing}
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Subir imagen</span>
              </Button>
            </div>

            {/* Inputs ocultos */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* === RECORTE INTELIGENTE === */}
        {step === 'crop' && processedUrl && documentBounds && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-2 bg-purple-50 border-b flex items-center justify-between">
              <button onClick={() => { setStep('review'); setDocumentBounds(null) }} className="p-1.5 hover:bg-purple-100 rounded-lg">
                <X className="w-4 h-4 text-purple-600" />
              </button>
              <div className="text-center">
                <span className="text-xs font-medium text-purple-700">Ajusta las esquinas</span>
                <p className="text-[9px] text-purple-500">Arrastra los puntos azules</p>
              </div>
              <div className="w-8" />
            </div>
            
            {/* Área de recorte */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center p-2">
              <div 
                ref={cropContainerRef}
                className="relative max-w-full max-h-full"
                style={{ touchAction: 'none' }}
              >
                <img 
                  src={processedUrl || "/placeholder.svg"} 
                  alt="INE"
                  className="max-w-full max-h-[40vh] object-contain rounded"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
                  }}
                />
                
                {/* Overlay con polígono */}
                {cropContainerRef.current && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    <defs>
                      <mask id="ineCropMask">
                        <rect width="100%" height="100%" fill="white" />
                        <polygon
                          points={`
                            ${getScreenCoords(documentBounds.topLeft).x},${getScreenCoords(documentBounds.topLeft).y}
                            ${getScreenCoords(documentBounds.topRight).x},${getScreenCoords(documentBounds.topRight).y}
                            ${getScreenCoords(documentBounds.bottomRight).x},${getScreenCoords(documentBounds.bottomRight).y}
                            ${getScreenCoords(documentBounds.bottomLeft).x},${getScreenCoords(documentBounds.bottomLeft).y}
                          `}
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#ineCropMask)" />
                    <polygon
                      points={`
                        ${getScreenCoords(documentBounds.topLeft).x},${getScreenCoords(documentBounds.topLeft).y}
                        ${getScreenCoords(documentBounds.topRight).x},${getScreenCoords(documentBounds.topRight).y}
                        ${getScreenCoords(documentBounds.bottomRight).x},${getScreenCoords(documentBounds.bottomRight).y}
                        ${getScreenCoords(documentBounds.bottomLeft).x},${getScreenCoords(documentBounds.bottomLeft).y}
                      `}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                
                {/* Puntos de esquina */}
                {cropContainerRef.current && (['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const).map((corner) => {
                  const coords = getScreenCoords(documentBounds[corner])
                  return (
                    <div
                      key={corner}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setDraggedCorner(corner)
                        const moveHandler = (ev: MouseEvent) => handleCornerDrag(corner, ev.clientX, ev.clientY)
                        const upHandler = () => {
                          setDraggedCorner(null)
                          window.removeEventListener('mousemove', moveHandler)
                          window.removeEventListener('mouseup', upHandler)
                        }
                        window.addEventListener('mousemove', moveHandler)
                        window.addEventListener('mouseup', upHandler)
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        setDraggedCorner(corner)
                        const moveHandler = (ev: TouchEvent) => handleCornerDrag(corner, ev.touches[0].clientX, ev.touches[0].clientY)
                        const upHandler = () => {
                          setDraggedCorner(null)
                          window.removeEventListener('touchmove', moveHandler)
                          window.removeEventListener('touchend', upHandler)
                        }
                        window.addEventListener('touchmove', moveHandler)
                        window.addEventListener('touchend', upHandler)
                      }}
                      className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 cursor-move transition-transform ${
                        draggedCorner === corner ? 'scale-125 bg-blue-500 border-white' : 'bg-white border-blue-500'
                      } shadow-lg flex items-center justify-center`}
                      style={{ left: coords.x, top: coords.y, touchAction: 'none' }}
                    >
                      <Move className="w-3 h-3 text-blue-600" />
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Botones */}
            <div className="p-3 border-t flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setStep('review'); setDocumentBounds(null) }} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Crop className="w-4 h-4 mr-1" />}
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* === PROCESANDO OCR === */}
        {step === 'processing' && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            {processedUrl && (
              <div className="w-full max-w-[200px] aspect-[1.586/1] rounded-lg overflow-hidden border mb-4 relative">
                <img src={processedUrl || "/placeholder.svg"} alt="INE" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-full h-1 bg-blue-500 absolute animate-scan" />
                </div>
              </div>
            )}
            
            <div className="w-full max-w-[200px] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analizando...</span>
                <span className="font-medium">{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2" />
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Extrayendo CURP, nombre y datos de la INE...
            </p>
          </div>
        )}

        {/* === REVISIÓN DE DATOS === */}
        {step === 'review' && ineData && (
          <div className="p-4 space-y-3">
            {/* Imagen procesada */}
            <div className="relative aspect-[1.586/1] rounded-lg overflow-hidden border bg-slate-100">
              {processedUrl && (
                <img src={processedUrl || "/placeholder.svg"} alt="INE procesada" className="w-full h-full object-contain" />
              )}
            </div>
            
            {/* Barra de herramientas */}
            <div className="flex items-center justify-center gap-1 p-2 bg-muted/50 rounded-lg">
              <button 
                onClick={handleDetectCorners}
                disabled={isProcessing}
                className="p-2 hover:bg-purple-100 bg-purple-50 rounded-lg flex flex-col items-center gap-0.5 text-purple-600"
                title="Recortar documento"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crop className="w-4 h-4" />}
                <span className="text-[8px] font-medium">Recortar</span>
              </button>
              <button 
                onClick={handleAutoEnhance}
                disabled={isProcessing}
                className="p-2 hover:bg-amber-100 bg-amber-50 rounded-lg flex flex-col items-center gap-0.5 text-amber-600"
                title="Mejorar imagen"
              >
                <Wand2 className="w-4 h-4" />
                <span className="text-[8px]">Mejorar</span>
              </button>
              <button 
                onClick={handleRotate}
                disabled={isProcessing}
                className="p-2 hover:bg-muted rounded-lg flex flex-col items-center gap-0.5"
                title="Rotar 90°"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-[8px]">Rotar</span>
              </button>
              <button 
                onClick={() => {
                  if (!processedUrl) return
                  setStep('processing')
                  processOCR(processedUrl)
                }}
                disabled={isProcessing}
                className="p-2 hover:bg-blue-100 bg-blue-50 rounded-lg flex flex-col items-center gap-0.5 text-blue-600"
                title="Re-escanear OCR"
              >
                <ScanLine className="w-4 h-4" />
                <span className="text-[8px]">Re-OCR</span>
              </button>
            </div>

            {/* Datos extraídos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Datos detectados</h4>
                <Badge variant={ineData.confianza >= 60 ? 'default' : 'secondary'}>
                  {ineData.confianza}% confianza
                </Badge>
              </div>

              <div className="grid gap-2">
                {/* CURP */}
                <div className={`p-2.5 rounded-lg border ${ineData.curp ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${ineData.curp ? 'text-green-600' : 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground">CURP</p>
                      <p className={`font-mono text-sm truncate ${ineData.curp ? 'text-green-700 font-medium' : 'text-slate-400'}`}>
                        {ineData.curp || 'No detectado'}
                      </p>
                    </div>
                    {ineData.curp && validarCURP(ineData.curp) && (
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Nombre */}
                {(ineData.nombreCompleto || ineData.nombre) && (
                  <div className="p-2.5 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Nombre</p>
                        <p className="text-sm font-medium text-blue-700 truncate">
                          {ineData.nombreCompleto || ineData.nombre}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fecha nacimiento */}
                {ineData.fechaNacimiento && (
                  <div className="p-2.5 rounded-lg border bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground">Fecha de nacimiento</p>
                        <p className="text-sm font-medium text-purple-700">
                          {new Date(ineData.fechaNacimiento).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Domicilio */}
                {ineData.domicilio?.domicilioCompleto && (
                  <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground">Domicilio</p>
                        <p className="text-xs text-amber-700">
                          {ineData.domicilio.domicilioCompleto}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Otros datos */}
                <div className="grid grid-cols-2 gap-2">
                  {ineData.claveElector && (
                    <div className="p-2 rounded border bg-slate-50">
                      <p className="text-[9px] text-muted-foreground">Clave Elector</p>
                      <p className="text-[10px] font-mono truncate">{ineData.claveElector}</p>
                    </div>
                  )}
                  {ineData.seccion && (
                    <div className="p-2 rounded border bg-slate-50">
                      <p className="text-[9px] text-muted-foreground">Sección</p>
                      <p className="text-[10px] font-mono">{ineData.seccion}</p>
                    </div>
                  )}
                  {ineData.vigencia && (
                    <div className="p-2 rounded border bg-slate-50">
                      <p className="text-[9px] text-muted-foreground">Vigencia</p>
                      <p className="text-[10px] font-mono">{ineData.vigencia}</p>
                    </div>
                  )}
                  {ineData.sexo && (
                    <div className="p-2 rounded border bg-slate-50">
                      <p className="text-[9px] text-muted-foreground">Sexo</p>
                      <p className="text-[10px]">{ineData.sexo === 'H' ? 'Hombre' : 'Mujer'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Errores/advertencias */}
              {ineData.errores.length > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] text-amber-700">
                    {ineData.errores.join('. ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === GUARDANDO === */}
        {step === 'saving' && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="font-medium">Guardando documento...</p>
            <p className="text-xs text-muted-foreground mt-1">Subiendo a tu bóveda</p>
          </div>
        )}

        {/* === COMPLETADO === */}
        {step === 'done' && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold text-green-600 text-lg">Listo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              INE {lado === 'frente' ? 'frente' : 'reverso'} guardada
            </p>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {step === 'review' && (
        <div className="p-3 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!processedUrl) return
              setStep('processing')
              processOCR(processedUrl)
            }}
            className="flex-1 bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reintentar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            Guardar
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
