'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Buffer } from 'buffer'

// Tipos para la boveda - Categorias expandidas para evidencias laborales
export type CategoriaDocumento = 
  // Documentos principales
  | 'calculo_liquidacion'
  | 'propuesta_empresa'
  | 'contrato_laboral'
  | 'hoja_renuncia'
  | 'hojas_firmadas'
  | 'recibo_nomina'
  | 'recibo_dinero'
  // Evidencias multimedia
  | 'evidencia_foto'
  | 'evidencia_video'
  | 'video_despido'
  | 'evidencia_audio'
  | 'grabacion_audio'
  | 'grabacion_llamada'
  // Identificaciones
  | 'ine_frente'
  | 'ine_reverso'
  | 'pasaporte'
  | 'cedula_profesional'
  | 'credencial_elector'
  // Proceso legal
  | 'solicitud_conciliacion'
  | 'notificacion'
  | 'acuse'
  | 'expediente'
  // Audiencia y conciliacion
  | 'foto_lugar'
  | 'acta_audiencia'
  | 'acta_conciliacion'
  | 'constancia_no_conciliacion'
  // Resolucion
  | 'convenio'
  | 'sentencia'
  // Domicilio
  | 'comprobante_domicilio'
  // Testigos
  | 'testigos'
  // Documentos escaneados
  | 'documento_escaneado'
  // Otro
  | 'otro'

// Categorias que requieren verificacion
const CATEGORIAS_VERIFICACION = ['ine_frente', 'ine_reverso', 'pasaporte', 'cedula_profesional', 'credencial_elector']

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
    
    // Si es un documento de identificacion, actualizar estado del perfil a "pending" (por verificar)
    if (CATEGORIAS_VERIFICACION.includes(params.categoria)) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (profileError) {
        console.error('Error actualizando estado de verificacion:', profileError)
        // No retornamos error porque el documento ya se subio correctamente
      }
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

// Renombrar documento
export async function renombrarDocumento(documentoId: string, nuevoNombre: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Verificar que el documento pertenece al usuario
  const { data: doc, error: fetchError } = await supabase
    .from('documentos_boveda')
    .select('id')
    .eq('id', documentoId)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' }
  }
  
  // Actualizar nombre
  const { error: updateError } = await supabase
    .from('documentos_boveda')
    .update({ nombre: nuevoNombre.trim() })
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

// Obtener texto OCR de un documento (para analisis con IA)
export async function obtenerTextoOCRDocumento(documentoId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  const { data: doc, error: fetchError } = await supabase
    .from('documentos_boveda')
    .select('nombre, metadata')
    .eq('id', documentoId)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError || !doc) {
    return { success: false, error: 'Documento no encontrado' }
  }
  
  // Obtener texto OCR de metadata
  const metadata = doc.metadata as Record<string, unknown> | null
  const textoOCR = metadata?.textoEditado as string || metadata?.resumenIA as string || null
  
  return { 
    success: true, 
    texto: textoOCR,
    nombre: doc.nombre
  }
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

// Interfaz para datos de INE extraídos por OCR
export interface DatosINEExtraidos {
  curp?: string
  claveElector?: string
  numeroINE?: string
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombreCompleto?: string
  fechaNacimiento?: string
  sexo?: 'H' | 'M'
  estadoNacimiento?: string
  domicilio?: {
    calle?: string
    numeroExterior?: string
    numeroInterior?: string
    colonia?: string
    codigoPostal?: string
    municipio?: string
    estado?: string
    domicilioCompleto?: string
  }
  vigencia?: string
  seccion?: string
  confianza: number
}

