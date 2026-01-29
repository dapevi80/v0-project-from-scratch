'use server'

import type { 
  BrowserSession, 
  BrowserAction, 
  BrowserActionResult,
  ScreenshotData,
  AgentStep 
} from './agent-types'

/**
 * Servicio de Browser Automation usando Browserless.io
 * Permite controlar un navegador Chrome en la nube para automatizar
 * el llenado de formularios en portales CCL/SINACOL
 */

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY
const BROWSERLESS_ENDPOINT = process.env.BROWSERLESS_ENDPOINT || 'https://chrome.browserless.io'

// Configuración por defecto del navegador
const DEFAULT_VIEWPORT = { width: 1920, height: 1080 }
const DEFAULT_TIMEOUT = 30000 // 30 segundos
const HUMAN_DELAY_MIN = 500 // Delay mínimo entre acciones (ms)
const HUMAN_DELAY_MAX = 1500 // Delay máximo entre acciones (ms)

/**
 * Genera un delay aleatorio para simular comportamiento humano
 */
function humanDelay(): number {
  return Math.floor(Math.random() * (HUMAN_DELAY_MAX - HUMAN_DELAY_MIN + 1)) + HUMAN_DELAY_MIN
}

/**
 * Crea una nueva sesión de navegador en Browserless
 */
export async function createBrowserSession(jobId: string): Promise<BrowserSession> {
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY no configurada. Configura la variable de entorno.')
  }

  const sessionId = `ccl-agent-${jobId}-${Date.now()}`
  
  // Iniciar sesión con Browserless
  const response = await fetch(`${BROWSERLESS_ENDPOINT}/session?token=${BROWSERLESS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      stealth: true, // Modo stealth para evitar detección
      viewport: DEFAULT_VIEWPORT,
      timeout: 300000, // 5 minutos de timeout total
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error creando sesión de browser: ${error}`)
  }

  const data = await response.json()

  return {
    sessionId,
    wsEndpoint: data.browserWSEndpoint || data.wsEndpoint,
    status: 'active',
    createdAt: new Date()
  }
}

/**
 * Ejecuta una acción en el navegador
 */
export async function executeBrowserAction(
  session: BrowserSession,
  action: BrowserAction
): Promise<BrowserActionResult> {
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY no configurada')
  }

  const startTime = Date.now()

  try {
    // Agregar delay humano antes de cada acción
    await new Promise(resolve => setTimeout(resolve, humanDelay()))

    // Construir el script de Puppeteer según la acción
    const script = buildPuppeteerScript(action)

    const response = await fetch(`${BROWSERLESS_ENDPOINT}/function?token=${BROWSERLESS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: script,
        context: {
          sessionId: session.sessionId,
          action,
          timeout: DEFAULT_TIMEOUT
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: `Error ejecutando acción ${action.type}: ${error}`,
        duration: Date.now() - startTime
      }
    }

    const result = await response.json()

    return {
      success: true,
      data: result.data,
      screenshot: result.screenshot,
      duration: Date.now() - startTime
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration: Date.now() - startTime
    }
  }
}

/**
 * Navega a una URL
 */
export async function navigateTo(session: BrowserSession, url: string): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'navigate',
    url,
    waitFor: 'networkidle0'
  })
}

/**
 * Llena un campo de texto
 */
export async function fillInput(
  session: BrowserSession, 
  selector: string, 
  value: string,
  options?: { clearFirst?: boolean; delay?: number }
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'fill',
    selector,
    value,
    options: {
      clearFirst: options?.clearFirst ?? true,
      delay: options?.delay ?? 50 // Delay entre teclas para simular escritura humana
    }
  })
}

/**
 * Hace click en un elemento
 */
export async function clickElement(
  session: BrowserSession, 
  selector: string,
  options?: { waitForNavigation?: boolean }
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'click',
    selector,
    options: {
      waitForNavigation: options?.waitForNavigation ?? false
    }
  })
}

/**
 * Selecciona una opción de un dropdown
 */
export async function selectOption(
  session: BrowserSession, 
  selector: string, 
  value: string
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'select',
    selector,
    value
  })
}

/**
 * Toma un screenshot de la página actual
 */
export async function takeScreenshot(
  session: BrowserSession,
  options?: { selector?: string; fullPage?: boolean }
): Promise<ScreenshotData | null> {
  const result = await executeBrowserAction(session, {
    type: 'screenshot',
    options: {
      selector: options?.selector,
      fullPage: options?.fullPage ?? false,
      encoding: 'base64'
    }
  })

  if (result.success && result.screenshot) {
    return {
      base64: result.screenshot,
      mimeType: 'image/png',
      timestamp: new Date()
    }
  }

  return null
}

/**
 * Espera a que un elemento sea visible
 */
export async function waitForElement(
  session: BrowserSession, 
  selector: string,
  timeout?: number
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'wait',
    selector,
    options: { timeout: timeout ?? DEFAULT_TIMEOUT }
  })
}

/**
 * Extrae texto de un elemento
 */
export async function extractText(
  session: BrowserSession, 
  selector: string
): Promise<string | null> {
  const result = await executeBrowserAction(session, {
    type: 'extract',
    selector,
    extractType: 'text'
  })

  return result.success ? (result.data as string) : null
}

/**
 * Extrae el HTML de un elemento
 */
export async function extractHTML(
  session: BrowserSession, 
  selector: string
): Promise<string | null> {
  const result = await executeBrowserAction(session, {
    type: 'extract',
    selector,
    extractType: 'html'
  })

  return result.success ? (result.data as string) : null
}

/**
 * Sube un archivo a un input de tipo file
 */
export async function uploadFile(
  session: BrowserSession,
  selector: string,
  fileUrl: string
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'upload',
    selector,
    fileUrl
  })
}

/**
 * Obtiene la URL actual del navegador
 */
export async function getCurrentUrl(session: BrowserSession): Promise<string | null> {
  const result = await executeBrowserAction(session, {
    type: 'evaluate',
    script: 'window.location.href'
  })

  return result.success ? (result.data as string) : null
}

/**
 * Ejecuta JavaScript en el contexto de la página
 */
export async function evaluateScript(
  session: BrowserSession, 
  script: string
): Promise<BrowserActionResult> {
  return executeBrowserAction(session, {
    type: 'evaluate',
    script
  })
}

/**
 * Cierra la sesión del navegador
 */
export async function closeBrowserSession(session: BrowserSession): Promise<void> {
  if (!BROWSERLESS_API_KEY) return

  try {
    await fetch(`${BROWSERLESS_ENDPOINT}/session/${session.sessionId}?token=${BROWSERLESS_API_KEY}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('Error cerrando sesión de browser:', error)
  }
}

