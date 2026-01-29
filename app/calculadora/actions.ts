'use server'

import { createClient } from '@/lib/supabase/server'
import { puedeCrearCalculo } from '@/lib/lawyer-verification-utils'

interface GuardarCalculoParams {
  pdfLiquidacionBlob: string // Base64 encoded
  pdfPropuestaBlob: string // Base64 encoded
  datosCalculo: {
    nombreEmpresa: string
    nombreTrabajador?: string
    puestoTrabajo?: string
    salarioDiario: number
    salarioMensual?: number
    fechaIngreso: string
    fechaSalida: string
    fechaDespido: string
    totalConciliacion: number
    totalJuicio: number
    totalJuicioBase: number
    antiguedadAnios: number
    antiguedadMeses?: number
    antiguedadDias?: number
    diasSalariosCaidosAlGuardar: number
  }
}

export async function guardarCalculoEnBoveda(params: GuardarCalculoParams) {
  try {
    const supabase = await createClient()
    
    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para guardar en tu bóveda',
        requiresAuth: true 
      }
    }
    
    // Obtener rol del usuario y contar calculos actuales
    const [{ data: profile }, { count: calculosActuales }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('calculos_liquidacion').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ])
    
    const rol = profile?.role || 'guest'
    
    // Verificar limite de calculos segun el rol
    const verificacionLimite = puedeCrearCalculo(rol, calculosActuales || 0)
    
    if (!verificacionLimite.permitido) {
      return {
        success: false,
        error: verificacionLimite.razon,
        limitReached: true,
        needsUpgrade: verificacionLimite.limitesAlcanzados,
        currentCount: calculosActuales,
        role: rol
      }
    }
    
    // Validar que los PDFs tengan contenido
    if (!params.pdfLiquidacionBlob || params.pdfLiquidacionBlob.length === 0) {
      return { success: false, error: 'No se recibió PDF de liquidación' }
    }
    if (!params.pdfPropuestaBlob || params.pdfPropuestaBlob.length === 0) {
      return { success: false, error: 'No se recibió PDF de propuesta' }
    }
    
    // Limpiar el base64 si tiene el prefijo data:
    let base64Liquidacion = params.pdfLiquidacionBlob
    if (base64Liquidacion.includes(',')) {
      base64Liquidacion = base64Liquidacion.split(',')[1]
    }
    
    let base64Propuesta = params.pdfPropuestaBlob
    if (base64Propuesta.includes(',')) {
      base64Propuesta = base64Propuesta.split(',')[1]
    }
    
    // Convertir base64 a Buffer y luego a Blob
    const bufferLiquidacion = Buffer.from(base64Liquidacion, 'base64')
    const bufferPropuesta = Buffer.from(base64Propuesta, 'base64')
    
    if (bufferLiquidacion.length === 0 || bufferPropuesta.length === 0) {
      return { success: false, error: 'Uno de los PDFs está vacío' }
    }
    
    // Crear Blobs desde los buffers
    const blobLiquidacion = new Blob([bufferLiquidacion], { type: 'application/pdf' })
    const blobPropuesta = new Blob([bufferPropuesta], { type: 'application/pdf' })
    
    // Generar nombres únicos para los archivos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filenameLiquidacion = `calculos/liquidacion-${timestamp}.pdf`
    const filenamePropuesta = `calculos/propuesta-${timestamp}.pdf`
    
    // Subir PDF de liquidación
    const { data: uploadLiquidacion, error: errorLiquidacion } = await supabase.storage
      .from('boveda')
      .upload(`${user.id}/${filenameLiquidacion}`, blobLiquidacion, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (errorLiquidacion) {
      console.error('Error subiendo PDF liquidación:', errorLiquidacion)
      return { success: false, error: 'Error al guardar el documento de liquidación' }
    }
    
    // Subir PDF de propuesta
    const { data: uploadPropuesta, error: errorPropuesta } = await supabase.storage
      .from('boveda')
      .upload(`${user.id}/${filenamePropuesta}`, blobPropuesta, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (errorPropuesta) {
      console.error('Error subiendo PDF propuesta:', errorPropuesta)
      return { success: false, error: 'Error al guardar la propuesta' }
    }
    
    // Guardar registro en la base de datos con nombre de empresa como identificador
    // Incluimos ambos paths en metadata para poder acceder a ambos PDFs
    const { error: dbError } = await supabase
      .from('documentos_boveda')
      .insert({
        user_id: user.id,
        categoria: 'calculo_liquidacion',
        nombre: params.datosCalculo.nombreEmpresa,
        nombre_original: `Liquidacion-${params.datosCalculo.nombreEmpresa}-${new Date().toLocaleDateString('es-MX')}.pdf`,
        descripcion: `Despido: ${params.datosCalculo.fechaSalida} | Conciliación: $${params.datosCalculo.totalConciliacion?.toLocaleString('es-MX')} | Juicio: $${params.datosCalculo.totalJuicio?.toLocaleString('es-MX')}`,
        archivo_path: uploadLiquidacion.path,
        mime_type: 'application/pdf',
        tamanio_bytes: bufferLiquidacion.length + bufferPropuesta.length,
        metadata: {
          ...params.datosCalculo,
          archivo_propuesta_path: uploadPropuesta.path // Guardamos el path de la propuesta en metadata
        },
        estado: 'activo'
      })
    
    if (dbError) {
      console.error('Error guardando en DB:', dbError)
      // Si falla la DB, igual se subió el archivo, así que retornamos éxito parcial
    }
    
    return { 
      success: true, 
      path: uploadLiquidacion.path,
      message: 'Cálculo guardado en tu bóveda'
    }
    
  } catch (error) {
    console.error('Error en guardarCalculoEnBoveda:', error)
    return { success: false, error: 'Error inesperado al guardar' }
  }
}

