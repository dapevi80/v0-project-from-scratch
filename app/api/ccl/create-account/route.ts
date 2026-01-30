import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PORTALES_CCL, generarEmailCCL, generarPasswordCCL, generarFolioCCL } from '@/lib/ccl/account-service'

/**
 * API para registrar referencia al portal SINACOL real
 * 
 * IMPORTANTE: Esta API NO crea cuentas en SINACOL automáticamente.
 * Solo guarda una referencia en nuestra base de datos para que el abogado
 * pueda guiar al trabajador al portal oficial correspondiente.
 * 
 * El trabajador debe completar su solicitud manualmente en SINACOL usando su CURP.
 */

// Generar ID de referencia interno (NO es folio oficial de SINACOL)
function generarReferenciaInterna(estado: string): string {
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
  
  return `REF-${prefijo}-${fecha}-${numero}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { estado, datosTrabajador, opciones } = body
    
    const supabase = await createClient()
    
    const portal = PORTALES_CCL[estado]
    if (!portal) {
      return NextResponse.json({ exito: false, error: `Portal SINACOL no configurado para ${estado}` })
    }
    
    // Generar referencia interna (NO es folio oficial)
    const referenciaInterna = generarReferenciaInterna(estado)
    
    // Guardar referencia al portal SINACOL real
    const { data: account, error } = await supabase
      .from('ccl_user_accounts')
      .insert({
        user_id: opciones?.userId || null,
        caso_id: opciones?.casoId || null,
        cotizacion_id: opciones?.cotizacionId || null,
        estado,
        portal_url: portal.url,
        portal_nombre: portal.nombre,
        // SINACOL no requiere email/password - solo CURP
        email_portal: null, 
        password_portal: null,
        // URLs reales del portal SINACOL
        url_login: portal.urlSinacol, // URL del formulario de solicitud real
        url_buzon: portal.urlBuzon,
        curp_usado: datosTrabajador.curp,
        rfc_usado: datosTrabajador.rfc,
        // Estado: pendiente hasta que el trabajador complete en SINACOL
        cuenta_creada: false,
        cuenta_verificada: false,
        buzon_activo: false,
        status: 'pendiente_sinacol', // Indica que debe completarse en portal real
        folio_solicitud: referenciaInterna, // Referencia interna, NO folio oficial
        fecha_solicitud: new Date().toISOString(),
        intentos_creacion: 1,
        es_prueba: opciones?.esPrueba || false,
        sesion_diagnostico_id: opciones?.sesionDiagnosticoId || null,
        datos_trabajador: datosTrabajador,
        notas: `Referencia interna. El trabajador debe completar su solicitud en ${portal.urlSinacol} usando su CURP.`
      })
      .select()
      .single()
    
    if (error) {
      console.error('[CCL API] Error saving SINACOL reference:', error)
      return NextResponse.json({ exito: false, error: error.message })
    }
    
    // Determinar instrucciones específicas según el flujo del portal
    const flujoEsGuardarCrearCuenta = portal.flujoEnvio === 'guardar_crear_cuenta'
    
    const instruccionesEspecificas = flujoEsGuardarCrearCuenta 
      ? [
          `1. Accede a ${portal.urlSinacol}`,
          '2. Completa TODOS los campos del formulario de solicitud',
          '3. Al final del formulario, verás botones "Enviar" y "Guardar"',
          '4. IMPORTANTE: Elige "GUARDAR" (NO "Enviar")',
          '5. Se abrirá un formulario para crear tu cuenta de buzón electrónico',
          '6. Completa los datos de tu cuenta (email y contraseña)',
          '7. Al crear la cuenta, tu solicitud quedará registrada oficialmente',
          '8. Guarda tu email y contraseña para acceder al buzón posteriormente'
        ]
      : [
          `1. Accede a ${portal.urlSinacol}`,
          '2. Completa todos los campos del formulario de solicitud',
          '3. Verifica que tus datos sean correctos',
          '4. Envía la solicitud',
          '5. Guarda tu folio de confirmación'
        ]
    
    return NextResponse.json({
      exito: true,
      accountId: account.id,
      referencia_interna: referenciaInterna,
      folio: referenciaInterna,
      // URLs del portal SINACOL real
      url_sinacol: portal.urlSinacol,
      url_login: portal.urlSinacol,
      url_info: portal.url,
      url_buzon: portal.urlBuzon,
      // Datos para que el trabajador complete en SINACOL
      curp: datosTrabajador.curp,
      nombre_trabajador: datosTrabajador.nombre,
      estado_ccl: estado,
      portal_nombre: portal.nombre,
      // Flujo e instrucciones específicas
      flujo_envio: portal.flujoEnvio || 'enviar_directo',
      instrucciones_paso_a_paso: instruccionesEspecificas,
      // Notas importantes
      requiere_ratificacion_presencial: portal.requiereRatificacionPresencial,
      notas: portal.notas,
      mensaje: flujoEsGuardarCrearCuenta
        ? `IMPORTANTE: En el portal de ${estado}, debes elegir "GUARDAR" al final del formulario para abrir la creación de cuenta. Este paso registra tu solicitud.`
        : `Enlace generado al portal SINACOL de ${estado}. El trabajador debe completar su solicitud en el portal oficial usando su CURP.`
    })
    
  } catch (error) {
    console.error('[CCL API] Unexpected error:', error)
    return NextResponse.json({ 
      exito: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    })
  }
}