/**
 * Construye el script de Puppeteer para una acción específica
 */
function buildPuppeteerScript(action: BrowserAction): string {
  switch (action.type) {
    case 'navigate':
      return `
        module.exports = async ({ page, context }) => {
          await page.goto(context.action.url, { 
            waitUntil: context.action.waitFor || 'networkidle0',
            timeout: context.timeout 
          });
          return { data: await page.url() };
        };
      `

    case 'fill':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, value, options } = context.action;
          await page.waitForSelector(selector, { timeout: context.timeout });
          if (options?.clearFirst) {
            await page.click(selector, { clickCount: 3 });
            await page.keyboard.press('Backspace');
          }
          await page.type(selector, value, { delay: options?.delay || 50 });
          return { data: true };
        };
      `

    case 'click':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, options } = context.action;
          await page.waitForSelector(selector, { timeout: context.timeout });
          if (options?.waitForNavigation) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'networkidle0' }),
              page.click(selector)
            ]);
          } else {
            await page.click(selector);
          }
          return { data: true };
        };
      `

    case 'select':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, value } = context.action;
          await page.waitForSelector(selector, { timeout: context.timeout });
          await page.select(selector, value);
          return { data: true };
        };
      `

    case 'screenshot':
      return `
        module.exports = async ({ page, context }) => {
          const { options } = context.action;
          let screenshotOptions = { encoding: 'base64' };
          if (options?.selector) {
            const element = await page.$(options.selector);
            if (element) {
              screenshotOptions.clip = await element.boundingBox();
            }
          } else if (options?.fullPage) {
            screenshotOptions.fullPage = true;
          }
          const screenshot = await page.screenshot(screenshotOptions);
          return { screenshot };
        };
      `

    case 'wait':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, options } = context.action;
          await page.waitForSelector(selector, { 
            timeout: options?.timeout || context.timeout,
            visible: true 
          });
          return { data: true };
        };
      `

    case 'extract':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, extractType } = context.action;
          await page.waitForSelector(selector, { timeout: context.timeout });
          const element = await page.$(selector);
          if (!element) return { data: null };
          
          if (extractType === 'text') {
            const text = await page.evaluate(el => el.textContent, element);
            return { data: text?.trim() };
          } else if (extractType === 'html') {
            const html = await page.evaluate(el => el.innerHTML, element);
            return { data: html };
          }
          return { data: null };
        };
      `

    case 'upload':
      return `
        module.exports = async ({ page, context }) => {
          const { selector, fileUrl } = context.action;
          const inputElement = await page.waitForSelector(selector, { timeout: context.timeout });
          // Descargar archivo temporalmente y subirlo
          const response = await fetch(fileUrl);
          const buffer = await response.buffer();
          const path = '/tmp/upload-' + Date.now();
          require('fs').writeFileSync(path, buffer);
          await inputElement.uploadFile(path);
          return { data: true };
        };
      `

    case 'evaluate':
      return `
        module.exports = async ({ page, context }) => {
          const result = await page.evaluate(() => ${action.script});
          return { data: result };
        };
      `

    default:
      throw new Error(`Tipo de acción no soportada: ${(action as BrowserAction).type}`)
  }
}

/**
 * Verifica si el servicio de Browserless está disponible
 */
export async function checkBrowserlessStatus(): Promise<{ available: boolean; error?: string }> {
  if (!BROWSERLESS_API_KEY) {
    return { 
      available: false, 
      error: 'BROWSERLESS_API_KEY no configurada. Registrate en browserless.io para obtener una.' 
    }
  }

  try {
    const response = await fetch(`${BROWSERLESS_ENDPOINT}/pressure?token=${BROWSERLESS_API_KEY}`)
    
    if (!response.ok) {
      return { available: false, error: 'Error conectando con Browserless' }
    }

    const data = await response.json()
    return { 
      available: true,
      error: data.isAvailable === false ? 'Browserless está bajo alta carga' : undefined
    }
  } catch (error) {
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    }
  }
}
