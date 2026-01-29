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

// Limpiar y validar texto OCR - Filtrar basura y caracteres sin sentido
export function cleanOCRText(text: string, words: Array<{ text: string; confidence: number }>): string {
  if (!text) return ''
  
  // Filtrar palabras con baja confianza (menos del 40%)
  const validWords = words.filter(w => w.confidence >= 40)
  
  // Patrones de texto basura comun en OCR
  const garbagePatterns = [
    /^[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]+$/, // Solo simbolos
    /^[|lI1]{3,}$/, // Lineas verticales confundidas
    /^[-_=]{3,}$/, // Lineas horizontales
    /^[.,:;]{3,}$/, // Puntuacion repetida
    /^[0-9]{1}$/, // Numeros sueltos de 1 digito
    /^.{1,2}$/, // Palabras muy cortas (1-2 chars) sin ser articulos comunes
  ]
  
  // Articulos y palabras cortas validas en espanol
  const validShortWords = ['a', 'y', 'o', 'u', 'e', 'el', 'la', 'de', 'en', 'no', 'si', 'al', 'del', 'un', 'una', 'por', 'con', 'sin', 'que', 'se', 'su', 'le', 'lo', 'me', 'te', 'mi', 'tu', 'es', 'ha', 'he']
  
  // Procesar linea por linea
  const lines = text.split('\n')
  const cleanedLines: string[] = []
  
  for (const line of lines) {
    const words = line.trim().split(/\s+/)
    const cleanedWords: string[] = []
    
    for (const word of words) {
      const cleanWord = word.trim()
      if (!cleanWord) continue
      
      // Verificar si es basura
      let isGarbage = false
      for (const pattern of garbagePatterns) {
        if (pattern.test(cleanWord)) {
          // Excepcion: palabras cortas validas
          if (cleanWord.length <= 3 && validShortWords.includes(cleanWord.toLowerCase())) {
            break
          }
          isGarbage = true
          break
        }
      }
      
      if (!isGarbage) {
        cleanedWords.push(cleanWord)
      }
    }
    
    // Solo agregar lineas con contenido valido (al menos 2 palabras o 1 palabra larga)
    if (cleanedWords.length >= 2 || (cleanedWords.length === 1 && cleanedWords[0].length >= 4)) {
      cleanedLines.push(cleanedWords.join(' '))
    }
  }
  
  return cleanedLines.join('\n')
}

// Detectar si el texto es mayormente basura o tiene contenido real
export function isValidOCRText(text: string): { valid: boolean; score: number; reason: string } {
  if (!text || text.length < 10) {
    return { valid: false, score: 0, reason: 'Texto muy corto' }
  }
  
  // Contar caracteres validos vs basura
  const alphanumeric = (text.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]/g) || []).length
  const total = text.length
  const alphaRatio = alphanumeric / total
  
  // Contar palabras validas (3+ caracteres)
  const words = text.split(/\s+/).filter(w => w.length >= 3)
  const validWords = words.filter(w => /^[a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]+$/.test(w))
  const wordRatio = words.length > 0 ? validWords.length / words.length : 0
  
  // Detectar patrones de texto real (frases comunes en documentos legales)
  const legalPatterns = [
    /contrato/i, /trabajador/i, /empresa/i, /fecha/i, /firma/i,
    /salario/i, /pago/i, /prestacion/i, /despido/i, /renuncia/i,
    /finiquito/i, /liquidacion/i, /jornada/i, /horario/i,
    /conciliacion/i, /demanda/i, /audiencia/i, /citatorio/i,
    /nombre/i, /domicilio/i, /telefono/i, /curp/i, /rfc/i
  ]
  
  let patternMatches = 0
  for (const pattern of legalPatterns) {
    if (pattern.test(text)) patternMatches++
  }
  const patternScore = Math.min(1, patternMatches / 3)
  
  // Calcular score final (0-100)
  const score = Math.round((alphaRatio * 30) + (wordRatio * 40) + (patternScore * 30))
  
  if (score >= 50) {
    return { valid: true, score, reason: 'Texto legible' }
  } else if (score >= 30) {
    return { valid: true, score, reason: 'Texto parcialmente legible' }
  } else {
    return { valid: false, score, reason: 'Calidad insuficiente - intenta mejorar la imagen' }
  }
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
    
    // Limpiar texto de basura
    const rawText = data.text || ''
    const rawWords = (data.words || []).map(w => ({
      text: w.text || '',
      confidence: w.confidence || 0,
      bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
    }))
    
    const cleanedText = cleanOCRText(rawText, rawWords)
    const validation = isValidOCRText(cleanedText)
    
    return {
      text: cleanedText,
      confidence: validation.score, // Usar nuestro score en lugar del de Tesseract
      words: rawWords.filter(w => w.confidence >= 40)
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

// Mejorar calidad de imagen para OCR - Tecnicas avanzadas
export function enhanceImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height
  
  // Paso 1: Convertir a escala de grises
  const grayscale = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  }
  
  // Paso 2: Calcular umbral con metodo Otsu (mejor que umbral fijo)
  const threshold = calculateOtsuThreshold(grayscale)
  
  // Paso 3: Aplicar reduccion de ruido (filtro mediano simplificado)
  const denoised = applyMedianFilter(grayscale, width, height)
  
  // Paso 4: Binarizacion adaptativa con Otsu
  for (let i = 0; i < denoised.length; i++) {
    // Umbral adaptativo: usar Otsu como base pero ajustar localmente
    const value = denoised[i]
    const finalValue = value > threshold ? 255 : 0
    
    const idx = i * 4
    data[idx] = finalValue
    data[idx + 1] = finalValue
    data[idx + 2] = finalValue
  }
  
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Metodo Otsu para calcular umbral optimo automaticamente
function calculateOtsuThreshold(pixels: Uint8Array): number {
  // Histograma
  const histogram = new Array(256).fill(0)
  for (const pixel of pixels) {
    histogram[pixel]++
  }
  
  const total = pixels.length
  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i]
  }
  
  let sumB = 0
  let wB = 0
  let wF = 0
  let maxVariance = 0
  let threshold = 0
  
  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    
    wF = total - wB
    if (wF === 0) break
    
    sumB += t * histogram[t]
    
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    
    const variance = wB * wF * (mB - mF) * (mB - mF)
    
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }
  
  return threshold
}

