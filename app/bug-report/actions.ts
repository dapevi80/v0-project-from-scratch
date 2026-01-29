'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BugReport {
  id: string
  user_id: string
  titulo: string
  descripcion: string
  pagina_url: string
  categoria: 'ui' | 'funcionalidad' | 'rendimiento' | 'otro'
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  status: 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado'
  screenshot_url?: string
  credito_otorgado: boolean
  respuesta_admin?: string
  created_at: string
  resolved_at?: string
  user_email?: string
  user_name?: string
}

// Crear reporte de bug
export async function crearReporteBug(data: {
  titulo: string
  descripcion: string
  pagina_url: string
  categoria: 'ui' | 'funcionalidad' | 'rendimiento' | 'otro'
  screenshot_base64?: string
}): Promise<{ success: boolean; error?: string; reportId?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Debes iniciar sesión para reportar' }
  }

  let screenshot_url: string | undefined

  // Subir screenshot si existe
  if (data.screenshot_base64) {
    const base64Data = data.screenshot_base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `bug-screenshots/${user.id}/${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug-reports')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('bug-reports')
        .getPublicUrl(fileName)
      screenshot_url = urlData.publicUrl
    }
  }

  const { data: report, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: user.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      pagina_url: data.pagina_url,
      categoria: data.categoria,
      screenshot_url,
      status: 'pendiente',
      credito_otorgado: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando reporte:', error)
    return { success: false, error: 'Error al enviar el reporte' }
  }

  return { success: true, reportId: report.id }
}

// Obtener reportes del usuario actual
export async function obtenerMisReportes(): Promise<{
  success: boolean
  reportes?: BugReport[]
  error?: string
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, reportes: data }
}

// ADMIN: Obtener todos los reportes
export async function obtenerTodosReportes(filtros?: {
  status?: string
  categoria?: string
  prioridad?: string
}): Promise<{
  success: boolean
  reportes?: BugReport[]
  stats?: {
    total: number
    pendientes: number
    en_revision: number
    resueltos: number
    creditos_otorgados: number
  }
  error?: string
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Verificar que sea superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'No autorizado' }
  }

  let query = supabase
    .from('bug_reports')
    .select(`
      *,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  if (filtros?.status && filtros.status !== 'todos') {
    query = query.eq('status', filtros.status)
  }
  if (filtros?.categoria && filtros.categoria !== 'todas') {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros?.prioridad && filtros.prioridad !== 'todas') {
    query = query.eq('prioridad', filtros.prioridad)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // Calcular estadísticas
  const { data: allReports } = await supabase
    .from('bug_reports')
    .select('status, credito_otorgado')

  const stats = {
    total: allReports?.length || 0,
    pendientes: allReports?.filter(r => r.status === 'pendiente').length || 0,
    en_revision: allReports?.filter(r => r.status === 'en_revision').length || 0,
    resueltos: allReports?.filter(r => r.status === 'resuelto').length || 0,
    creditos_otorgados: allReports?.filter(r => r.credito_otorgado).length || 0
  }

  // Transformar datos
  const reportes = data?.map(r => ({
    ...r,
    user_email: (r.profiles as { email?: string })?.email,
    user_name: (r.profiles as { full_name?: string })?.full_name
  }))

  return { success: true, reportes, stats }
}

// ADMIN: Actualizar status del reporte
export async function actualizarReporte(
  reporteId: string,
  data: {
    status?: 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado'
    prioridad?: 'baja' | 'media' | 'alta' | 'critica'
    respuesta_admin?: string
    otorgar_credito?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Verificar que sea superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return { success: false, error: 'No autorizado' }
  }

  // Obtener el reporte actual
  const { data: reporte } = await supabase
    .from('bug_reports')
    .select('user_id, credito_otorgado')
    .eq('id', reporteId)
    .single()

  if (!reporte) {
    return { success: false, error: 'Reporte no encontrado' }
  }

  const updateData: Record<string, unknown> = {}
  
  if (data.status) {
    updateData.status = data.status
    if (data.status === 'resuelto') {
      updateData.resolved_at = new Date().toISOString()
    }
  }
  if (data.prioridad) updateData.prioridad = data.prioridad
  if (data.respuesta_admin) updateData.respuesta_admin = data.respuesta_admin

  // Otorgar crédito si se solicita y no se ha otorgado antes
  if (data.otorgar_credito && !reporte.credito_otorgado) {
    updateData.credito_otorgado = true
    
    // Agregar crédito extra al usuario
    const { data: creditoActual } = await supabase
      .from('creditos_ccl')
      .select('id, creditos_extra')
      .eq('abogado_id', reporte.user_id)
      .single()

    if (creditoActual) {
      await supabase
        .from('creditos_ccl')
        .update({ creditos_extra: (creditoActual.creditos_extra || 0) + 1 })
        .eq('id', creditoActual.id)
    } else {
      // Crear registro de créditos si no existe
      await supabase
        .from('creditos_ccl')
        .insert({
          abogado_id: reporte.user_id,
          creditos_mensuales: 0,
          creditos_usados: 0,
          creditos_extra: 1
        })
    }
  }

  const { error } = await supabase
    .from('bug_reports')
    .update(updateData)
    .eq('id', reporteId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/bug-reports')
  return { success: true }
}
