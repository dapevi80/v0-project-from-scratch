'use server'

import { obtenerPortalCCL, registrarResultado, type UsuarioPrueba } from './diagnostico-service'

interface TestResult {
  estado: string
  conectividad: boolean
  formulario_detectado: boolean
  envio_exitoso: boolean
  pdf_obtenido: boolean
  tiempo_respuesta_ms: number
  error_mensaje?: string
  url_portal?: string
  pdf_base64?: string
}

// Prueba de conectividad básica al portal
async function probarConectividad(url: string, timeout: number = 15000): Promise<{ ok: boolean; tiempo: number; error?: string }> {
  const inicio = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    clearTimeout(timeoutId)
    const tiempo = Date.now() - inicio
    
    return {
      ok: response.ok || response.status === 405, // 405 es común en portales que no aceptan HEAD
      tiempo,
      error: response.ok ? undefined : `HTTP ${response.status}`
    }
  } catch (error) {
    return {
      ok: false,
      tiempo: Date.now() - inicio,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Modo DRY RUN: Solo prueba conectividad y detecta formularios
export async function ejecutarDryRun(
  sesionId: string,
  usuario: UsuarioPrueba
): Promise<TestResult> {
  const inicio = Date.now()
  
  // Obtener portal del estado
  const portal = await obtenerPortalCCL(usuario.estado)
  
  if (!portal) {
    return {
      estado: usuario.estado,
      conectividad: false,
      formulario_detectado: false,
      envio_exitoso: false,
      pdf_obtenido: false,
      tiempo_respuesta_ms: Date.now() - inicio,
      error_mensaje: 'Portal no configurado para este estado'
    }
  }
  
  if (!portal.tiene_sistema_en_linea) {
    return {
      estado: usuario.estado,
      conectividad: false,
      formulario_detectado: false,
      envio_exitoso: false,
      pdf_obtenido: false,
      tiempo_respuesta_ms: Date.now() - inicio,
      error_mensaje: 'Este CCL no tiene sistema en línea disponible',
      url_portal: portal.url_portal
    }
  }
  
  // Probar conectividad
  const conectividad = await probarConectividad(portal.url_portal)
  
  if (!conectividad.ok) {
    return {
      estado: usuario.estado,
      conectividad: false,
      formulario_detectado: false,
      envio_exitoso: false,
      pdf_obtenido: false,
      tiempo_respuesta_ms: conectividad.tiempo,
      error_mensaje: `Error de conectividad: ${conectividad.error}`,
      url_portal: portal.url_portal
    }
  }
  
  // En dry run, asumimos que el formulario existe si el portal responde
  // En producción, se haría web scraping para detectar campos
  const formularioDetectado = portal.metodo_envio !== 'manual'
  
  return {
    estado: usuario.estado,
    conectividad: true,
    formulario_detectado: formularioDetectado,
    envio_exitoso: false, // En dry run no enviamos
    pdf_obtenido: false,
    tiempo_respuesta_ms: conectividad.tiempo,
    url_portal: portal.url_portal
  }
}

// Modo LIVE: Intenta enviar solicitud real
export async function ejecutarLiveTest(
  sesionId: string,
  usuario: UsuarioPrueba
): Promise<TestResult> {
  const inicio = Date.now()
  
  // Primero hacer dry run
  const dryResult = await ejecutarDryRun(sesionId, usuario)
  
  if (!dryResult.conectividad) {
    return dryResult
  }
  
  const portal = await obtenerPortalCCL(usuario.estado)
  
  if (!portal || !portal.tiene_sistema_en_linea) {
    return {
      ...dryResult,
      error_mensaje: 'Portal sin sistema automatizable'
    }
  }
  
  // Aquí iría la lógica de automatización real con Puppeteer/Playwright
  // Por ahora simulamos el resultado basado en el tipo de portal
  
  try {
    // Simulación de envío según método del portal
    if (portal.metodo_envio === 'api') {
      // Portales con API REST
      return await simularEnvioAPI(portal, usuario, inicio)
    } else if (portal.metodo_envio === 'web_form') {
      // Portales con formulario web
      return await simularEnvioWebForm(portal, usuario, inicio)
    } else {
      // Portales que requieren proceso manual
      return {
        estado: usuario.estado,
        conectividad: true,
        formulario_detectado: true,
        envio_exitoso: false,
        pdf_obtenido: false,
        tiempo_respuesta_ms: Date.now() - inicio,
        error_mensaje: 'Portal requiere proceso manual o presencial',
        url_portal: portal.url_portal
      }
    }
  } catch (error) {
    return {
      estado: usuario.estado,
      conectividad: true,
      formulario_detectado: dryResult.formulario_detectado,
      envio_exitoso: false,
      pdf_obtenido: false,
      tiempo_respuesta_ms: Date.now() - inicio,
      error_mensaje: error instanceof Error ? error.message : 'Error en envío',
      url_portal: portal.url_portal
    }
  }
}

// Simulación de envío por API (para portales que lo soporten)
async function simularEnvioAPI(
  portal: { url_solicitud?: string; estado: string; url_portal: string },
  usuario: UsuarioPrueba,
  inicio: number
): Promise<TestResult> {
  // En producción, aquí se haría el POST real al endpoint del portal
  // Por ahora devolvemos resultado simulado
  
  // Simular tiempo de respuesta variable
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
  
  // Simulación: algunos portales "exitosos" para demostración
  const portalesConAPI = ['Ciudad de México', 'Nuevo León', 'Jalisco']
  const exito = portalesConAPI.includes(portal.estado)
  
  return {
    estado: portal.estado,
    conectividad: true,
    formulario_detectado: true,
    envio_exitoso: exito,
    pdf_obtenido: exito,
    tiempo_respuesta_ms: Date.now() - inicio,
    url_portal: portal.url_portal,
    error_mensaje: exito ? undefined : 'API no respondió correctamente',
    pdf_base64: exito ? 'SIMULADO_PDF_BASE64_PLACEHOLDER' : undefined
  }
}

// Simulación de envío por formulario web
async function simularEnvioWebForm(
  portal: { url_solicitud?: string; estado: string; url_portal: string; requiere_captcha?: boolean },
  usuario: UsuarioPrueba,
  inicio: number
): Promise<TestResult> {
  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000))
  
  // Si tiene captcha, marcamos como parcial
  if (portal.requiere_captcha) {
    return {
      estado: portal.estado,
      conectividad: true,
      formulario_detectado: true,
      envio_exitoso: false,
      pdf_obtenido: false,
      tiempo_respuesta_ms: Date.now() - inicio,
      error_mensaje: 'Portal requiere CAPTCHA - no automatizable',
      url_portal: portal.url_portal
    }
  }
  
  // Simulación: algunos estados con mayor probabilidad de éxito
  const probabilidadExito = Math.random()
  const exito = probabilidadExito > 0.6 // 40% de éxito simulado
  
  return {
    estado: portal.estado,
    conectividad: true,
    formulario_detectado: true,
    envio_exitoso: exito,
    pdf_obtenido: exito,
    tiempo_respuesta_ms: Date.now() - inicio,
    url_portal: portal.url_portal,
    error_mensaje: exito ? undefined : 'Error al procesar formulario',
    pdf_base64: exito ? 'SIMULADO_PDF_BASE64_PLACEHOLDER' : undefined
  }
}