// Actualizar perfil del usuario con datos extraídos de la INE
export async function actualizarPerfilConINE(datosINE: DatosINEExtraidos) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Preparar datos para actualizar
  const updateData: Record<string, string | null | boolean> = {}
  
  // Datos de identificación
  if (datosINE.curp) {
    updateData.curp = datosINE.curp.toUpperCase()
  }
  
  if (datosINE.claveElector) {
    updateData.numero_identificacion = datosINE.claveElector
    updateData.tipo_identificacion = 'ine'
  }
  
  // Nombre completo (solo si no tiene uno ya)
  if (datosINE.nombreCompleto) {
    // Verificar si ya tiene nombre
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    if (!profile?.full_name) {
      updateData.full_name = datosINE.nombreCompleto
    }
  }
  
  // Fecha de nacimiento
  if (datosINE.fechaNacimiento) {
    updateData.fecha_nacimiento = datosINE.fechaNacimiento
  }
  
  // Sexo
  if (datosINE.sexo) {
    updateData.sexo = datosINE.sexo
  }
  
  // Estado de nacimiento
  if (datosINE.estadoNacimiento) {
    updateData.estado_nacimiento = datosINE.estadoNacimiento
  }
  
  // Domicilio (si está presente en la INE)
  if (datosINE.domicilio) {
    if (datosINE.domicilio.calle) {
      updateData.calle = datosINE.domicilio.calle
    }
    if (datosINE.domicilio.numeroExterior) {
      updateData.numero_exterior = datosINE.domicilio.numeroExterior
    }
    if (datosINE.domicilio.numeroInterior) {
      updateData.numero_interior = datosINE.domicilio.numeroInterior
    }
    if (datosINE.domicilio.colonia) {
      updateData.colonia = datosINE.domicilio.colonia
    }
    if (datosINE.domicilio.codigoPostal) {
      updateData.codigo_postal = datosINE.domicilio.codigoPostal
    }
    if (datosINE.domicilio.municipio) {
      updateData.ciudad = datosINE.domicilio.municipio // Usamos ciudad para municipio
    }
    if (datosINE.domicilio.estado) {
      updateData.estado = datosINE.domicilio.estado
    }
  }
  
  // Si no hay nada que actualizar
  if (Object.keys(updateData).length === 0) {
    return { success: true, message: 'No hay datos nuevos para actualizar' }
  }
  
  // Actualizar perfil
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error('Error actualizando perfil:', updateError)
    return { success: false, error: updateError.message }
  }
  
  revalidatePath('/perfil')
  revalidatePath('/boveda')
  
  return { 
    success: true, 
    message: 'Perfil actualizado con datos de la INE',
    datosActualizados: Object.keys(updateData)
  }
}

// Obtener datos del perfil para validar con INE
export async function obtenerDatosPerfilParaValidacion() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      full_name,
      curp,
      fecha_nacimiento,
      sexo,
      calle,
      numero_exterior,
      numero_interior,
      colonia,
      codigo_postal,
      ciudad,
      estado
    `)
    .eq('id', user.id)
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { 
    success: true, 
    perfil: profile 
  }
}

// Actualizar caso con dirección del trabajador (para formularios CCL)
export async function actualizarCasoConDireccionTrabajador(
  casoId: string, 
  direccion: {
    calle?: string
    numeroExterior?: string
    numeroInterior?: string
    colonia?: string
    codigoPostal?: string
    municipio?: string
    estado?: string
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado', requiresAuth: true }
  }
  
  // Construir dirección completa
  const direccionCompleta = [
    direccion.calle,
    direccion.numeroExterior ? `#${direccion.numeroExterior}` : null,
    direccion.numeroInterior ? `Int. ${direccion.numeroInterior}` : null,
    direccion.colonia ? `Col. ${direccion.colonia}` : null,
    direccion.codigoPostal ? `C.P. ${direccion.codigoPostal}` : null,
    direccion.municipio,
    direccion.estado
  ].filter(Boolean).join(', ')
  
  // Actualizar el caso con la dirección del trabajador
  const { error } = await supabase
    .from('calculos_liquidacion')
    .update({
      direccion_trabajador: direccionCompleta,
      calle_trabajador: direccion.calle,
      numero_ext_trabajador: direccion.numeroExterior,
      numero_int_trabajador: direccion.numeroInterior,
      colonia_trabajador: direccion.colonia,
      cp_trabajador: direccion.codigoPostal,
      municipio_trabajador: direccion.municipio,
      estado_trabajador: direccion.estado
    })
    .eq('id', casoId)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error actualizando caso:', error)
    return { success: false, error: error.message }
  }
  
  revalidatePath('/casos')
  
  return { success: true, message: 'Dirección del trabajador actualizada en el caso' }
}
