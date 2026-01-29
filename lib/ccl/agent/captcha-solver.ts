'use server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { ScreenshotData, CaptchaSolution } from './agent-types'

/**
 * Servicio de resolución de CAPTCHAs usando Grok Vision
 * Analiza imágenes de CAPTCHA y extrae el texto/números
 */

// Usar Grok a través de AI Gateway de Vercel
const AI_MODEL = 'xai/grok-2-vision-latest'

/**
 * Tipos de CAPTCHA que podemos encontrar en portales CCL
 */
export type CaptchaType = 
  | 'text'           // Texto distorsionado
  | 'math'           // Operación matemática simple
  | 'image-select'   // Seleccionar imágenes
  | 'recaptcha'      // Google reCAPTCHA (requiere servicio externo)
  | 'unknown'

/**
 * Detecta el tipo de CAPTCHA basado en la imagen
 */
export async function detectCaptchaType(screenshot: ScreenshotData): Promise<CaptchaType> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Analiza esta imagen de CAPTCHA y determina su tipo.
              
Responde SOLO con una de estas opciones:
- "text" si es texto o números distorsionados que hay que escribir
- "math" si es una operación matemática (suma, resta, etc.)
- "image-select" si hay que seleccionar imágenes específicas
- "recaptcha" si es un CAPTCHA de Google reCAPTCHA
- "unknown" si no puedes identificar el tipo

Responde SOLO con la palabra, sin explicación.`
            }
          ]
        }
      ],
      maxTokens: 50
    })

    const type = response.text.trim().toLowerCase() as CaptchaType
    
    if (['text', 'math', 'image-select', 'recaptcha', 'unknown'].includes(type)) {
      return type
    }
    
    return 'unknown'
  } catch (error) {
    console.error('Error detectando tipo de CAPTCHA:', error)
    return 'unknown'
  }
}

/**
 * Resuelve un CAPTCHA de texto/números distorsionados
 */
export async function solveTextCaptcha(screenshot: ScreenshotData): Promise<CaptchaSolution> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Observa esta imagen de CAPTCHA con texto o números distorsionados.

Tu tarea es extraer EXACTAMENTE los caracteres que ves en la imagen.

Reglas:
1. Lee cuidadosamente cada caracter
2. Distingue entre letras similares (0/O, 1/I/l, 5/S, etc.)
3. Respeta mayúsculas y minúsculas si aplica
4. No incluyas espacios a menos que sean claramente visibles
5. Si hay ruido o líneas, ignóralos y enfócate en los caracteres principales

Responde SOLO con los caracteres del CAPTCHA, sin explicación ni formato adicional.
Por ejemplo: "X7kM2n" o "384729"`
            }
          ]
        }
      ],
      maxTokens: 100
    })

    const solution = response.text.trim()
    
    // Validar que la respuesta parece un CAPTCHA válido
    if (solution.length < 3 || solution.length > 10) {
      return {
        success: false,
        error: 'La solución no parece válida (longitud incorrecta)',
        confidence: 0.3
      }
    }

    return {
      success: true,
      solution,
      confidence: 0.85, // Grok Vision es bastante preciso
      type: 'text'
    }
  } catch (error) {
    console.error('Error resolviendo CAPTCHA de texto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      confidence: 0
    }
  }
}

/**
 * Resuelve un CAPTCHA matemático (suma, resta, etc.)
 */
export async function solveMathCaptcha(screenshot: ScreenshotData): Promise<CaptchaSolution> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Esta imagen contiene un CAPTCHA con una operación matemática.

Tu tarea:
1. Identifica los números y la operación (suma +, resta -, multiplicación ×, etc.)
2. Calcula el resultado
3. Responde SOLO con el número resultado, sin explicación

