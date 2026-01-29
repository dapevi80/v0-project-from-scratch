'use server'

import type { BrowserSession, CasoData, AgentStep, FormFieldMapping } from './agent-types'
import {
  navigateTo,
  fillInput,
  clickElement,
  selectOption,
  takeScreenshot,
  waitForElement,
  extractText,
  evaluateScript
} from './browser-service'
import { solveCaptcha, detectCaptchaPresence } from './captcha-solver'

/**
 * Form Filler para portales CCL/SINACOL
 * Automatiza el llenado de formularios de solicitud de conciliación
 */

// Mapeo de campos comunes en formularios SINACOL
const SINACOL_SELECTORS = {
  // Paso 1: Industria o Servicio
  industria: {
    select: 'select[name*="industria"], select[name*="sector"], #industria',
    comercio: 'option[value*="comercio"], option:contains("Comercio")',
    servicios: 'option[value*="servicio"], option:contains("Servicios")'
  },
  
  // Paso 2: Datos de la solicitud
  solicitud: {
    tipoConflicto: 'select[name*="tipo_conflicto"], select[name*="tipoConflicto"]',
    individual: 'option[value*="individual"], option:contains("Individual")'
  },
  
  // Paso 3: Datos del solicitante (trabajador)
  solicitante: {
    nombre: 'input[name*="nombre_solicitante"], input[name*="nombreSolicitante"], input[id*="nombre"]',
    apellidoPaterno: 'input[name*="apellido_paterno"], input[name*="apellidoPaterno"], input[id*="paterno"]',
    apellidoMaterno: 'input[name*="apellido_materno"], input[name*="apellidoMaterno"], input[id*="materno"]',
    curp: 'input[name*="curp"], input[id*="curp"]',
    rfc: 'input[name*="rfc"], input[id*="rfc"]',
    telefono: 'input[name*="telefono"], input[name*="phone"], input[id*="telefono"]',
    email: 'input[name*="email"], input[name*="correo"], input[type="email"]',
    calle: 'input[name*="calle"], input[id*="calle"]',
    numero: 'input[name*="numero"], input[id*="numero"]',
    colonia: 'input[name*="colonia"], input[id*="colonia"]',
    codigoPostal: 'input[name*="codigo_postal"], input[name*="cp"], input[id*="cp"]',
    estado: 'select[name*="estado"], select[id*="estado"]',
    municipio: 'select[name*="municipio"], input[name*="municipio"]'
  },
  
  // Paso 4: Datos del citado (empleador)
  citado: {
    tipoPersona: 'select[name*="tipo_persona"], input[name*="tipoPersona"]',
    personaFisica: 'input[value="fisica"], option[value*="fisica"]',
    personaMoral: 'input[value="moral"], option[value*="moral"]',
    razonSocial: 'input[name*="razon_social"], input[name*="razonSocial"], input[id*="razon"]',
    nombreComercial: 'input[name*="nombre_comercial"], input[name*="nombreComercial"]',
    rfc: 'input[name*="rfc_citado"], input[name*="rfcCitado"]',
    calle: 'input[name*="calle_citado"], input[name*="calleCitado"]',
    numero: 'input[name*="numero_citado"], input[name*="numeroCitado"]',
    colonia: 'input[name*="colonia_citado"], input[name*="coloniaCitado"]',
    codigoPostal: 'input[name*="cp_citado"], input[name*="cpCitado"]',
    estado: 'select[name*="estado_citado"], select[name*="estadoCitado"]',
    municipio: 'select[name*="municipio_citado"], input[name*="municipioCitado"]'
  },
  
  // Paso 5: Descripción de hechos
  hechos: {
    fechaIngreso: 'input[name*="fecha_ingreso"], input[type="date"][name*="ingreso"]',
    fechaTerminacion: 'input[name*="fecha_terminacion"], input[type="date"][name*="terminacion"]',
    salario: 'input[name*="salario"], input[id*="salario"]',
    puesto: 'input[name*="puesto"], input[id*="puesto"]',
    descripcion: 'textarea[name*="descripcion"], textarea[name*="hechos"], textarea[id*="hechos"]'
  },
  
  // Paso 6: Tipo de atención
  atencion: {
    modalidad: 'input[name*="modalidad"], input[name*="tipo_atencion"]',
    virtual: 'input[value*="virtual"], input[value*="remota"], label:contains("virtual")',
    presencial: 'input[value*="presencial"], label:contains("presencial")'
  },
  
  // Navegación
  navigation: {
    siguiente: 'button:contains("Siguiente"), button:contains("Continuar"), button[type="submit"]:contains("Validar"), .btn-next',
    anterior: 'button:contains("Regresar"), button:contains("Anterior"), .btn-prev',
    enviar: 'button:contains("Enviar"), button:contains("Finalizar"), button[type="submit"]:contains("Enviar")',
    cancelar: 'button:contains("Cancelar"), a:contains("Cancelar")'
  },
  
  // CAPTCHA
  captcha: {
    image: 'img[src*="captcha"], img[alt*="captcha"], .captcha-image',
    input: 'input[name*="captcha"], input[id*="captcha"], input[placeholder*="captcha"]',
    refresh: 'button[onclick*="captcha"], a[onclick*="captcha"], .refresh-captcha'
  }
}

