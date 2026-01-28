'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGuestLawyerDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autenticado', data: null }
  }
  
  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return { error: 'Perfil no encontrado', data: null }
  }
  
  // Verificar que sea guestlawyer o lawyer
  if (!['guestlawyer', 'lawyer'].includes(profile.role)) {
    return { error: 'Acceso no autorizado', data: null }
  }
  
  // Obtener perfil de abogado
  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  // Obtener documentos subidos
  const { data: documents } = await supabase
    .from('lawyer_documents')
    .select('*')
    .eq('lawyer_id', user.id)
  
  // Calcular progreso de verificacion
  const cedulaDoc = documents?.find(d => d.doc_type === 'cedula_profesional')
  const idDoc = documents?.find(d => d.doc_type === 'id_oficial')
  
  const verificationProgress = {
    perfilCompleto: !!(profile.full_name && profile.phone && profile.email),
    cedulaSubida: !!cedulaDoc,
    idSubida: !!idDoc,
    enRevision: lawyerProfile?.status === 'submitted' || documents?.some(d => d.status === 'under_review'),
    verificado: profile.role === 'lawyer' && lawyerProfile?.status === 'verified'
  }
  
  // Obtener estadisticas
  const { count: casosActivos } = await supabase
    .from('casos')
    .select('*', { count: 'exact', head: true })
    .eq('abogado_id', user.id)
    .in('status', ['asignado', 'en_proceso'])
  
  const { count: casosCompletados } = await supabase
    .from('casos')
    .select('*', { count: 'exact', head: true })
    .eq('abogado_id', user.id)
    .eq('status', 'completado')
  
  // Calcular ingresos del mes (de casos completados)
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const { data: casosDelMes } = await supabase
    .from('casos')
    .select('monto_liquidacion')
    .eq('abogado_id', user.id)
    .eq('status', 'completado')
    .gte('updated_at', inicioMes.toISOString())
  
  const ingresosMes = casosDelMes?.reduce((sum, c) => sum + (c.monto_liquidacion || 0) * 0.1, 0) || 0
  
  // Verificar estado de efirma
  const { data: efirmaConfig } = await supabase
    .from('lawyer_efirma')
    .select('id, status, updated_at')
    .eq('lawyer_id', user.id)
    .maybeSingle()
  
  // Verificar si hay celebracion pendiente
  const celebrationPending = !profile.celebration_shown && (
    profile.verification_status === 'verified' ||
    (profile.upgrade_at && profile.role === 'lawyer')
  )
  
  const wasReactivation = profile.upgrade_type === 'reactivation'
  const wasDowngraded = profile.verification_status === 'documents_missing'

  return {
    error: null,
    data: {
      profile,
      lawyerProfile,
      documents,
      verificationProgress,
      stats: {
        casosActivos: casosActivos || 0,
        casosCompletados: casosCompletados || 0,
        ingresosMes: Math.round(ingresosMes)
      },
      efirmaStatus: efirmaConfig 
        ? { configured: true, status: efirmaConfig.status as 'pending' | 'active' | 'expired' } 
        : { configured: false, status: undefined },
      // Datos de celebracion y downgrade
      celebrationPending,
      wasReactivation,
      wasDowngraded,
      downgradeReason: profile.downgrade_reason,
      upgradeType: profile.upgrade_type
    }
  }
}

// Generar vCard para contacto
export async function generateVCard(lawyerId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', lawyerId)
    .single()
  
  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('user_id', lawyerId)
    .single()
  
  if (!profile) {
    return { error: 'Perfil no encontrado', data: null }
  }
  
  // Crear vCard format
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name}
ORG:${lawyerProfile?.firm_name || 'Abogado Independiente'}
TITLE:Abogado - Cedula ${lawyerProfile?.cedula_profesional || 'Pendiente'}
TEL;TYPE=CELL:${profile.phone || ''}
EMAIL:${profile.email}
URL:https://mecorrieron.mx/abogado/${lawyerId}
NOTE:Abogado verificado en mecorrieron.mx
END:VCARD`
  
  return { error: null, data: vCard }
}

// Guardar configuracion de efirma
export async function saveEfirmaConfig(data: {
  certificado_url?: string
  key_url?: string
  password_encrypted?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autenticado' }
  }
  
  const { error } = await supabase
    .from('lawyer_efirma')
    .upsert({
      lawyer_id: user.id,
      certificado_url: data.certificado_url,
      key_url: data.key_url,
      password_encrypted: data.password_encrypted,
      configured_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'lawyer_id' })
  
  if (error) {
    return { error: error.message }
  }
  
  return { error: null, success: true }
}
