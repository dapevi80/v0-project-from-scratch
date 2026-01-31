import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarPDFSolicitud } from '@/lib/ccl/pdf-generator'

/**
 * GET /api/ccl/solicitud-pdf/[id]
 * Genera y descarga el PDF de una solicitud CCL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const solicitudId = params.id

    // Obtener solicitud con todos los datos
    const { data: solicitud, error: solicitudError } = await supabase
      .from('solicitudes_ccl')
      .select(`
        *,
        caso:caso_id(
          *,
          trabajador:trabajador_id(*)
        ),
        centro:centro_conciliacion_id(*)
      `)
      .eq('id', solicitudId)
      .single()

    if (solicitudError || !solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAbogado = profile?.role === 'abogado'
    const isWorker = solicitud.caso.trabajador_id === user.id

    if (!isAbogado && !isWorker) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta solicitud' },
        { status: 403 }
      )
    }

    // Preparar datos para el PDF
    const pdfData = {
      folio: solicitud.folio_ccl || 'SIN-FOLIO',
      trabajador: {
        nombreCompleto: solicitud.caso.trabajador.full_name || '',
        curp: solicitud.caso.trabajador.curp || '',
        rfc: solicitud.caso.trabajador.rfc,
        telefono: solicitud.caso.trabajador.phone || '',
        email: solicitud.caso.trabajador.email || '',
        domicilio: solicitud.caso.trabajador.domicilio || '',
        codigoPostal: solicitud.caso.trabajador.codigo_postal || '',
        municipio: solicitud.caso.trabajador.municipio || '',
        estado: solicitud.caso.trabajador.estado || ''
      },
      patron: {
        nombreRazonSocial: solicitud.caso.nombre_empresa || 'No especificado',
        domicilio: solicitud.direccion_centro_trabajo || 'No especificado'
      },
      caso: {
        fechaDespido: solicitud.fecha_conflicto,
        objetoSolicitud: formatearObjetoSolicitud(solicitud.objeto_solicitud),
        salarioDiario: solicitud.caso.salario_diario || 0,
        antiguedad: calcularAntiguedad(
          solicitud.caso.fecha_inicio,
          solicitud.caso.fecha_fin || new Date().toISOString()
        )
      },
      centro: {
        nombre: solicitud.centro.nombre,
        direccion: solicitud.centro.direccion,
        portalUrl: solicitud.centro.portal_url,
        horario: solicitud.centro.horario
      },
      citaRatificacion: solicitud.cita_ratificacion 
        ? new Date(solicitud.cita_ratificacion).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'Por confirmar',
      competencia: solicitud.competencia as 'federal' | 'local'
    }

    // Generar PDF
    const pdfBuffer = await generarPDFSolicitud(pdfData)

    // Retornar PDF como descarga
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="solicitud-ccl-${solicitud.folio_ccl || solicitudId}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    )
  }
}

// Helper: Formatear objeto de solicitud
function formatearObjetoSolicitud(objeto: string): string {
  const formatos: Record<string, string> = {
    'despido': 'Despido injustificado',
    'rescision': 'Rescisión de contrato (renuncia justificada)',
    'pago_prestaciones': 'Pago de prestaciones adeudadas',
    'terminacion_voluntaria': 'Terminación voluntaria',
    'otro': 'Otro'
  }
  return formatos[objeto] || objeto
}

// Helper: Calcular antigüedad en años
function calcularAntiguedad(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  const diff = fin.getTime() - inicio.getTime()
  const años = diff / (1000 * 60 * 60 * 24 * 365.25)
  return Math.floor(años * 10) / 10 // Redondear a 1 decimal
}