// Función principal para ejecutar prueba individual
export async function ejecutarPrueba(
  sesionId: string,
  usuario: UsuarioPrueba,
  modo: 'dry_run' | 'live'
): Promise<TestResult> {
  let resultado: TestResult
  
  if (modo === 'dry_run') {
    resultado = await ejecutarDryRun(sesionId, usuario)
  } else {
    resultado = await ejecutarLiveTest(sesionId, usuario)
  }
  
  // Registrar resultado en BD
  await registrarResultado(sesionId, usuario.id!, usuario.estado, resultado)
  
  return resultado
}

// Ejecutar todas las pruebas de una sesión secuencialmente
export async function ejecutarTodasLasPruebas(
  sesionId: string,
  usuarios: UsuarioPrueba[],
  modo: 'dry_run' | 'live',
  onProgress?: (resultado: TestResult, index: number, total: number) => void
): Promise<TestResult[]> {
  const resultados: TestResult[] = []
  
  for (let i = 0; i < usuarios.length; i++) {
    const usuario = usuarios[i]
    const resultado = await ejecutarPrueba(sesionId, usuario, modo)
    resultados.push(resultado)
    
    if (onProgress) {
      onProgress(resultado, i + 1, usuarios.length)
    }
    
    // Pequeña pausa entre pruebas para no saturar
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return resultados
}
