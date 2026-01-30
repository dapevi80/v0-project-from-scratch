import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PORTALES_CCL } from '@/lib/ccl/account-service'
import { iniciarAgenteCCL } from '@/lib/ccl/agent/ccl-agent'

/**
 * API para iniciar solicitud SINACOL real con flujo híbrido (automático + manual).
 *
 * - Automático: el agente intenta generar folio oficial y PDF en el portal.
 * - Manual: el trabajador completa la solicitud con su CURP en el portal oficial.
 * - Híbrido: inicia automático, pero mantiene instrucciones manuales si se decide no usar créditos.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { estado, datosTrabajador, opciones } = body
    const modoSolicitud = (opciones?.modo as 'manual' | 'automatico' | 'hibrido' | undefined) || 'manual'
    
    const supabase = await createClient()
    
    const portal = PORTALES_CCL[estado]
    if (!portal) {
      return NextResponse.json({ exito: false, error: `Portal SINACOL no configurado para ${estado}` })
    }
    
    if ((modoSolicitud === 'automatico' || modoSolicitud === 'hibrido') && !opciones?.casoId) {
      return NextResponse.json({ 
        exito: false, 
        error: 'Para el modo automático se requiere casoId.' 
      })
    }
    
    // Guardar solicitud en nuestra base con estatus pendiente
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
        // Estado: pendiente hasta obtener folio oficial (automático o manual)
        cuenta_creada: false,
        cuenta_verificada: false,
        buzon_activo: false,
        status: modoSolicitud === 'manual' ? 'pendiente_sinacol' : 'pendiente',
        folio_solicitud: null, // Folio oficial pendiente
        fecha_solicitud: new Date().toISOString(),
        intentos_creacion: 1,
        es_prueba: opciones?.esPrueba || false,
        sesion_diagnostico_id: opciones?.sesionDiagnosticoId || null,
        datos_trabajador: datosTrabajador,
        notas: `Modo ${modoSolicitud}. Portal: ${portal.urlSinacol}.`
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

    let jobId: string | undefined
    if (modoSolicitud === 'automatico' || modoSolicitud === 'hibrido') {
      const agente = await iniciarAgenteCCL(opciones?.casoId, {
        modalidadPreferida: opciones?.modalidadPreferida
      })

      if (agente.success && agente.jobId) {
        jobId = agente.jobId
        await supabase
          .from('ccl_user_accounts')
          .update({
            status: 'pendiente',
            intentos_creacion: (account.intentos_creacion || 0) + 1,
            notas: `Modo ${modoSolicitud}. Job agente: ${jobId}. Portal: ${portal.urlSinacol}.`
          })
          .eq('id', account.id)
      } else {
        await supabase
          .from('ccl_user_accounts')
          .update({
            status: 'pendiente_sinacol',
            error_ultimo: agente.error || 'No se pudo iniciar el agente automático.',
            notas: `Modo ${modoSolicitud}. Falló agente, continuar manual. Portal: ${portal.urlSinacol}.`
          })
          .eq('id', account.id)
      }
    }
    
    return NextResponse.json({
      exito: true,
      accountId: account.id,
      jobId,
      modo: modoSolicitud,
      // URLs del portal SINACOL real
      url_sinacol: portal.urlSinacol,
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
        : `Enlace al portal SINACOL de ${estado}. Puedes completar manualmente con tu CURP si no usarás el agente automático.`
    })
    
  } catch (error) {
    console.error('[CCL API] Unexpected error:', error)
    return NextResponse.json({ 
      exito: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    })
  }
}
