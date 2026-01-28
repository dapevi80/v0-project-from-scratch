// OCR Scanner - Utilidades para escaneo y extracción de texto
import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
}

export interface ScanPage {
  id: string
  imageUrl: string
  imageData?: string // base64
  ocrResult?: OCRResult
  isProcessing: boolean
  rotation: number
}

// Crear worker de Tesseract con español
export async function createOCRWorker() {
  const worker = await Tesseract.createWorker('spa', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // Progress callback si se necesita
      }
    }
  })
  return worker
}

// Procesar imagen con OCR
export async function processImageOCR(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const worker = await Tesseract.createWorker('spa', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })
  
  try {
    const { data } = await worker.recognize(imageSource)
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
      }))
    }
  } finally {
    await worker.terminate()
  }
}

// Mejorar calidad de imagen para OCR
export function enhanceImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  
  // Convertir a escala de grises y aumentar contraste
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    
    // Aumentar contraste
    const contrast = 1.5
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100))
    const newGray = Math.max(0, Math.min(255, factor * (gray - 128) + 128))
    
    // Binarización simple para texto
    const threshold = 128
    const finalValue = newGray > threshold ? 255 : 0
    
    data[i] = finalValue
    data[i + 1] = finalValue
    data[i + 2] = finalValue
  }
  
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Aplicar filtro de mejora visual (no destructivo)
export function applyVisualEnhancement(
  canvas: HTMLCanvasElement, 
  options: { brightness?: number; contrast?: number; sharpen?: boolean }
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  
  const { brightness = 0, contrast = 0 } = options
  
  // Aplicar filtros CSS en el canvas
  ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`
  
  // Re-dibujar con filtros
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.drawImage(canvas, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)
  }
  
  ctx.filter = 'none'
  return canvas
}

// Rotar imagen
export function rotateImage(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const rotatedCanvas = document.createElement('canvas')
  const ctx = rotatedCanvas.getContext('2d')
  if (!ctx) return canvas
  
  const radians = (degrees * Math.PI) / 180
  
  // Calcular nuevo tamaño
  if (degrees === 90 || degrees === 270) {
    rotatedCanvas.width = canvas.height
    rotatedCanvas.height = canvas.width
  } else {
    rotatedCanvas.width = canvas.width
    rotatedCanvas.height = canvas.height
  }
  
  ctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
  ctx.rotate(radians)
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  
  return rotatedCanvas
}

// Convertir File/Blob a base64
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Crear canvas desde imagen
export function imageToCanvas(imageSrc: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas)
      } else {
        reject(new Error('No se pudo crear contexto del canvas'))
      }
    }
    img.onerror = reject
    img.src = imageSrc
  })
}

// Generar ID único
export function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
