import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Genera un PDF de guia de llenado para la solicitud CCL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const solicitudId = searchParams.get('id')
  
  if (!solicitudId) {
    return NextResponse.json({ error: 'ID de solicitud requerido' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Obtener datos de la solicitud
  const { data: solicitud, error } = await supabase
    .from('solicitudes_ccl')
    .select(`
      *,
      caso:caso_id(*),
      centro:centro_conciliacion_id(*)
    `)
    .eq('id', solicitudId)
    .single()
  
  if (error || !solicitud) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }
  
  // Obtener datos del trabajador
  const { data: trabajador } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', solicitud.trabajador_id)
    .single()
  
  // Generar contenido HTML del PDF
  const htmlContent = generarHTMLGuia(solicitud, trabajador, solicitud.centro, solicitud.caso)
  
  // Por ahora retornamos HTML que el navegador puede imprimir como PDF
  // En produccion usariamos puppeteer o similar para generar PDF real
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  })
}

function generarHTMLGuia(
  solicitud: Record<string, unknown>,
  trabajador: Record<string, unknown> | null,
  centro: Record<string, unknown>,
  caso: Record<string, unknown>
): string {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const objetoSolicitud = {
    'despido': 'Despido injustificado',
    'rescision': 'Rescision de contrato (renuncia justificada)',
    'pago_prestaciones': 'Pago de prestaciones adeudadas',
    'terminacion_voluntaria': 'Terminacion voluntaria',
    'otro': 'Otro'
  }[solicitud.objeto_solicitud as string] || solicitud.objeto_solicitud
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guia de Llenado CCL - ${trabajador?.full_name || 'Trabajador'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 20px;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .fecha {
      font-size: 12px;
      color: #666;
    }
    .seccion {
      margin-bottom: 25px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .seccion-titulo {
      font-size: 14px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
    }
    .campo {
      display: flex;
      margin-bottom: 10px;
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }
    .campo-label {
      width: 180px;
      font-size: 12px;
      color: #666;
      flex-shrink: 0;
    }
    .campo-valor {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #111;
    }
    .campo-vacio {
      color: #9ca3af;
      font-style: italic;
    }
    .importante {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .importante-titulo {
      font-weight: bold;
      color: #92400e;
      margin-bottom: 8px;
    }
    .importante-texto {
      font-size: 13px;
      color: #78350f;
    }
    .ccl-info {
      background: #eff6ff;
      border: 1px solid #3b82f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .ccl-titulo {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .ccl-nombre {
      font-size: 16px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .ccl-direccion {
      font-size: 13px;
      color: #374151;
    }
    .competencia {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .competencia-local {
      background: #dcfce7;
      color: #166534;
    }
    .competencia-federal {
      background: #dbeafe;
      color: #1e40af;
    }
    .instrucciones {
      margin-top: 30px;
      padding: 20px;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .instrucciones h2 {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 15px;
    }
    .instrucciones ol {
      padding-left: 20px;
    }
    .instrucciones li {
      font-size: 13px;
      margin-bottom: 10px;
      color: #4b5563;
    }
    .portal-link {
      display: inline-block;
      margin-top: 15px;
      padding: 10px 20px;
      background: #1e40af;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body {
        padding: 10px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">mecorrieron.mx</div>
    <h1>Guia de Llenado - Solicitud de Conciliacion Laboral</h1>
    <div class="fecha">Generado el ${fechaGeneracion}</div>
  </div>

  <div class="importante">
    <div class="importante-titulo">IMPORTANTE</div>
    <div class="importante-texto">
      Esta guia contiene los datos prellenados para facilitar el llenado del formulario en el portal del 
      Centro de Conciliacion Laboral. Copie cada dato en el campo correspondiente del formulario oficial.
    </div>
  </div>

  <div class="ccl-info">
    <div class="ccl-titulo">CENTRO DE CONCILIACION ASIGNADO</div>
    <div class="ccl-nombre">${centro?.nombre || 'No determinado'}</div>
    <div class="ccl-direccion">${centro?.direccion || ''}</div>
    <div class="ccl-direccion">Horario: ${centro?.horario || 'Consultar'}</div>
    <div class="ccl-direccion">Telefono: ${centro?.telefono || 'N/A'}</div>
    <span class="competencia ${solicitud.competencia === 'federal' ? 'competencia-federal' : 'competencia-local'}">
      Competencia ${solicitud.competencia}
    </span>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">1. Datos del Solicitante (Trabajador)</div>
    
    <div class="campo">
      <span class="campo-label">CURP:</span>
      <span class="campo-valor">${trabajador?.curp || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Nombre completo:</span>
      <span class="campo-valor">${trabajador?.full_name || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">RFC:</span>
      <span class="campo-valor">${trabajador?.rfc || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Telefono:</span>
      <span class="campo-valor">${trabajador?.phone || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Correo electronico:</span>
      <span class="campo-valor">${trabajador?.email || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Domicilio:</span>
      <span class="campo-valor">${trabajador?.domicilio || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Codigo Postal:</span>
      <span class="campo-valor">${trabajador?.codigo_postal || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Estado:</span>
      <span class="campo-valor">${trabajador?.estado || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">2. Datos Laborales</div>
    
    <div class="campo">
      <span class="campo-label">Puesto:</span>
      <span class="campo-valor">${caso?.puesto || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha de ingreso:</span>
      <span class="campo-valor">${caso?.fecha_ingreso ? new Date(caso.fecha_ingreso as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha de separacion:</span>
      <span class="campo-valor">${caso?.fecha_separacion ? new Date(caso.fecha_separacion as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Salario mensual:</span>
      <span class="campo-valor">${caso?.salario_mensual ? '$' + Number(caso.salario_mensual).toLocaleString('es-MX') : '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Jornada laboral:</span>
      <span class="campo-valor">${caso?.jornada_semanal ? caso.jornada_semanal + ' horas/semana' : '<span class="campo-vacio">Completar</span>'}</span>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">3. Datos del Citado (Patron)</div>
    
    <div class="campo">
      <span class="campo-label">Razon social / Nombre:</span>
      <span class="campo-valor">${caso?.nombre_empresa || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">RFC del patron:</span>
      <span class="campo-valor">${caso?.rfc_empresa || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Domicilio centro trabajo:</span>
      <span class="campo-valor">${solicitud.direccion_centro_trabajo || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Estado:</span>
      <span class="campo-valor">${solicitud.estado_ccl || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Municipio:</span>
      <span class="campo-valor">${solicitud.municipio_ccl || '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    ${solicitud.referencias_ubicacion ? `
    <div class="campo">
      <span class="campo-label">Referencias:</span>
      <span class="campo-valor">${solicitud.referencias_ubicacion}</span>
    </div>
    ` : ''}
  </div>

  <div class="seccion">
    <div class="seccion-titulo">4. Datos de la Solicitud</div>
    
    <div class="campo">
      <span class="campo-label">Objeto de la solicitud:</span>
      <span class="campo-valor">${objetoSolicitud}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha del conflicto:</span>
      <span class="campo-valor">${solicitud.fecha_conflicto ? new Date(solicitud.fecha_conflicto as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Competencia:</span>
      <span class="campo-valor">${solicitud.competencia === 'federal' ? 'FEDERAL' : 'LOCAL (Estatal)'}</span>
    </div>
    ${solicitud.industria_federal ? `
    <div class="campo">
      <span class="campo-label">Industria federal:</span>
      <span class="campo-valor">${solicitud.industria_federal}</span>
    </div>
    ` : ''}
  </div>

  <div class="instrucciones">
    <h2>Instrucciones para el llenado:</h2>
    <ol>
      <li>Acceda al portal del Centro de Conciliacion: <strong>${centro?.portal_url || 'Consultar portal oficial'}</strong></li>
      <li>Seleccione "Nueva Solicitud" o "Solicitud de Trabajador"</li>
      <li>En la seccion de Industria, seleccione "${solicitud.competencia === 'federal' ? 'la industria federal correspondiente' : 'Ninguna de las anteriores (competencia local)'}"</li>
      <li>Complete los datos del solicitante copiando la informacion de esta guia</li>
      <li>Complete los datos del citado (patron) con la direccion del CENTRO DE TRABAJO</li>
      <li>Seleccione el objeto de la solicitud: <strong>${objetoSolicitud}</strong></li>
      <li>El campo de "Descripcion de hechos" puede dejarse vacio (no es obligatorio)</li>
      <li>Revise el resumen y confirme la solicitud</li>
      <li>Guarde el numero de folio generado</li>
      <li>Acuda a ratificar en persona dentro de los 5 dias habiles siguientes</li>
    </ol>
    
    ${centro?.portal_url ? `
    <a href="${centro.portal_url}" target="_blank" class="portal-link no-print">
      Ir al portal del CCL
    </a>
    ` : ''}
  </div>

  <div class="footer">
    <p>Documento generado por mecorrieron.mx - Sistema AutoCCL</p>
    <p>Este documento es una guia de referencia. La solicitud oficial debe generarse en el portal del CCL.</p>
    <p>Folio interno: ${solicitud.id}</p>
  </div>

  <script class="no-print">
    // Auto-print on load (optional)
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
`
}