Por ejemplo, si ves "5 + 3 = ?" responde: 8
Si ves "12 - 4 = ?" responde: 8`
            }
          ]
        }
      ],
      maxTokens: 50
    })

    const solution = response.text.trim()
    
    // Validar que es un número
    if (!/^\d+$/.test(solution)) {
      return {
        success: false,
        error: 'La solución no es un número válido',
        confidence: 0.3
      }
    }

    return {
      success: true,
      solution,
      confidence: 0.95, // Matemáticas son más fáciles de resolver
      type: 'math'
    }
  } catch (error) {
    console.error('Error resolviendo CAPTCHA matemático:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      confidence: 0
    }
  }
}

/**
 * Intenta resolver cualquier tipo de CAPTCHA
 * Detecta automáticamente el tipo y aplica la estrategia correcta
 */
export async function solveCaptcha(screenshot: ScreenshotData): Promise<CaptchaSolution> {
  // Primero detectamos el tipo
  const captchaType = await detectCaptchaType(screenshot)
  
  switch (captchaType) {
    case 'text':
      return solveTextCaptcha(screenshot)
    
    case 'math':
      return solveMathCaptcha(screenshot)
    
    case 'recaptcha':
      return {
        success: false,
        error: 'reCAPTCHA de Google detectado. Este tipo requiere intervención manual o un servicio especializado como 2Captcha.',
        type: 'recaptcha',
        confidence: 0
      }
    
    case 'image-select':
      return {
        success: false,
        error: 'CAPTCHA de selección de imágenes detectado. Este tipo es complejo y puede requerir múltiples intentos.',
        type: 'image-select',
        confidence: 0
      }
    
    default:
      // Intentar como texto por defecto
      const result = await solveTextCaptcha(screenshot)
      result.type = 'unknown'
      return result
  }
}

/**
 * Analiza si una página contiene un CAPTCHA
 */
export async function detectCaptchaPresence(screenshot: ScreenshotData): Promise<{
  hasCaptcha: boolean
  captchaSelector?: string
  inputSelector?: string
  submitSelector?: string
}> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Analiza esta captura de pantalla de un formulario web.

Determina si hay un CAPTCHA visible en la página.

Responde en formato JSON:
{
  "hasCaptcha": true/false,
  "description": "breve descripción de lo que ves"
}

Busca:
- Imágenes con texto/números distorsionados
- Casillas de verificación "No soy un robot"
- Operaciones matemáticas para verificar
- Instrucciones de "escriba los caracteres"
- Campos de entrada cerca de imágenes de verificación`
            }
          ]
        }
      ],
      maxTokens: 200
    })

    try {
      const result = JSON.parse(response.text)
      return {
        hasCaptcha: result.hasCaptcha === true
      }
    } catch {
      // Si no puede parsear, buscar indicadores en el texto
      const text = response.text.toLowerCase()
      return {
        hasCaptcha: text.includes('captcha') || 
                    text.includes('verificación') || 
                    text.includes('robot') ||
                    text.includes('true')
      }
    }
  } catch (error) {
    console.error('Error detectando CAPTCHA:', error)
    return { hasCaptcha: false }
  }
}

/**
 * Verifica si la solución del CAPTCHA fue aceptada
 * Analiza la página después de enviar para detectar errores
 */
export async function verifyCaptchaSolution(screenshot: ScreenshotData): Promise<{
  accepted: boolean
  error?: string
}> {
  try {
    const response = await generateText({
      model: AI_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${screenshot.mimeType};base64,${screenshot.base64}`
            },
            {
              type: 'text',
              text: `Analiza esta captura de pantalla después de enviar un formulario.

Determina si:
1. El CAPTCHA fue aceptado correctamente (la página avanzó o muestra éxito)
2. El CAPTCHA fue rechazado (muestra error, mensaje de "código incorrecto", etc.)

Responde en formato JSON:
{
  "accepted": true/false,
  "reason": "explicación breve"
}`
            }
          ]
        }
      ],
      maxTokens: 150
    })

    try {
      const result = JSON.parse(response.text)
      return {
        accepted: result.accepted === true,
        error: result.accepted ? undefined : result.reason
      }
    } catch {
      // Por defecto asumir que funcionó si no hay errores claros
      const text = response.text.toLowerCase()
      const hasError = text.includes('error') || 
                       text.includes('incorrecto') || 
                       text.includes('inválido') ||
                       text.includes('false')
      return {
        accepted: !hasError,
        error: hasError ? 'Posible error en CAPTCHA' : undefined
      }
    }
  } catch (error) {
    console.error('Error verificando solución:', error)
    return { accepted: false, error: 'Error al verificar' }
  }
}
