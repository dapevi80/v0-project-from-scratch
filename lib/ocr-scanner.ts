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
      text: data.text || '',
      confidence: data.confidence || 0,
      words: (data.words || []).map(w => ({
        text: w.text || '',
        confidence: w.confidence || 0,
        bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
      }))
    }
  } catch (error) {
    console.error('Error en OCR:', error)
    return {
      text: '',
      confidence: 0,
      words: []
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

// ===== DETECCIÓN DE ESQUINAS Y RECORTE INTELIGENTE =====

export interface Corner {
  x: number
  y: number
}

export interface DocumentBounds {
  topLeft: Corner
  topRight: Corner
  bottomRight: Corner
  bottomLeft: Corner
  confidence: number
  detected: boolean
}

// Detectar bordes usando algoritmo Sobel simplificado
function detectEdges(imageData: ImageData): Uint8ClampedArray {
  const { width, height, data } = imageData
  const grayscale = new Uint8ClampedArray(width * height)
  const edges = new Uint8ClampedArray(width * height)
  
  // Convertir a escala de grises
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    grayscale[i / 4] = gray
  }
  
  // Aplicar operador Sobel
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayscale[(y + ky) * width + (x + kx)]
          const idx = (ky + 1) * 3 + (kx + 1)
          gx += pixel * sobelX[idx]
          gy += pixel * sobelY[idx]
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges[y * width + x] = Math.min(255, magnitude)
    }
  }
  
  return edges
}

// Detectar esquinas del documento automáticamente
export function detectDocumentCorners(canvas: HTMLCanvasElement): DocumentBounds {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return getDefaultBounds(canvas.width, canvas.height)
  }
  
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const edges = detectEdges(imageData)
  
  // Umbral para considerar un borde
  const threshold = 50
  
  // Buscar puntos de borde en diferentes regiones
  const margin = Math.min(width, height) * 0.1
  
  // Buscar esquina superior izquierda
  const topLeft = findCornerInRegion(edges, width, height, 0, 0, width * 0.4, height * 0.4, 'topLeft', threshold)
  
  // Buscar esquina superior derecha
  const topRight = findCornerInRegion(edges, width, height, width * 0.6, 0, width, height * 0.4, 'topRight', threshold)
  
  // Buscar esquina inferior derecha
  const bottomRight = findCornerInRegion(edges, width, height, width * 0.6, height * 0.6, width, height, 'bottomRight', threshold)
  
  // Buscar esquina inferior izquierda
  const bottomLeft = findCornerInRegion(edges, width, height, 0, height * 0.6, width * 0.4, height, 'bottomLeft', threshold)
  
  // Calcular confianza basada en la detección
  const corners = [topLeft, topRight, bottomRight, bottomLeft]
  const detectedCount = corners.filter(c => c.detected).length
  const confidence = detectedCount / 4
  
  return {
    topLeft: topLeft.point,
    topRight: topRight.point,
    bottomRight: bottomRight.point,
    bottomLeft: bottomLeft.point,
    confidence,
    detected: detectedCount >= 2
  }
}

function findCornerInRegion(
  edges: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cornerType: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft',
  threshold: number
): { point: Corner; detected: boolean } {
  let bestX = 0, bestY = 0
  let maxScore = 0
  
  const startX = Math.floor(x1)
  const endX = Math.floor(x2)
  const startY = Math.floor(y1)
  const endY = Math.floor(y2)
  
  // Buscar el punto con mayor intensidad de borde en la región
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const edgeValue = edges[y * imgWidth + x]
      
      if (edgeValue > threshold) {
        // Calcular score basado en posición (favorecemos esquinas)
        let positionScore = 0
        switch (cornerType) {
          case 'topLeft':
            positionScore = (endX - x) + (endY - y)
            break
          case 'topRight':
            positionScore = (x - startX) + (endY - y)
            break
          case 'bottomRight':
            positionScore = (x - startX) + (y - startY)
            break
          case 'bottomLeft':
            positionScore = (endX - x) + (y - startY)
            break
        }
        
        const totalScore = edgeValue * 0.5 + positionScore * 0.5
        
        if (totalScore > maxScore) {
          maxScore = totalScore
          bestX = x
          bestY = y
        }
      }
    }
  }
  
  // Si no encontramos un buen punto, usar la esquina de la región
  if (maxScore < threshold) {
    switch (cornerType) {
      case 'topLeft':
        return { point: { x: startX + 20, y: startY + 20 }, detected: false }
      case 'topRight':
        return { point: { x: endX - 20, y: startY + 20 }, detected: false }
      case 'bottomRight':
        return { point: { x: endX - 20, y: endY - 20 }, detected: false }
      case 'bottomLeft':
        return { point: { x: startX + 20, y: endY - 20 }, detected: false }
    }
  }
  
  return { point: { x: bestX, y: bestY }, detected: true }
}

