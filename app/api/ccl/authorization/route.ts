import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET: Verificar si existe autorizacion para un caso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const casoId = searchParams.get('casoId')
  
  if (!casoId) {
    return NextResponse.json({ error: 'casoId requerido' }, { status: 400 })
  }
  
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sinacol_authorizations')
      .select('*')
      .eq('caso_id', casoId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[CCL Auth] Error checking authorization:', error)
      return NextResponse.json({ authorized: false, error: error.message })
    }
    
    const authorized = data && 
      data.autoriza_mecorrieron && 
      data.autoriza_abogado && 
      data.autoriza_sinacol && 
      data.terminos_aceptados
    
    return NextResponse.json({ 
      authorized,
      authorization: data || null,
      fecha: data?.fecha_autorizacion || null
    })
  } catch (err) {
    console.error('[CCL Auth] Unexpected error:', err)
    return NextResponse.json({ authorized: false, error: 'Error interno' })
  }
}

// POST: Crear nueva autorizacion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      casoId, 
      autorizaMecorrieron,
      autorizaAbogado,
      autorizaSinacol,
      autorizaNotificaciones,
      terminosAceptados,
      curpFirmante,
      nombreFirmante,
      empresaRazonSocial,
      empresaRfc,
      estadoCcl,
      urlSinacol
    } = body
    
    if (!casoId) {
      return NextResponse.json({ success: false, error: 'casoId requerido' }, { status: 400 })
    }
    
    // Validar que todas las autorizaciones estan marcadas
    if (!autorizaMecorrieron || !autorizaAbogado || !autorizaSinacol || !terminosAceptados) {
      return NextResponse.json({ 
        success: false, 
        error: 'Debe aceptar todas las autorizaciones requeridas' 
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    
    // Obtener IP del request (en produccion seria diferente)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Crear firma electronica (hash de los datos)
    const dataToSign = JSON.stringify({
      casoId,
      curpFirmante,
      nombreFirmante,
      empresaRazonSocial,
      autorizaMecorrieron,
      autorizaAbogado,
      autorizaSinacol,
      fecha: new Date().toISOString()
    })
    const firmaElectronica = crypto.createHash('sha256').update(dataToSign).digest('hex')
    
    // Insertar o actualizar autorizacion
    const { data, error } = await supabase
      .from('sinacol_authorizations')
      .upsert({
        caso_id: casoId,
        user_id: user?.id || null,
        autoriza_mecorrieron: autorizaMecorrieron,
        autoriza_abogado: autorizaAbogado,
        autoriza_sinacol: autorizaSinacol,
        autoriza_notificaciones: autorizaNotificaciones,
        terminos_aceptados: terminosAceptados,
        fecha_autorizacion: new Date().toISOString(),
        ip_autorizacion: ip,
        user_agent: userAgent,
        firma_electronica: firmaElectronica,
        curp_firmante: curpFirmante,
        nombre_firmante: nombreFirmante,
        empresa_razon_social: empresaRazonSocial,
        empresa_rfc: empresaRfc,
        estado_ccl: estadoCcl,
        url_sinacol: urlSinacol,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'caso_id'
      })
      .select()
      .single()
    
    if (error) {
      console.error('[CCL Auth] Error creating authorization:', error)
      return NextResponse.json({ success: false, error: error.message })
    }
    
    return NextResponse.json({ 
      success: true, 
      authorization: data,
      firma: firmaElectronica,
      mensaje: 'Autorizacion registrada exitosamente'
    })
    
  } catch (err) {
    console.error('[CCL Auth] Unexpected error:', err)
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Error interno' 
    })
  }
}