// Filtro mediano para reducir ruido (sal y pimienta)
function applyMedianFilter(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(pixels.length)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbors: number[] = []
      
      // Recoger vecinos 3x3
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(width - 1, x + dx))
          const ny = Math.max(0, Math.min(height - 1, y + dy))
          neighbors.push(pixels[ny * width + nx])
        }
      }
      
      // Ordenar y tomar mediana
      neighbors.sort((a, b) => a - b)
      result[y * width + x] = neighbors[4] // Mediana de 9 elementos
    }
  }
  
  return result
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

// Rotar imagen (corregido para no distorsionar)
export function rotateImage(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const rotatedCanvas = document.createElement('canvas')
  const ctx = rotatedCanvas.getContext('2d')
  if (!ctx) return canvas
  
  // Normalizar grados
  const normalizedDegrees = ((degrees % 360) + 360) % 360
  
  // Calcular nuevo tamaño
  if (normalizedDegrees === 90 || normalizedDegrees === 270) {
    rotatedCanvas.width = canvas.height
    rotatedCanvas.height = canvas.width
  } else {
    rotatedCanvas.width = canvas.width
    rotatedCanvas.height = canvas.height
  }
  
  ctx.save()
  ctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2)
  ctx.rotate((normalizedDegrees * Math.PI) / 180)
  
  // Dibujar centrado correctamente según la rotación
  if (normalizedDegrees === 90 || normalizedDegrees === 270) {
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  } else {
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
  }
  
  ctx.restore()
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

// ===== DETECCIÓN DE ORIENTACIÓN DEL DOCUMENTO =====

export interface OrientationResult {
  angle: number // 0, 90, 180, 270
  confidence: number
  needsRotation: boolean
}

