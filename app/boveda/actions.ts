'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Buffer } from 'buffer'

// Tipos para la bóveda
export type CategoriaDocumento = 
  | 'calculo_liquidacion'
  | 'propuesta_empresa'
  | 'evidencia_foto'
  | 'evidencia_video'
  | 'evidencia_audio'
  | 'grabacion_audio'
  | 'contrato_laboral'
  | 'hoja_renuncia'
  | 'ine_frente'
  | 'ine_reverso'
  | 'pasaporte'
  | 'comprobante_domicilio'
  | 'otro'

export interface DocumentoBoveda {
  id: string
  user_id: string
  categoria: CategoriaDocumento
  subcategoria?: string
  nombre: string
  nombre_original?: string
  descripcion?: string
  archivo_path: string
  archivo_url?: string
  mime_type?: string
  tamanio_bytes?: number
  metadata?: Record<string, unknown>
  estado: 'activo' | 'archivado' | 'eliminado'
  verificado: boolean
  created_at: string
  updated_at: string
}

export interface CalculoLiquidacion {
  id: string
  user_id: string
  salario_diario: number
  salario_mensual?: number
  fecha_ingreso: string
  fecha_salida?: string
  total_conciliacion?: number
  neto_conciliacion?: number
  total_juicio?: number
  neto_juicio?: number
  antiguedad_anios: number
  antiguedad_meses: number
  antiguedad_dias: number
  archivo_path?: string
  archivo_propuesta_path?: string
  nombre?: string
  descripcion?: string
  created_at: string
  updated_at: string
}

// Obtener todos los documentos del usuario
export async function obtenerDocumentos(categoria?: CategoriaDocumento) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  let query = supabase
    .from('documentos_boveda')
    .select('*')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
    .order('created_at', { ascending: false })
  
  if (categoria) {
    query = query.eq('categoria', categoria)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error obteniendo documentos:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, documentos: data as DocumentoBoveda[] }
}

// Obtener historial de cálculos (desde documentos_boveda con categoría calculo_liquidacion)
export async function obtenerCalculos() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Los cálculos se guardan en documentos_boveda con categoría 'calculo_liquidacion'
  const { data, error } = await supabase
    .from('documentos_boveda')
    .select('*')
    .eq('user_id', user.id)
    .eq('categoria', 'calculo_liquidacion')
    .eq('estado', 'activo')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error obteniendo cálculos:', error)
    return { success: false, error: error.message }
  }
  
  // Transformar a formato de cálculo usando metadata
  const calculos = (data || []).map(doc => ({
    id: doc.id,
    user_id: doc.user_id,
    salario_diario: doc.metadata?.salarioDiario || 0,
    salario_mensual: doc.metadata?.salarioMensual,
    fecha_ingreso: doc.metadata?.fechaIngreso || '',
    fecha_salida: doc.metadata?.fechaSalida,
    total_conciliacion: doc.metadata?.totalConciliacion,
    neto_conciliacion: doc.metadata?.netoConciliacion,
    total_juicio: doc.metadata?.totalJuicio,
    neto_juicio: doc.metadata?.netoJuicio,
    antiguedad_anios: doc.metadata?.antiguedadAnios || 0,
    antiguedad_meses: doc.metadata?.antiguedadMeses || 0,
    antiguedad_dias: doc.metadata?.antiguedadDias || 0,
    archivo_path: doc.archivo_path,
    archivo_propuesta_path: doc.metadata?.archivo_propuesta_path,
    nombre: doc.nombre,
    descripcion: doc.descripcion,
    created_at: doc.created_at,
    updated_at: doc.updated_at
  }))
  
  return { success: true, calculos }
}

// Subir documento a la bóveda
export async function subirDocumento(params: {
  archivo: string // Base64
  nombre: string
  nombreOriginal: string
  categoria: CategoriaDocumento
  subcategoria?: string
  descripcion?: string
  mimeType: string
  tamanioBytes: number
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  try {
    // Validar que el archivo tenga contenido
    if (!params.archivo || params.archivo.length === 0) {
      return { success: false, error: 'No se recibió archivo para guardar' }
    }
    
    // Limpiar el base64 si tiene el prefijo data:
    let base64Data = params.archivo
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1]
    }
    
    // Convertir base64 a Buffer y luego a Blob (compatible con Supabase Storage)
    const buffer = Buffer.from(base64Data, 'base64')
    
    if (buffer.length === 0) {
      return { success: false, error: 'El archivo está vacío' }
    }
    
    // Crear Blob desde el buffer (Node.js 18+ tiene Blob nativo)
    const blob = new Blob([buffer], { type: params.mimeType })
    
    // Generar path único
    const timestamp = Date.now()
    const filename = `${params.categoria}/${timestamp}-${params.nombreOriginal}`
    const filePath = `${user.id}/${filename}`
    
    // Subir a Storage usando Blob
    const { error: uploadError } = await supabase.storage
      .from('boveda')
      .upload(filePath, blob, {
        contentType: params.mimeType,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      return { success: false, error: uploadError.message }
    }
    
    // Obtener URL pública (signed)
    const { data: urlData } = await supabase.storage
      .from('boveda')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 días
    
    // Insertar en base de datos
    const { data: docData, error: docError } = await supabase
      .from('documentos_boveda')
      .insert({
        user_id: user.id,
        categoria: params.categoria,
        subcategoria: params.subcategoria,
        nombre: params.nombre,
        nombre_original: params.nombreOriginal,
        descripcion: params.descripcion,
        archivo_path: filePath,
        archivo_url: urlData?.signedUrl,
        mime_type: params.mimeType,
        tamanio_bytes: params.tamanioBytes,
        metadata: params.metadata || {},
        estado: 'activo',
        verificado: false
      })
      .select()
      .single()
    
    if (docError) {
      console.error('Error insertando documento:', docError)
      return { success: false, error: docError.message }
    }
    
    revalidatePath('/boveda')
    return { success: true, documento: docData as DocumentoBoveda }
    
  } catch (error) {
    console.error('Error en subirDocumento:', error)
    return { success: false, error: 'Error al procesar el archivo' }
  }
}

