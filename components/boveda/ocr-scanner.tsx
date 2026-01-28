'use client'

import React from "react"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Camera, 
  Upload, 
  RotateCw, 
  ScanLine, 
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Eye,
  Copy,
  Check,
  ZoomIn,
  Sun,
  Contrast
} from 'lucide-react'
import { 
  processImageOCR, 
  fileToBase64, 
  imageToCanvas,
  rotateImage,
  generatePageId,
  type ScanPage,
  type OCRResult
} from '@/lib/ocr-scanner'
import { subirDocumento, type CategoriaDocumento } from '@/app/boveda/actions'
import jsPDF from 'jspdf'

interface OCRScannerProps {
  onClose: () => void
  onComplete?: () => void
  initialImages?: string[] // URLs de imágenes de la bóveda
}

export function OCRScanner({ onClose, onComplete, initialImages }: OCRScannerProps) {
  const [step, setStep] = useState<'select' | 'scan' | 'review' | 'saving' | 'done'>('select')
  const [pages, setPages] = useState<ScanPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [showText, setShowText] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savingProgress, setSavingProgress] = useState('')
  const [enhancement, setEnhancement] = useState({ brightness: 0, contrast: 0 })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Cargar imágenes iniciales de la bóveda
  const loadInitialImages = useCallback(async () => {
    if (initialImages && initialImages.length > 0) {
      const newPages: ScanPage[] = initialImages.map(url => ({
        id: generatePageId(),
        imageUrl: url,
        isProcessing: false,
        rotation: 0
      }))
      setPages(newPages)
      setStep('scan')
    }
  }, [initialImages])

  // Agregar imágenes desde archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const newPages: ScanPage[] = []
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file)
        newPages.push({
          id: generatePageId(),
          imageUrl: base64,
          imageData: base64,
          isProcessing: false,
          rotation: 0
        })
      }
    }
    
    setPages(prev => [...prev, ...newPages])
    if (newPages.length > 0) setStep('scan')
    
    // Reset input
    if (e.target) e.target.value = ''
  }

  // Tomar foto con cámara
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    const base64 = await fileToBase64(file)
    
    const newPage: ScanPage = {
      id: generatePageId(),
      imageUrl: base64,
      imageData: base64,
      isProcessing: false,
      rotation: 0
    }
    
    setPages(prev => [...prev, newPage])
    setCurrentPageIndex(pages.length)
    setStep('scan')
    
    if (e.target) e.target.value = ''
  }

  // Rotar página actual
  const handleRotate = async () => {
    const page = pages[currentPageIndex]
    if (!page) return
    
    const canvas = await imageToCanvas(page.imageUrl)
    const rotated = rotateImage(canvas, 90)
    const newUrl = rotated.toDataURL('image/jpeg', 0.9)
    
    setPages(prev => prev.map((p, i) => 
      i === currentPageIndex 
        ? { ...p, imageUrl: newUrl, rotation: (p.rotation + 90) % 360 }
        : p
    ))
  }

  // Eliminar página
  const handleDeletePage = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index))
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2))
    }
  }

  // Procesar OCR en página actual
  const handleProcessOCR = async () => {
    const page = pages[currentPageIndex]
    if (!page || page.ocrResult) return
    
    setIsProcessingOCR(true)
    setOcrProgress(0)
    
    try {
      const result = await processImageOCR(page.imageUrl, (progress) => {
        setOcrProgress(progress)
      })
      
      setPages(prev => prev.map((p, i) => 
        i === currentPageIndex ? { ...p, ocrResult: result } : p
      ))
      
      // Actualizar texto extraído
      updateExtractedText(currentPageIndex, result)
    } catch (error) {
      console.error('Error en OCR:', error)
    } finally {
      setIsProcessingOCR(false)
    }
  }

  // Procesar OCR en todas las páginas
  const handleProcessAllOCR = async () => {
    setIsProcessingOCR(true)
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (page.ocrResult) continue
      
      setCurrentPageIndex(i)
      setOcrProgress(0)
      
      try {
        const result = await processImageOCR(page.imageUrl, (progress) => {
          setOcrProgress(progress)
        })
        
        setPages(prev => prev.map((p, idx) => 
          idx === i ? { ...p, ocrResult: result } : p
        ))
      } catch (error) {
        console.error(`Error en OCR página ${i + 1}:`, error)
      }
    }
    
    // Actualizar texto total
    setExtractedText(pages.map(p => p.ocrResult?.text || '').join('\n\n--- Página ---\n\n'))
    setIsProcessingOCR(false)
    setStep('review')
  }

  // Actualizar texto extraído
  const updateExtractedText = (pageIndex: number, result: OCRResult) => {
    const allTexts = pages.map((p, i) => 
      i === pageIndex ? result.text : (p.ocrResult?.text || '')
    ).filter(t => t.trim())
    
    setExtractedText(allTexts.join('\n\n--- Página ---\n\n'))
  }

  // Copiar texto
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generar y guardar PDF
  const handleSavePDF = async () => {
    if (pages.length === 0) return
    
    setStep('saving')
    setSavingProgress('Generando PDF...')
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      })
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage()
        
        setSavingProgress(`Procesando página ${i + 1} de ${pages.length}...`)
        
        const page = pages[i]
        
        // Agregar imagen
        const img = new Image()
        img.src = page.imageUrl
        await new Promise(resolve => { img.onload = resolve })
        
        const imgRatio = img.width / img.height
        const maxWidth = pageWidth - (margin * 2)
        const maxHeight = pageHeight - (margin * 2) - 20 // Espacio para texto
        
        let imgWidth = maxWidth
        let imgHeight = imgWidth / imgRatio
        
        if (imgHeight > maxHeight * 0.6) {
          imgHeight = maxHeight * 0.6
          imgWidth = imgHeight * imgRatio
        }
        
        const x = (pageWidth - imgWidth) / 2
        pdf.addImage(page.imageUrl, 'JPEG', x, margin, imgWidth, imgHeight)
        
        // Agregar texto OCR si existe
        if (page.ocrResult?.text) {
          const textY = margin + imgHeight + 5
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          
          const lines = pdf.splitTextToSize(page.ocrResult.text, maxWidth)
          const maxLines = Math.floor((pageHeight - textY - margin) / 4)
          const displayLines = lines.slice(0, maxLines)
          
          pdf.text(displayLines, margin, textY)
        }
        
        // Número de página
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Página ${i + 1} de ${pages.length}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
      }
      
      // Convertir a blob y guardar en bóveda
      setSavingProgress('Guardando en bóveda...')
      const pdfBlob = pdf.output('blob')
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(pdfBlob)
      })
      
      await subirDocumento({
        archivo: pdfBase64,
        nombre: `Documento escaneado - ${new Date().toLocaleDateString('es-MX')}`,
        nombreOriginal: `escaneo_${Date.now()}.pdf`,
        categoria: 'documento_escaneado' as CategoriaDocumento,
        mimeType: 'application/pdf',
        tamanioBytes: pdfBlob.size,
        metadata: {
          pagesCount: pages.length,
          hasOCR: pages.some(p => p.ocrResult),
          createdAt: new Date().toISOString()
        }
      })
      
      setStep('done')
      setTimeout(() => {
        onComplete?.()
        onClose()
      }, 2000)
      
    } catch (error) {
      console.error('Error guardando PDF:', error)
      setSavingProgress('Error al guardar')
    }
  }

  // Aplicar mejora de imagen
  const handleEnhance = async (type: 'brightness' | 'contrast', value: number) => {
    setEnhancement(prev => ({ ...prev, [type]: prev[type] + value }))
  }

  const currentPage = pages[currentPageIndex]

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-background overflow-hidden">
      {/* ===== SELECCIÓN DE FUENTE ===== */}
      {step === 'select' && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Escáner inteligente</h2>
                <p className="text-[10px] text-muted-foreground">OCR y conversión a PDF</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Opciones */}
          <div className="flex-1 p-4 space-y-3">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Selecciona cómo quieres agregar documentos
            </p>
            
            {/* Tomar foto */}
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="w-full p-4 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-all flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Tomar foto</p>
                <p className="text-xs text-muted-foreground">Usa la cámara para escanear</p>
              </div>
            </button>
            
            {/* Subir archivo */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 transition-all flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Subir imágenes</p>
                <p className="text-xs text-muted-foreground">Selecciona fotos de tu dispositivo</p>
              </div>
            </button>
            
            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-amber-700 text-center">
                Puedes agregar múltiples páginas para crear un solo PDF
              </p>
            </div>
          </div>
          
          {/* Inputs ocultos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      )}

      {/* ===== ESCANEO Y EDICIÓN ===== */}
      {step === 'scan' && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b bg-muted/30">
            <button onClick={() => setStep('select')} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              Página {currentPageIndex + 1} de {pages.length}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Vista previa de imagen */}
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center min-h-[200px] overflow-hidden">
            {currentPage && (
              <img 
                src={currentPage.imageUrl || "/placeholder.svg"} 
                alt={`Página ${currentPageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  filter: `brightness(${100 + enhancement.brightness}%) contrast(${100 + enhancement.contrast}%)`
                }}
              />
            )}
            
            {/* Indicador de procesamiento OCR */}
            {isProcessingOCR && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <div className="bg-white rounded-xl p-4 shadow-xl">
                  <div className="w-16 h-16 relative mx-auto mb-3">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
                    <div 
                      className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" 
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-600">
                      {ocrProgress}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-center">Extrayendo texto...</p>
                  <p className="text-xs text-muted-foreground text-center">Página {currentPageIndex + 1}</p>
                </div>
              </div>
            )}
            
            {/* Badge de OCR completado */}
            {currentPage?.ocrResult && !isProcessingOCR && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="w-3 h-3" />
                OCR listo
              </div>
            )}
          </div>
          
          {/* Miniaturas de páginas */}
          {pages.length > 1 && (
            <div className="flex gap-2 p-2 overflow-x-auto bg-muted/30 border-t">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`relative shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentPageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                  }`}
                >
                  <img src={page.imageUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  {page.ocrResult && (
                    <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePage(index) }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2 h-2 text-white" />
                  </button>
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-12 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-muted"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
          
          {/* Herramientas */}
          <div className="p-2 border-t space-y-2">
            {/* Controles de imagen */}
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={handleRotate}
                className="p-2 hover:bg-muted rounded-lg flex flex-col items-center gap-0.5"
                title="Rotar"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-[9px]">Rotar</span>
              </button>
              <button 
                onClick={() => handleEnhance('brightness', 10)}
                className="p-2 hover:bg-muted rounded-lg flex flex-col items-center gap-0.5"
                title="Más brillo"
              >
                <Sun className="w-4 h-4" />
                <span className="text-[9px]">Brillo+</span>
              </button>
              <button 
                onClick={() => handleEnhance('contrast', 10)}
                className="p-2 hover:bg-muted rounded-lg flex flex-col items-center gap-0.5"
                title="Más contraste"
              >
                <Contrast className="w-4 h-4" />
                <span className="text-[9px]">Contraste+</span>
              </button>
              <button
                onClick={handleProcessOCR}
                disabled={isProcessingOCR || currentPage?.ocrResult !== undefined}
                className="p-2 hover:bg-muted rounded-lg flex flex-col items-center gap-0.5 disabled:opacity-50"
                title="Extraer texto"
              >
                <ScanLine className="w-4 h-4" />
                <span className="text-[9px]">OCR</span>
              </button>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 gap-1"
              >
                <Camera className="w-3 h-3" />
                Foto
              </Button>
              <Button
                size="sm"
                onClick={handleProcessAllOCR}
                disabled={isProcessingOCR}
                className="flex-1 gap-1 bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {isProcessingOCR ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Escanear todo
              </Button>
            </div>
          </div>
          
          {/* Inputs ocultos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      )}

      {/* ===== REVISIÓN Y TEXTO ===== */}
      {step === 'review' && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b">
            <button onClick={() => setStep('scan')} className="p-1.5 hover:bg-muted rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">Revisar documento</span>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Toggle entre imagen y texto */}
          <div className="flex border-b">
            <button
              onClick={() => setShowText(false)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                !showText ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-muted-foreground'
              }`}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Vista previa
            </button>
            <button
              onClick={() => setShowText(true)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                showText ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-muted-foreground'
              }`}
            >
              <FileText className="w-3 h-3 inline mr-1" />
              Texto extraído
            </button>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 overflow-auto">
            {!showText ? (
              // Vista previa de páginas
              <div className="p-3 grid grid-cols-2 gap-2">
                {pages.map((page, index) => (
                  <div key={page.id} className="relative rounded-lg overflow-hidden border bg-white shadow-sm">
                    <img src={page.imageUrl || "/placeholder.svg"} alt="" className="w-full h-24 object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <span className="text-[10px] text-white">Pág. {index + 1}</span>
                    </div>
                    {page.ocrResult && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Texto extraído
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {extractedText.length} caracteres
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 min-h-[200px]">
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {extractedText || 'No se extrajo texto'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Acciones */}
          <div className="p-3 border-t space-y-2">
            <Button
              onClick={handleSavePDF}
              className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Download className="w-4 h-4" />
              Guardar PDF en Bóveda
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              {pages.length} página{pages.length > 1 ? 's' : ''} • El texto OCR se incluirá en el PDF
            </p>
          </div>
        </div>
      )}

      {/* ===== GUARDANDO ===== */}
      {step === 'saving' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 relative mb-4">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="font-medium">{savingProgress}</p>
          <p className="text-xs text-muted-foreground mt-1">Por favor espera...</p>
        </div>
      )}

      {/* ===== COMPLETADO ===== */}
      {step === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold text-green-600 text-lg">Documento guardado</p>
          <p className="text-xs text-muted-foreground mt-1">Ya está disponible en tu bóveda</p>
        </div>
      )}
    </div>
  )
}