/**
 * Resultado de un paso del formulario
 */
interface StepResult {
  success: boolean
  error?: string
  screenshot?: string
  nextStepDetected?: boolean
}

/**
 * Llena el Paso 1: Industria o Servicio
 */
export async function llenarPaso1Industria(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    // Esperar a que cargue el formulario
    await waitForElement(session, SINACOL_SELECTORS.industria.select, 10000)
    
    // Seleccionar industria - por defecto "Comercio y Servicios"
    const industria = caso.giroEmpresa?.toLowerCase() || 'servicios'
    
    // Intentar seleccionar la opción más apropiada
    await selectOption(session, SINACOL_SELECTORS.industria.select, industria)
    
    // Tomar screenshot de evidencia
    const screenshot = await takeScreenshot(session)
    
    // Click en siguiente
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 1 (Industria): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Llena el Paso 2: Datos de la Solicitud
 */
export async function llenarPaso2Solicitud(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    await waitForElement(session, SINACOL_SELECTORS.solicitud.tipoConflicto, 10000)
    
    // Tipo de conflicto: Individual
    await selectOption(session, SINACOL_SELECTORS.solicitud.tipoConflicto, 'individual')
    
    const screenshot = await takeScreenshot(session)
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 2 (Solicitud): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Llena el Paso 3: Datos del Solicitante (Trabajador)
 */
export async function llenarPaso3Solicitante(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    // Parsear nombre completo
    const nombreParts = caso.trabajadorNombre.split(' ')
    const nombre = nombreParts[0] || ''
    const apellidoPaterno = nombreParts[1] || ''
    const apellidoMaterno = nombreParts.slice(2).join(' ') || ''
    
    // Llenar datos básicos
    await fillInput(session, SINACOL_SELECTORS.solicitante.nombre, nombre)
    await fillInput(session, SINACOL_SELECTORS.solicitante.apellidoPaterno, apellidoPaterno)
    
    if (apellidoMaterno) {
      await fillInput(session, SINACOL_SELECTORS.solicitante.apellidoMaterno, apellidoMaterno)
    }
    
    // CURP (si disponible)
    if (caso.trabajadorCurp) {
      await fillInput(session, SINACOL_SELECTORS.solicitante.curp, caso.trabajadorCurp)
    }
    
    // Teléfono
    if (caso.trabajadorTelefono) {
      await fillInput(session, SINACOL_SELECTORS.solicitante.telefono, caso.trabajadorTelefono)
    }
    
    // Email
    if (caso.trabajadorEmail) {
      await fillInput(session, SINACOL_SELECTORS.solicitante.email, caso.trabajadorEmail)
    }
    
    // Dirección (si disponible y parseamos)
    if (caso.trabajadorDomicilio) {
      await fillInput(session, SINACOL_SELECTORS.solicitante.calle, caso.trabajadorDomicilio)
    }
    
    // Estado
    if (caso.trabajadorEstado) {
      await selectOption(session, SINACOL_SELECTORS.solicitante.estado, caso.trabajadorEstado)
    }
    
    const screenshot = await takeScreenshot(session)
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 3 (Solicitante): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Llena el Paso 4: Datos del Citado (Empleador)
 */
export async function llenarPaso4Citado(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    // Tipo de persona
    const tipoPersonaSelector = caso.citadoTipoPersona === 'fisica' 
      ? SINACOL_SELECTORS.citado.personaFisica 
      : SINACOL_SELECTORS.citado.personaMoral
    
    await clickElement(session, tipoPersonaSelector)
    
    // Razón social / Nombre
    await fillInput(session, SINACOL_SELECTORS.citado.razonSocial, caso.empleadorNombre)
    
    // RFC (si disponible)
    if (caso.empleadorRfc) {
      await fillInput(session, SINACOL_SELECTORS.citado.rfc, caso.empleadorRfc)
    }
    
    // Dirección
    if (caso.empleadorDomicilio) {
      await fillInput(session, SINACOL_SELECTORS.citado.calle, caso.empleadorDomicilio)
    }
    
    // Estado
    if (caso.empleadorEstado) {
      await selectOption(session, SINACOL_SELECTORS.citado.estado, caso.empleadorEstado)
    }
    
    const screenshot = await takeScreenshot(session)
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 4 (Citado): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Llena el Paso 5: Descripción de los Hechos
 */
export async function llenarPaso5Hechos(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    // Fechas
    if (caso.fechaIngreso) {
      await fillInput(session, SINACOL_SELECTORS.hechos.fechaIngreso, caso.fechaIngreso)
    }
    
    if (caso.fechaTerminacion) {
      await fillInput(session, SINACOL_SELECTORS.hechos.fechaTerminacion, caso.fechaTerminacion)
    }
    
    // Salario
    if (caso.salarioDiario) {
      await fillInput(session, SINACOL_SELECTORS.hechos.salario, caso.salarioDiario.toString())
    }
    
    // Puesto
    if (caso.puestoTrabajo) {
      await fillInput(session, SINACOL_SELECTORS.hechos.puesto, caso.puestoTrabajo)
    }
    
    // Descripción de hechos
    const descripcion = caso.descripcionHechos || generarDescripcionHechos(caso)
    await fillInput(session, SINACOL_SELECTORS.hechos.descripcion, descripcion)
    
    const screenshot = await takeScreenshot(session)
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 5 (Hechos): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Llena el Paso 6: Tipo de Atención (Modalidad)
 */
export async function llenarPaso6Atencion(
  session: BrowserSession,
  caso: CasoData
): Promise<StepResult> {
  try {
    // Seleccionar modalidad
    const modalidadSelector = caso.modalidadConciliacion === 'remota'
      ? SINACOL_SELECTORS.atencion.virtual
      : SINACOL_SELECTORS.atencion.presencial
    
    await clickElement(session, modalidadSelector)
    
    // Si es virtual, puede requerir subir identificación
    // TODO: Implementar upload de INE si es necesario
    
    const screenshot = await takeScreenshot(session)
    await clickElement(session, SINACOL_SELECTORS.navigation.siguiente, { waitForNavigation: true })
    
    return {
      success: true,
      screenshot: screenshot?.base64,
      nextStepDetected: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 6 (Atención): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Procesa el Paso 7: Resumen y Envío
 */
export async function procesarPaso7Resumen(
  session: BrowserSession
): Promise<StepResult> {
  try {
    // Verificar si hay CAPTCHA
    const fullScreenshot = await takeScreenshot(session, { fullPage: true })
    
    if (fullScreenshot) {
      const captchaDetection = await detectCaptchaPresence(fullScreenshot)
      
      if (captchaDetection.hasCaptcha) {
        // Intentar resolver CAPTCHA
        const captchaScreenshot = await takeScreenshot(session, { 
          selector: SINACOL_SELECTORS.captcha.image 
        })
        
        if (captchaScreenshot) {
          const solution = await solveCaptcha(captchaScreenshot)
          
          if (solution.success && solution.solution) {
            await fillInput(session, SINACOL_SELECTORS.captcha.input, solution.solution)
          } else {
            return {
              success: false,
              error: `No se pudo resolver el CAPTCHA: ${solution.error}`,
              screenshot: fullScreenshot.base64
            }
          }
        }
      }
    }
    
    // Enviar formulario
    await clickElement(session, SINACOL_SELECTORS.navigation.enviar, { waitForNavigation: true })
    
    // Esperar a que cargue la página de confirmación
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const finalScreenshot = await takeScreenshot(session, { fullPage: true })
    
    return {
      success: true,
      screenshot: finalScreenshot?.base64
    }
  } catch (error) {
    return {
      success: false,
      error: `Error en Paso 7 (Envío): ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Genera una descripción de hechos básica si no se proporciona
 */
function generarDescripcionHechos(caso: CasoData): string {
  const tipoTerminacion = caso.tipoTerminacion === 'despido' 
    ? 'fui despedido injustificadamente'
    : caso.tipoTerminacion === 'rescision'
    ? 'rescindí la relación laboral por causas imputables al patrón'
    : 'me vi obligado a renunciar por las condiciones laborales'
  
  let descripcion = `El que suscribe ${caso.trabajadorNombre}, `
  descripcion += `laboró para ${caso.empleadorNombre} `
  
  if (caso.fechaIngreso) {
    descripcion += `desde el ${caso.fechaIngreso} `
  }
  
  if (caso.fechaTerminacion) {
    descripcion += `hasta el ${caso.fechaTerminacion}, fecha en que ${tipoTerminacion}. `
  }
  
  if (caso.puestoTrabajo) {
    descripcion += `Desempeñé el puesto de ${caso.puestoTrabajo}. `
  }
  
  if (caso.salarioDiario) {
    descripcion += `Mi salario diario era de $${caso.salarioDiario} pesos. `
  }
  
  descripcion += `Solicito se cite al patrón para intentar llegar a un arreglo conciliatorio.`
  
  return descripcion
}

/**
 * Detecta en qué paso del formulario se encuentra actualmente
 */
export async function detectarPasoActual(session: BrowserSession): Promise<number> {
  try {
    // Buscar indicador de paso en la URL o en el DOM
    const url = await evaluateScript(session, 'window.location.href')
    
    if (url.success && typeof url.data === 'string') {
      // Buscar patrones como /paso/1, step=2, etc.
      const stepMatch = url.data.match(/paso[\/=]?(\d+)|step[\/=]?(\d+)/i)
      if (stepMatch) {
        return parseInt(stepMatch[1] || stepMatch[2], 10)
      }
    }
    
    // Buscar en el DOM indicadores de progreso
    const stepIndicator = await extractText(session, '.step-indicator, .progress-step.active, .paso-actual')
    if (stepIndicator) {
      const numMatch = stepIndicator.match(/(\d+)/)
      if (numMatch) {
        return parseInt(numMatch[1], 10)
      }
    }
    
    return 1 // Por defecto, asumir paso 1
  } catch {
    return 1
  }
}

/**
 * Ejecuta todos los pasos del formulario en secuencia
 */
export async function ejecutarFormularioCompleto(
  session: BrowserSession,
  caso: CasoData,
  onStepComplete?: (step: number, result: StepResult) => void
): Promise<{
  success: boolean
  completedSteps: number
  error?: string
  screenshots: string[]
}> {
  const screenshots: string[] = []
  
  const pasos = [
    { num: 1, fn: () => llenarPaso1Industria(session, caso), name: 'Industria' },
    { num: 2, fn: () => llenarPaso2Solicitud(session, caso), name: 'Solicitud' },
    { num: 3, fn: () => llenarPaso3Solicitante(session, caso), name: 'Solicitante' },
    { num: 4, fn: () => llenarPaso4Citado(session, caso), name: 'Citado' },
    { num: 5, fn: () => llenarPaso5Hechos(session, caso), name: 'Hechos' },
    { num: 6, fn: () => llenarPaso6Atencion(session, caso), name: 'Atención' },
    { num: 7, fn: () => procesarPaso7Resumen(session), name: 'Resumen' }
  ]
  
  for (const paso of pasos) {
    const result = await paso.fn()
    
    if (result.screenshot) {
      screenshots.push(result.screenshot)
    }
    
    onStepComplete?.(paso.num, result)
    
    if (!result.success) {
      return {
        success: false,
        completedSteps: paso.num - 1,
        error: result.error,
        screenshots
      }
    }
    
    // Pequeña pausa entre pasos
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return {
    success: true,
    completedSteps: 7,
    screenshots
  }
}