// Detectar si el documento está volteado analizando la distribución de texto
export async function detectDocumentOrientation(imageSource: string): Promise<OrientationResult> {
  try {
    // Crear worker temporal para análisis rápido
    const worker = await Tesseract.createWorker('spa', 1)
    
    // Obtener información de orientación de Tesseract
    const { data } = await worker.recognize(imageSource)
    await worker.terminate()
    
    // Analizar la orientación basada en las líneas de texto
    const lines = data.lines || []
    
    if (lines.length < 2) {
      return { angle: 0, confidence: 0.5, needsRotation: false }
    }
    
    // Calcular la orientación promedio de las líneas
    let horizontalLines = 0
    let verticalLines = 0
    let totalConfidence = 0
    
    for (const line of lines) {
      if (!line.bbox) continue
      
      const width = line.bbox.x1 - line.bbox.x0
      const height = line.bbox.y1 - line.bbox.y0
      const aspectRatio = width / (height || 1)
      
      // Líneas horizontales tienen aspect ratio > 2
      // Líneas verticales tienen aspect ratio < 0.5
      if (aspectRatio > 2) {
        horizontalLines++
      } else if (aspectRatio < 0.5) {
        verticalLines++
      }
      
      totalConfidence += line.confidence || 0
    }
    
    const avgConfidence = totalConfidence / lines.length / 100
    
    // Determinar orientación basada en la distribución de líneas
    if (verticalLines > horizontalLines * 2) {
      // El documento parece estar girado 90 o 270 grados
      // Necesitamos determinar la dirección correcta
      return { angle: 90, confidence: avgConfidence, needsRotation: true }
    }
    
    // Verificar si el texto está al revés (180 grados)
    // Esto es más difícil de detectar, usamos heurísticas
    const textSample = data.text?.slice(0, 100) || ''
    const uppercaseRatio = (textSample.match(/[A-ZÁÉÍÓÚÑ]/g) || []).length / (textSample.length || 1)
    
    // Si hay muy pocos caracteres reconocidos o baja confianza, puede estar al revés
    if (avgConfidence < 0.3 && lines.length > 3) {
      return { angle: 180, confidence: avgConfidence, needsRotation: true }
    }
    
    return { angle: 0, confidence: avgConfidence, needsRotation: false }
  } catch (error) {
    console.error('Error detectando orientación:', error)
    return { angle: 0, confidence: 0, needsRotation: false }
  }
}

// Detectar orientación usando análisis de imagen (más rápido, sin OCR)
export function detectOrientationFast(canvas: HTMLCanvasElement): OrientationResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { angle: 0, confidence: 0, needsRotation: false }
  
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  
  // Analizar gradientes horizontales vs verticales
  let horizontalGradient = 0
  let verticalGradient = 0
  
  // Muestrear puntos para acelerar
  const step = Math.max(4, Math.floor(Math.min(width, height) / 100))
  
  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = (y * width + x) * 4
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      
      // Gradiente horizontal (diferencia con pixel derecho)
      const idxRight = (y * width + x + step) * 4
      const grayRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3
      horizontalGradient += Math.abs(gray - grayRight)
      
      // Gradiente vertical (diferencia con pixel abajo)
      const idxDown = ((y + step) * width + x) * 4
      const grayDown = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3
      verticalGradient += Math.abs(gray - grayDown)
    }
  }
  
  // Si los gradientes verticales son mucho mayores que los horizontales,
  // probablemente el documento está girado 90 grados
  const ratio = verticalGradient / (horizontalGradient || 1)
  
  if (ratio > 1.5) {
    return { angle: 90, confidence: Math.min(ratio / 3, 0.9), needsRotation: true }
  } else if (ratio < 0.67) {
    // Podría estar normal o girado 180 - difícil de determinar sin OCR
    return { angle: 0, confidence: 0.7, needsRotation: false }
  }
  
  return { angle: 0, confidence: 0.8, needsRotation: false }
}

// Corregir orientación del documento automáticamente
export async function autoCorrectOrientation(canvas: HTMLCanvasElement): Promise<{
  correctedCanvas: HTMLCanvasElement
  rotatedBy: number
  wasRotated: boolean
}> {
  // Primero intentar detección rápida basada en imagen
  const fastResult = detectOrientationFast(canvas)
  
  if (fastResult.needsRotation && fastResult.confidence > 0.6) {
    const corrected = rotateImage(canvas, fastResult.angle)
    return {
      correctedCanvas: corrected,
      rotatedBy: fastResult.angle,
      wasRotated: true
    }
  }
  
  // Si no estamos seguros, intentar con OCR
  try {
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
    const ocrResult = await detectDocumentOrientation(imageUrl)
    
    if (ocrResult.needsRotation) {
      const corrected = rotateImage(canvas, ocrResult.angle)
      return {
        correctedCanvas: corrected,
        rotatedBy: ocrResult.angle,
        wasRotated: true
      }
    }
  } catch (error) {
    console.error('Error en auto-corrección de orientación:', error)
  }
  
  return {
    correctedCanvas: canvas,
    rotatedBy: 0,
    wasRotated: false
  }
}