// Guardar grabación de audio
export async function guardarGrabacionAudio(params: {
  audioBlob: string // Base64
  duracionSegundos: number
  descripcion?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  try {
    // Validar que el audioBlob tenga contenido
    if (!params.audioBlob || params.audioBlob.length === 0) {
      return { success: false, error: 'No se recibió audio para guardar' }
    }
    
    // Limpiar el base64 si tiene el prefijo data:
    let base64Data = params.audioBlob
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1]
    }
    
    // Convertir base64 a Buffer y luego a Blob
    const buffer = Buffer.from(base64Data, 'base64')
    
    if (buffer.length === 0) {
      return { success: false, error: 'El audio está vacío' }
    }
    
    // Crear Blob desde el buffer (Node.js 18+ tiene Blob nativo)
    const blob = new Blob([buffer], { type: 'audio/webm' })
    
    // Generar path único
    const timestamp = Date.now()
    const fecha = new Date().toISOString().split('T')[0]
    const filename = `grabacion_audio/${fecha}-${timestamp}.webm`
    const filePath = `${user.id}/${filename}`
    
    // Subir a Storage usando Blob
    const { error: uploadError } = await supabase.storage
      .from('boveda')
      .upload(filePath, blob, {
        contentType: 'audio/webm',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error subiendo audio:', uploadError)
      return { success: false, error: uploadError.message }
    }
    
    // Obtener URL
    const { data: urlData } = await supabase.storage
      .from('boveda')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7)
    
    // Insertar en base de datos
    const { data: docData, error: docError } = await supabase
      .from('documentos_boveda')
      .insert({
        user_id: user.id,
        categoria: 'grabacion_audio',
        nombre: `Grabación ${new Date().toLocaleDateString('es-MX')}`,
        nombre_original: `grabacion-${timestamp}.webm`,
        descripcion: params.descripcion,
        archivo_path: filePath,
        archivo_url: urlData?.signedUrl,
        mime_type: 'audio/webm',
        tamanio_bytes: buffer.length,
        metadata: {
          duracion_segundos: params.duracionSegundos
        },
        estado: 'activo',
        verificado: false
      })
      .select()
      .single()
    
    if (docError) {
      console.error('Error insertando audio:', docError)
      return { success: false, error: docError.message }
    }
    
    revalidatePath('/boveda')
    return { success: true, documento: docData as DocumentoBoveda }
    
  } catch (error) {
    console.error('Error en guardarGrabacionAudio:', error)
    return { success: false, error: 'Error al procesar la grabación' }
  }
}

// Eliminar documento
export async function eliminarDocumento(documentoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Obtener documento para verificar permisos y obtener path
  const { data: doc, error: fetchError } = await supabase
    .from('documentos_boveda')
    .select('*')
    .eq('id', documentoId)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' }
  }
  
  // Marcar como eliminado (soft delete)
  const { error: updateError } = await supabase
    .from('documentos_boveda')
    .update({ estado: 'eliminado' })
    .eq('id', documentoId)
  
  if (updateError) {
    return { success: false, error: updateError.message }
  }
  
  revalidatePath('/boveda')
  return { success: true }
}

// Obtener URL firmada para visualizar documento
export async function obtenerUrlDocumento(documentoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  const { data: doc, error: fetchError } = await supabase
    .from('documentos_boveda')
    .select('archivo_path')
    .eq('id', documentoId)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' }
  }
  
  const { data: urlData, error: urlError } = await supabase.storage
    .from('boveda')
    .createSignedUrl(doc.archivo_path, 60 * 60) // 1 hora
  
  if (urlError) {
    return { success: false, error: urlError.message }
  }
  
  return { success: true, url: urlData.signedUrl }
}

// Obtener URL firmada por path directo (útil para cálculos)
export async function obtenerUrlPorPath(archivoPath: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Verificar que el path pertenezca al usuario
  if (!archivoPath.startsWith(user.id)) {
    return { success: false, error: 'Acceso denegado' }
  }
  
  const { data: urlData, error: urlError } = await supabase.storage
    .from('boveda')
    .createSignedUrl(archivoPath, 60 * 60) // 1 hora
  
  if (urlError) {
    return { success: false, error: urlError.message }
  }
  
  return { success: true, url: urlData.signedUrl }
}

// Obtener estadísticas de la bóveda
export async function obtenerEstadisticas() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Contar documentos por categoría
  const { data: docs, error } = await supabase
    .from('documentos_boveda')
    .select('categoria, tamanio_bytes')
    .eq('user_id', user.id)
    .eq('estado', 'activo')
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  const porCategoria = docs.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Los cálculos están en documentos_boveda con categoría 'calculo_liquidacion'
  const totalCalculos = porCategoria['calculo_liquidacion'] || 0
  
  // Documentos son todos menos los cálculos
  const totalDocumentos = docs.length - totalCalculos
  
  const estadisticas = {
    totalDocumentos,
    tamanioTotal: docs.reduce((acc, d) => acc + (d.tamanio_bytes || 0), 0),
    porCategoria,
    totalCalculos
  }
  
  return { 
    success: true, 
    estadisticas
  }
}
