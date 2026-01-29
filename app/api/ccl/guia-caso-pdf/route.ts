import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Genera un PDF de guia de llenado para iniciar conciliacion desde un caso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const casoId = searchParams.get('casoId')

  if (!casoId) {
    return NextResponse.json({ error: 'ID de caso requerido' }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Obtener datos del caso con calculo
  const { data: caso, error } = await supabase
    .from('casos')
    .select(
      `
      *,
      calculo:calculos_liquidacion(*)
    `
    )
    .eq('id', casoId)
    .eq('worker_id', user.id)
    .single()

  if (error || !caso) {
    return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })
  }

  // Obtener datos del trabajador
  const { data: trabajador } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Generar contenido HTML del PDF
  const htmlContent = generarHTMLGuiaCaso(caso, trabajador, caso.calculo)

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function generarHTMLGuiaCaso(
  caso: Record<string, unknown>,
  trabajador: Record<string, unknown> | null,
  calculo: Record<string, unknown> | null
): string {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const motivoLabels: Record<string, string> = {
    despido_injustificado: 'Despido injustificado',
    rescision_trabajador: 'Rescision de contrato (renuncia justificada)',
    terminacion_voluntaria: 'Terminacion voluntaria',
    otro: 'Otro',
  }

  const motivoSolicitud = motivoLabels[(calculo?.motivo_separacion as string) || 'despido_injustificado'] || 'Despido injustificado'

  const salarioMensual = calculo?.salario_mensual || (calculo?.salario_diario ? Number(calculo.salario_diario) * 30 : null)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guia de Conciliacion - ${caso.folio}</title>
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
    .folio {
      font-size: 14px;
      font-weight: bold;
      color: #1e40af;
      margin-top: 5px;
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
    .monto-box {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 25px;
    }
    .monto-label {
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 5px;
    }
    .monto-valor {
      font-size: 28px;
      font-weight: bold;
      color: #1e3a8a;
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
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .alerta-prescripcion {
      background: #fef2f2;
      border: 2px solid #ef4444;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    .alerta-prescripcion-titulo {
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 5px;
    }
    .alerta-prescripcion-texto {
      font-size: 13px;
      color: #991b1b;
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
    <h1>Guia de Llenado para Solicitud de Conciliacion Laboral</h1>
    <div class="folio">Folio: ${caso.folio}</div>
    <div class="fecha">Generado el ${fechaGeneracion}</div>
  </div>

  ${caso.fecha_limite_prescripcion ? `
  <div class="alerta-prescripcion">
    <div class="alerta-prescripcion-titulo">FECHA LIMITE DE PRESCRIPCION</div>
    <div class="alerta-prescripcion-texto">
      Debes iniciar tu proceso antes del: <strong>${new Date(caso.fecha_limite_prescripcion as string).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}</strong>
      (${caso.dias_prescripcion} dias desde el despido/separacion)
    </div>
  </div>
  ` : ''}

  <div class="importante">
    <div class="importante-titulo">IMPORTANTE</div>
    <div class="importante-texto">
      Esta guia contiene los datos que necesitas para llenar el formulario de solicitud de conciliacion 
      en el Centro de Conciliacion Laboral (CCL). Copia cada dato en el campo correspondiente del 
      formulario oficial en el portal del CCL de tu estado.
    </div>
  </div>

  <div class="monto-box">
    <div class="monto-label">MONTO ESTIMADO DE TU LIQUIDACION</div>
    <div class="monto-valor">${caso.monto_estimado ? '$' + Number(caso.monto_estimado).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'Por calcular'}</div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">1. Tus Datos (Solicitante/Trabajador)</div>
    
    <div class="campo">
      <span class="campo-label">CURP:</span>
      <span class="campo-valor">${trabajador?.curp || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Nombre completo:</span>
      <span class="campo-valor">${trabajador?.full_name || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">RFC:</span>
      <span class="campo-valor">${trabajador?.rfc || '<span class="campo-vacio">Opcional</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Telefono:</span>
      <span class="campo-valor">${trabajador?.phone || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Correo electronico:</span>
      <span class="campo-valor">${trabajador?.email || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Domicilio:</span>
      <span class="campo-valor">${trabajador?.domicilio || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Codigo Postal:</span>
      <span class="campo-valor">${trabajador?.codigo_postal || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Estado:</span>
      <span class="campo-valor">${trabajador?.estado || caso.estado || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">2. Datos de tu Empleo</div>
    
    <div class="campo">
      <span class="campo-label">Puesto:</span>
      <span class="campo-valor">${calculo?.puesto || caso.puesto_trabajo || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha de ingreso:</span>
      <span class="campo-valor">${calculo?.fecha_ingreso ? new Date(calculo.fecha_ingreso as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha de separacion/despido:</span>
      <span class="campo-valor">${calculo?.fecha_salida || caso.fecha_despido ? new Date((calculo?.fecha_salida || caso.fecha_despido) as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Salario mensual:</span>
      <span class="campo-valor">${salarioMensual ? '$' + Number(salarioMensual).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Antiguedad:</span>
      <span class="campo-valor">${calculo?.antiguedad_anios ? `${calculo.antiguedad_anios} años, ${calculo.antiguedad_meses || 0} meses` : '<span class="campo-vacio">Se calculara automaticamente</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Jornada laboral:</span>
      <span class="campo-valor">${calculo?.tipo_jornada || caso.tipo_jornada || '<span class="campo-vacio">Ej: Diurna, 48 hrs/semana</span>'}</span>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">3. Datos de la Empresa (Citado/Patron)</div>
    
    <div class="campo">
      <span class="campo-label">Nombre/Razon social:</span>
      <span class="campo-valor">${caso.empresa_nombre || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">RFC del patron:</span>
      <span class="campo-valor">${caso.empresa_rfc || calculo?.empresa_rfc || '<span class="campo-vacio">Opcional</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Direccion del trabajo:</span>
      <span class="campo-valor">${caso.direccion_trabajo_calle || calculo?.direccion_trabajo || '<span class="campo-vacio">Debes completar (donde trabajabas)</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Estado:</span>
      <span class="campo-valor">${caso.estado || caso.direccion_trabajo_estado || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Municipio/Ciudad:</span>
      <span class="campo-valor">${caso.ciudad || caso.direccion_trabajo_municipio || '<span class="campo-vacio">Debes completar</span>'}</span>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">4. Datos de la Solicitud</div>
    
    <div class="campo">
      <span class="campo-label">Motivo de la solicitud:</span>
      <span class="campo-valor">${motivoSolicitud}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Fecha del conflicto:</span>
      <span class="campo-valor">${caso.fecha_despido ? new Date(caso.fecha_despido as string).toLocaleDateString('es-MX') : '<span class="campo-vacio">Fecha de tu despido/separacion</span>'}</span>
    </div>
    <div class="campo">
      <span class="campo-label">Tipo de caso:</span>
      <span class="campo-valor">${caso.tipo_caso === 'rescision' ? 'Rescision (renuncia justificada)' : 'Despido injustificado'}</span>
    </div>
  </div>

  <div class="instrucciones">
    <h2>Pasos para llenar tu solicitud:</h2>
    <ol>
      <li>Busca en Google: "Centro de Conciliacion Laboral ${caso.estado || '[tu estado]'}" y entra al portal oficial</li>
      <li>Busca la opcion "Nueva Solicitud" o "Solicitud del Trabajador"</li>
      <li>Preguntaran si tu empresa pertenece a una industria federal (mineria, petroquimica, electrica, ferrocarriles, etc.). Si NO pertenece a ninguna, selecciona "Ninguna de las anteriores"</li>
      <li>Llena tus datos personales copiando la informacion de esta guia</li>
      <li>En los datos de la empresa, usa la direccion de tu CENTRO DE TRABAJO (donde trabajabas)</li>
      <li>Selecciona "${motivoSolicitud}" como objeto de la solicitud</li>
      <li>La descripcion de hechos generalmente es opcional, puedes dejarla vacia o poner un resumen breve</li>
      <li>Revisa el resumen y confirma tu solicitud</li>
      <li>IMPORTANTE: Guarda el numero de folio que te den</li>
      <li>Acude a RATIFICAR tu solicitud en persona dentro de los 5 dias habiles siguientes</li>
    </ol>
  </div>

  <div class="footer">
    <p>Documento generado por mecorrieron.mx</p>
    <p>Esta guia es de referencia. La solicitud oficial debe generarse en el portal del CCL de tu estado.</p>
    <p>Folio interno: ${caso.id}</p>
  </div>

  <script class="no-print">
    window.onload = function() { 
      // Opcionalmente auto-imprimir
      // window.print(); 
    }
  </script>
</body>
</html>
`
}