export async function obtenerCalculosGuardados() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'No autenticado', data: [] }
    }
    
    const { data, error } = await supabase
      .from('documentos_boveda')
      .select('*')
      .eq('user_id', user.id)
      .eq('categoria', 'calculo_liquidacion')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error obteniendo cálculos:', error)
      return { success: false, error: 'Error al obtener documentos', data: [] }
    }
    
    return { success: true, data }
    
  } catch (error) {
    console.error('Error en obtenerCalculosGuardados:', error)
    return { success: false, error: 'Error inesperado', data: [] }
  }
}

// Crear caso a partir del cálculo para recibir asesoría legal
interface CrearCasoParams {
  datosCalculo: {
    nombreEmpresa: string
    nombreTrabajador?: string
    puestoTrabajo?: string
    salarioDiario: number
    salarioMensual?: number
    fechaIngreso: string
    fechaSalida: string
    totalConciliacion: number
    totalJuicio: number
    antiguedadAnios: number
    antiguedadMeses?: number
    antiguedadDias?: number
  }
  ciudad?: string
  estado?: string
}

export async function crearCasoDesdeCalculo(params: CrearCasoParams) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para solicitar asesoría legal',
        requiresAuth: true 
      }
    }
    
    // Verificar si ya existe un caso abierto con esta empresa
    const { data: existingCases } = await supabase
      .from('casos')
      .select('id, folio, status')
      .eq('worker_id', user.id)
      .eq('empresa_nombre', params.datosCalculo.nombreEmpresa)
      .in('status', ['draft', 'open', 'assigned', 'in_progress'])
      .limit(1)
    
    const existingCase = existingCases?.[0]
    if (existingCase) {
      return {
        success: false,
        error: `Ya tienes un caso abierto con esta empresa (Folio: ${existingCase.folio})`,
        existingCaseId: existingCase.id,
        existingFolio: existingCase.folio
      }
    }
    
    // Crear el caso
    const { data: newCase, error: caseError } = await supabase
      .from('casos')
      .insert({
        worker_id: user.id,
        empresa_nombre: params.datosCalculo.nombreEmpresa,
        ciudad: params.ciudad || null,
        estado: params.estado || null,
        monto_estimado: params.datosCalculo.totalJuicio,
        status: 'open', // Abierto, pendiente de asignación
        metadata: {
          calculo: {
            salarioDiario: params.datosCalculo.salarioDiario,
            salarioMensual: params.datosCalculo.salarioMensual,
            fechaIngreso: params.datosCalculo.fechaIngreso,
            fechaSalida: params.datosCalculo.fechaSalida,
            totalConciliacion: params.datosCalculo.totalConciliacion,
            totalJuicio: params.datosCalculo.totalJuicio,
            antiguedad: {
              anios: params.datosCalculo.antiguedadAnios,
              meses: params.datosCalculo.antiguedadMeses,
              dias: params.datosCalculo.antiguedadDias
            }
          },
          nombreTrabajador: params.datosCalculo.nombreTrabajador,
          puestoTrabajo: params.datosCalculo.puestoTrabajo
        }
      })
      .select('id, folio')
      .single()
    
    if (caseError) {
      console.error('Error creando caso:', caseError)
      return { success: false, error: 'Error al crear el caso. Intenta de nuevo.' }
    }
    
    return {
      success: true,
      caseId: newCase.id,
      folio: newCase.folio,
      message: 'Caso creado exitosamente. Un abogado revisará tu caso pronto.'
    }
    
  } catch (error) {
    console.error('Error en crearCasoDesdeCalculo:', error)
    return { success: false, error: 'Error inesperado al crear el caso' }
  }
}

// Verificar límite de cálculos guardados por tipo de usuario
export async function verificarLimiteCalculos() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        success: false, 
        error: 'No autenticado', 
        requiresAuth: true,
        conteo: 0, 
        limite: 0, 
        puedeGuardar: false,
        tipoUsuario: 'guest' as const
      }
    }
    
    // Obtener tipo de usuario desde metadata o profiles
    const tipoUsuario = (user.user_metadata?.tipo_usuario || 'guest') as 'guest' | 'trabajador' | 'abogado' | 'admin'
    
    // Límites por tipo de usuario
    const limites: Record<string, number> = {
      guest: 3,
      trabajador: 5,
      abogado: 100,
      admin: 1000
    }
    
    const limite = limites[tipoUsuario] || 3
    
    // Contar cálculos guardados
    const { count, error } = await supabase
      .from('documentos_boveda')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('categoria', 'calculo_liquidacion')
      .eq('estado', 'activo')
    
    if (error) {
      console.error('Error contando cálculos:', error)
      return { 
        success: false, 
        error: error.message,
        conteo: 0, 
        limite, 
        puedeGuardar: false,
        tipoUsuario
      }
    }
    
    const conteo = count || 0
    const puedeGuardar = conteo < limite
    
    return { 
      success: true, 
      conteo, 
      limite, 
      puedeGuardar,
      tipoUsuario
    }
    
  } catch (error) {
    console.error('Error en verificarLimiteCalculos:', error)
    return { 
      success: false, 
      error: 'Error inesperado',
      conteo: 0, 
      limite: 0, 
      puedeGuardar: false,
      tipoUsuario: 'guest' as const
    }
  }
}