function getDefaultBounds(width: number, height: number): DocumentBounds {
  const margin = 20
  return {
    topLeft: { x: margin, y: margin },
    topRight: { x: width - margin, y: margin },
    bottomRight: { x: width - margin, y: height - margin },
    bottomLeft: { x: margin, y: height - margin },
    confidence: 0,
    detected: false
  }
}

// Aplicar transformación de perspectiva para enderezar documento
export function applyPerspectiveTransform(
  canvas: HTMLCanvasElement,
  bounds: DocumentBounds
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  
  // Calcular dimensiones del documento enderezado
  const topWidth = Math.sqrt(
    Math.pow(bounds.topRight.x - bounds.topLeft.x, 2) +
    Math.pow(bounds.topRight.y - bounds.topLeft.y, 2)
  )
  const bottomWidth = Math.sqrt(
    Math.pow(bounds.bottomRight.x - bounds.bottomLeft.x, 2) +
    Math.pow(bounds.bottomRight.y - bounds.bottomLeft.y, 2)
  )
  const leftHeight = Math.sqrt(
    Math.pow(bounds.bottomLeft.x - bounds.topLeft.x, 2) +
    Math.pow(bounds.bottomLeft.y - bounds.topLeft.y, 2)
  )
  const rightHeight = Math.sqrt(
    Math.pow(bounds.bottomRight.x - bounds.topRight.x, 2) +
    Math.pow(bounds.bottomRight.y - bounds.topRight.y, 2)
  )
  
  const newWidth = Math.round(Math.max(topWidth, bottomWidth))
  const newHeight = Math.round(Math.max(leftHeight, rightHeight))
  
  // Crear canvas de salida
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = newWidth
  outputCanvas.height = newHeight
  const outCtx = outputCanvas.getContext('2d')
  if (!outCtx) return canvas
  
  // Mapeo bilineal simplificado (sin library externa)
  const srcPoints = [bounds.topLeft, bounds.topRight, bounds.bottomRight, bounds.bottomLeft]
  const dstPoints = [
    { x: 0, y: 0 },
    { x: newWidth, y: 0 },
    { x: newWidth, y: newHeight },
    { x: 0, y: newHeight }
  ]
  
  // Dibujar usando interpolación
  const srcImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const dstImageData = outCtx.createImageData(newWidth, newHeight)
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Calcular coordenadas de origen usando interpolación bilineal
      const u = x / newWidth
      const v = y / newHeight
      
      const srcX = 
        (1 - u) * (1 - v) * srcPoints[0].x +
        u * (1 - v) * srcPoints[1].x +
        u * v * srcPoints[2].x +
        (1 - u) * v * srcPoints[3].x
      
      const srcY = 
        (1 - u) * (1 - v) * srcPoints[0].y +
        u * (1 - v) * srcPoints[1].y +
        u * v * srcPoints[2].y +
        (1 - u) * v * srcPoints[3].y
      
      // Obtener pixel de origen
      const srcIdx = (Math.floor(srcY) * canvas.width + Math.floor(srcX)) * 4
      const dstIdx = (y * newWidth + x) * 4
      
      if (srcIdx >= 0 && srcIdx < srcImageData.data.length - 3) {
        dstImageData.data[dstIdx] = srcImageData.data[srcIdx]
        dstImageData.data[dstIdx + 1] = srcImageData.data[srcIdx + 1]
        dstImageData.data[dstIdx + 2] = srcImageData.data[srcIdx + 2]
        dstImageData.data[dstIdx + 3] = srcImageData.data[srcIdx + 3]
      }
    }
  }
  
  outCtx.putImageData(dstImageData, 0, 0)
  return outputCanvas
}

// Auto mejorar documento escaneado (similar a CamScanner)
export function autoEnhanceDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  
  // Encontrar min/max para normalización
  let minBrightness = 255
  let maxBrightness = 0
  
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    minBrightness = Math.min(minBrightness, brightness)
    maxBrightness = Math.max(maxBrightness, brightness)
  }
  
  // Normalizar y mejorar contraste
  const range = maxBrightness - minBrightness || 1
  
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      // Normalizar
      let value = ((data[i + c] - minBrightness) / range) * 255
      
      // Aumentar contraste con curva S
      value = value / 255
      value = value < 0.5 
        ? 2 * value * value 
        : 1 - 2 * (1 - value) * (1 - value)
      value = value * 255
      
      // Aumentar blancos (para documentos)
      if (value > 200) value = Math.min(255, value * 1.1)
      
      data[i + c] = Math.max(0, Math.min(255, value))
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Recortar imagen a las esquinas detectadas
export function cropToDocument(
  canvas: HTMLCanvasElement, 
  bounds: DocumentBounds
): HTMLCanvasElement {
  // Primero aplicar transformación de perspectiva
  return applyPerspectiveTransform(canvas, bounds)
}
