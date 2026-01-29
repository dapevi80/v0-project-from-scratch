import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Obtener cuentas CCL por caso o por usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const casoId = searchParams.get('caso_id')
    const userId = searchParams.get('user_id')
    const cotizacionId = searchParams.get('cotizacion_id')
    
    let query = supabase
      .from('ccl_user_accounts')
      .select(`
        *,
        notificaciones:ccl_buzon_notificaciones(*)
      `)
      .order('created_at', { ascending: false })
    
    if (casoId) {
      query = query.eq('caso_id', casoId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else if (cotizacionId) {
      query = query.eq('cotizacion_id', cotizacionId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('[CCL Accounts API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[CCL Accounts API] Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}

// PATCH - Actualizar estado de cuenta CCL
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { accountId, ...updates } = body
    
    if (!accountId) {
      return NextResponse.json({ error: 'accountId requerido' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('ccl_user_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single()
    
    if (error) {
      console.error('[CCL Accounts API] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[CCL Accounts API] Unexpected error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}
