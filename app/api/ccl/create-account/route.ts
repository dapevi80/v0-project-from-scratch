import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PORTALES_CCL, generarPasswordCCL, generarEmailCCL } from '@/lib/ccl/account-service'

// Generar folio de CCL
function generarFolioCCL(estado: string): string {
  const prefijos: Record<string, string> = {
    'Aguascalientes': 'AGU', 'Baja California': 'BAJ', 'Baja California Sur': 'BCS',
    'Campeche': 'CAM', 'Chiapas': 'CHS', 'Chihuahua': 'CHH', 'Ciudad de Mexico': 'CIU',
    'Coahuila': 'COA', 'Colima': 'COL', 'Durango': 'DUR', 'Estado de Mexico': 'EST',
    'Guanajuato': 'GUA', 'Guerrero': 'GUE', 'Hidalgo': 'HID', 'Jalisco': 'JAL',
    'Michoacan': 'MIC', 'Morelos': 'MOR', 'Nayarit': 'NAY', 'Nuevo Leon': 'NUE',
    'Oaxaca': 'OAX', 'Puebla': 'PUE', 'Queretaro': 'QUE', 'Quintana Roo': 'QUI',
    'San Luis Potosi': 'SAN', 'Sinaloa': 'SIN', 'Sonora': 'SON', 'Tabasco': 'TAB',
    'Tamaulipas': 'TAM', 'Tlaxcala': 'TLA', 'Veracruz': 'VER', 'Yucatan': 'YUC',
    'Zacatecas': 'ZAC', 'Federal': 'FED'
  }
  
  const prefijo = prefijos[estado] || estado.slice(0, 3).toUpperCase()
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  
  return `CCL-${prefijo}-${fecha}-${numero}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { estado, datosTrabajador, opciones } = body
    
    const supabase = await createClient()
    
    const portal = PORTALES_CCL[estado]
    if (!portal) {
      return NextResponse.json({ exito: false, error: `Portal no configurado para ${estado}` })
    }
    
    // Generar credenciales
    const emailPortal = generarEmailCCL(datosTrabajador.curp, estado)
    const passwordPortal = generarPasswordCCL()
    
    // Simular tiempo de proceso
    const tiempoSimulado = 1000 + Math.random() * 2000
    await new Promise(resolve => setTimeout(resolve, tiempoSimulado))
    
    // Verificar CAPTCHA (simulado)
    if (portal.requiereCaptcha) {
      const tieneCaptchaActivo = Math.random() > 0.6 // 40% de probabilidad de CAPTCHA
      
      if (tieneCaptchaActivo) {
        // Guardar cuenta en estado pendiente
        const { data: account, error } = await supabase
          .from('ccl_user_accounts')
          .insert({
            user_id: opciones?.userId || null,
            caso_id: opciones?.casoId || null,
            cotizacion_id: opciones?.cotizacionId || null,
            estado,
            portal_url: portal.url,
            portal_nombre: portal.nombre,
            email_portal: emailPortal,
            password_portal: passwordPortal,
            curp_usado: datosTrabajador.curp,
            rfc_usado: datosTrabajador.rfc,
            cuenta_creada: false,
            cuenta_verificada: false,
            buzon_activo: false,
            status: 'pendiente_captcha',
            error_ultimo: 'CAPTCHA pendiente de resolver',
            intentos_creacion: 1,
            es_prueba: opciones?.esPrueba || false,
            sesion_diagnostico_id: opciones?.sesionDiagnosticoId || null,
            datos_trabajador: datosTrabajador
          })
          .select()
          .single()
        
        if (error) {
          console.error('[CCL API] Error creating account:', error)
          return NextResponse.json({ exito: false, error: error.message })
        }
        
        return NextResponse.json({
          exito: false,
          accountId: account.id,
          email_portal: emailPortal,
          password_portal: passwordPortal,
          url_login: portal.urlLogin,
          requiereCaptcha: true,
          captchaUrl: portal.urlRegistro,
          error: 'CAPTCHA detectado - Requiere intervencion manual'
        })
      }
    }
    
    // Simular exito en creacion de cuenta
    const folioGenerado = generarFolioCCL(estado)
    
    // Guardar cuenta exitosa
    const { data: account, error } = await supabase
      .from('ccl_user_accounts')
      .insert({
        user_id: opciones?.userId || null,
        caso_id: opciones?.casoId || null,
        cotizacion_id: opciones?.cotizacionId || null,
        estado,
        portal_url: portal.url,
        portal_nombre: portal.nombre,
        email_portal: emailPortal,
        password_portal: passwordPortal,
        url_login: portal.urlLogin,
        url_buzon: portal.urlBuzon,
        curp_usado: datosTrabajador.curp,
        rfc_usado: datosTrabajador.rfc,
        cuenta_creada: true,
        cuenta_verificada: true,
        buzon_activo: portal.tieneBuzonElectronico,
        status: 'activa',
        folio_solicitud: folioGenerado,
        fecha_solicitud: new Date().toISOString(),
        intentos_creacion: 1,
        es_prueba: opciones?.esPrueba || false,
        sesion_diagnostico_id: opciones?.sesionDiagnosticoId || null,
        datos_trabajador: datosTrabajador
      })
      .select()
      .single()
    
    if (error) {
      console.error('[CCL API] Error creating account:', error)
      return NextResponse.json({ exito: false, error: error.message })
    }
    
    // Crear notificacion inicial
    if (account && portal.tieneBuzonElectronico) {
      await supabase
        .from('ccl_buzon_notificaciones')
        .insert({
          account_id: account.id,
          tipo: 'solicitud_recibida',
          titulo: 'Solicitud de Conciliacion Registrada',
          descripcion: `Su solicitud ha sido registrada con el folio ${folioGenerado}. En breve recibira la fecha de su audiencia de conciliacion.`,
          fecha_notificacion: new Date().toISOString(),
          documento_url: `${portal.url}/constancia/${folioGenerado}`,
          documento_tipo: 'PDF'
        })
    }
    
    return NextResponse.json({
      exito: true,
      accountId: account.id,
      email_portal: emailPortal,
      password_portal: passwordPortal,
      folio: folioGenerado,
      url_login: portal.urlLogin,
      url_buzon: portal.urlBuzon
    })
    
  } catch (error) {
    console.error('[CCL API] Unexpected error:', error)
    return NextResponse.json({ 
      exito: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    })
  }
}
