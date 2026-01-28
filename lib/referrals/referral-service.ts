"use server"

import { createClient } from '@/lib/supabase/server'

// Tipos
export interface ReferralTreeNode {
  id: string
  user_id: string
  parent_id: string | null
  nivel: number
  path: string[]
  rol: string
  activo: boolean
  created_at: string
  user?: {
    full_name: string
    email: string
    avatar_url: string | null
  }
  children?: ReferralTreeNode[]
}

export interface FamilyMember {
  user_id: string
  full_name: string
  email: string
  rol: string
  nivel: number
  referral_code: string
  casos_count: number
  activo: boolean
}

export interface FirstLineLawyer {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  cedula_profesional: string | null
  estado: string
  casos_activos: number
  referral_code: string
}

// Obtener mi codigo de referido
export async function obtenerMiCodigoReferido(): Promise<{ code: string | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { code: null, error: 'No autenticado' }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()
  
  if (error) return { code: null, error: error.message }
  
  // Si no tiene codigo, generar uno
  if (!data.referral_code) {
    const { data: newCode, error: genError } = await supabase
      .rpc('generar_codigo_referido', { p_user_id: user.id })
    
    if (genError) return { code: null, error: genError.message }
    return { code: newCode, error: null }
  }
  
  return { code: data.referral_code, error: null }
}

// Registrar un nuevo referido (se llama despues del registro)
export async function registrarReferido(
  nuevoUserId: string, 
  codigoReferido: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .rpc('registrar_referido', { 
      p_nuevo_user_id: nuevoUserId, 
      p_codigo_referido: codigoReferido 
    })
  
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}

// Obtener abogados de primera linea (para admins)
export async function obtenerAbogadosPrimeraLinea(): Promise<{ 
  lawyers: FirstLineLawyer[]; 
  error: string | null 
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { lawyers: [], error: 'No autenticado' }
  
  const { data, error } = await supabase
    .rpc('obtener_abogados_primera_linea', { p_admin_id: user.id })
  
  if (error) return { lawyers: [], error: error.message }
  return { lawyers: data || [], error: null }
}

// Obtener toda la familia de referidos
export async function obtenerFamiliaReferidos(nivelMax: number = 5): Promise<{
  family: FamilyMember[];
  error: string | null
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { family: [], error: 'No autenticado' }
  
  const { data, error } = await supabase
    .rpc('obtener_familia_referidos', { 
      p_user_id: user.id, 
      p_nivel_max: nivelMax 
    })
  
  if (error) return { family: [], error: error.message }
  return { family: data || [], error: null }
}

// Asignar caso a un abogado de primera linea
export async function asignarCasoAAbogado(
  casoId: string, 
  abogadoId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  
  const { error } = await supabase
    .rpc('asignar_caso_a_linea', { 
      p_caso_id: casoId, 
      p_abogado_id: abogadoId,
      p_admin_id: user.id 
    })
  
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}

// Obtener casos visibles para el usuario (segun su familia)
export async function obtenerCasosFamilia(): Promise<{
  casos: any[];
  error: string | null
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { casos: [], error: 'No autenticado' }
  
  const { data, error } = await supabase
    .rpc('obtener_casos_familia', { p_user_id: user.id })
  
  if (error) return { casos: [], error: error.message }
  return { casos: data || [], error: null }
}

// Obtener arbol de referidos como estructura jerarquica
export async function obtenerArbolReferidos(): Promise<{
  tree: ReferralTreeNode | null;
  stats: {
    total: number;
    porNivel: Record<number, number>;
    abogados: number;
    trabajadores: number;
  };
  error: string | null
}> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { tree: null, stats: { total: 0, porNivel: {}, abogados: 0, trabajadores: 0 }, error: 'No autenticado' }
  
  // Obtener todos los nodos donde el usuario esta en el path
  const { data: nodes, error } = await supabase
    .from('referral_tree')
    .select(`
      *,
      user:profiles!referral_tree_user_id_fkey(full_name, email, avatar_url)
    `)
    .contains('path', [user.id])
    .order('nivel', { ascending: true })
  
  if (error) return { tree: null, stats: { total: 0, porNivel: {}, abogados: 0, trabajadores: 0 }, error: error.message }
  
  // Calcular estadisticas
  const stats = {
    total: nodes?.length || 0,
    porNivel: {} as Record<number, number>,
    abogados: 0,
    trabajadores: 0
  }
  
  nodes?.forEach(node => {
    stats.porNivel[node.nivel] = (stats.porNivel[node.nivel] || 0) + 1
    if (node.rol === 'abogado' || node.rol === 'guest_lawyer') stats.abogados++
    if (node.rol === 'worker' || node.rol === 'guest_worker') stats.trabajadores++
  })
  
  // Construir arbol
  const nodeMap = new Map<string, ReferralTreeNode>()
  nodes?.forEach(node => {
    nodeMap.set(node.user_id, { ...node, children: [] })
  })
  
  let root: ReferralTreeNode | null = null
  nodes?.forEach(node => {
    const current = nodeMap.get(node.user_id)!
    if (node.user_id === user.id) {
      root = current
    } else if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children!.push(current)
    }
  })
  
  return { tree: root, stats, error: null }
}

// Verificar si un usuario puede ver un caso
export async function puedeVerCaso(casoId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  // Verificar en caso_visibility
  const { data } = await supabase
    .from('caso_visibility')
    .select('id')
    .eq('caso_id', casoId)
    .eq('user_id', user.id)
    .single()
  
  return !!data
}

// Propagar visibilidad de caso a toda la linea ascendente
export async function propagarVisibilidadCaso(
  casoId: string, 
  creadorId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  
  // Obtener el path del creador
  const { data: treeNode, error: treeError } = await supabase
    .from('referral_tree')
    .select('path')
    .eq('user_id', creadorId)
    .single()
  
  if (treeError || !treeNode) {
    // Si no esta en el arbol, solo dar visibilidad al creador
    await supabase
      .from('caso_visibility')
      .upsert({ caso_id: casoId, user_id: creadorId, puede_editar: true })
    return { success: true, error: null }
  }
  
  // Dar visibilidad a todos en el path (linea ascendente)
  const visibilityRecords = treeNode.path.map((userId: string, index: number) => ({
    caso_id: casoId,
    user_id: userId,
    puede_editar: index === treeNode.path.length - 1, // Solo el creador puede editar
    nivel_acceso: treeNode.path.length - index // Nivel de acceso inverso al path
  }))
  
  const { error } = await supabase
    .from('caso_visibility')
    .upsert(visibilityRecords, { onConflict: 'caso_id,user_id' })
  
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}
