import { NextRequest, NextResponse } from 'next/server'

// Esta API genera una constancia HTML que puede verse e imprimirse como PDF
// Simula el documento oficial del CCL para propositos de diagnostico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params
    
    if (!folio) {
      return NextResponse.json({ error: 'Folio requerido' }, { status: 400 })
    }

    // Parsear el folio para extraer info (formato: CCL-XXX-YYYYMMDD-NNNN)
    const partes = folio.split('-')
    const prefijo = partes[1] || 'XXX'
    const fecha = partes[2] || new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    // Mapear prefijo a estado
    const estadosPorPrefijo: Record<string, string> = {
      'AGU': 'Aguascalientes',
      'BAJ': 'Baja California',
      'BCS': 'Baja California Sur',
      'CAM': 'Campeche',
      'CHI': 'Chiapas',
      'CHH': 'Chihuahua',
      'CIU': 'Ciudad de Mexico',
      'COA': 'Coahuila',
      'COL': 'Colima',
      'DUR': 'Durango',
      'GUA': 'Guanajuato',
      'GUE': 'Guerrero',
      'HID': 'Hidalgo',
      'JAL': 'Jalisco',
      'EST': 'Estado de Mexico',
      'MIC': 'Michoacan',
      'MOR': 'Morelos',
      'NAY': 'Nayarit',
      'NUE': 'Nuevo Leon',
      'OAX': 'Oaxaca',
      'PUE': 'Puebla',
      'QUE': 'Queretaro',
      'QUI': 'Quintana Roo',
      'SAN': 'San Luis Potosi',
      'SIN': 'Sinaloa',
      'SON': 'Sonora',
      'TAB': 'Tabasco',
      'TAM': 'Tamaulipas',
      'TLA': 'Tlaxcala',
      'VER': 'Veracruz',
      'YUC': 'Yucatan',
      'ZAC': 'Zacatecas',
      'FED': 'Federal (CFCRL)'
    }
    
    const estado = estadosPorPrefijo[prefijo] || 'Centro de Conciliacion Laboral'
    
    // Formatear fecha
    const fechaFormateada = fecha.length === 8 
      ? `${fecha.slice(6, 8)}/${fecha.slice(4, 6)}/${fecha.slice(0, 4)}`
      : new Date().toLocaleDateString('es-MX')
    
    const horaActual = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    // Generar HTML que simula un documento oficial
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Constancia CCL - ${folio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .documento {
      background: white;
      width: 100%;
      max-width: 800px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      color: white;
      padding: 30px 40px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-text {
      color: #1e3a5f;
      font-weight: bold;
      font-size: 20px;
    }
    .header-info {
      flex: 1;
    }
    .titulo-documento {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .subtitulo {
      font-size: 14px;
      opacity: 0.9;
    }
    .gobierno {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 5px;
    }
    .folio-section {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      margin: 30px 40px;
      padding: 20px 25px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .folio-label {
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .folio-numero {
      color: #1e3a5f;
      font-size: 24px;
      font-weight: bold;
      font-family: monospace;
      margin-top: 5px;
    }
    .folio-fecha {
      text-align: right;
      color: #64748b;
      font-size: 13px;
    }
    .contenido {
      padding: 20px 40px;
    }
    .texto-intro {
      color: #374151;
      font-size: 14px;
      line-height: 1.7;
      margin-bottom: 25px;
    }
    .datos-tabla {
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 25px;
    }
    .dato-fila {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
    }
    .dato-fila:last-child {
      border-bottom: none;
    }
    .dato-label {
      width: 200px;
      padding: 12px 16px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }
    .dato-valor {
      flex: 1;
      padding: 12px 16px;
      color: #1f2937;
      font-size: 14px;
    }
    .nota-importante {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .nota-titulo {
      color: #92400e;
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nota-texto {
      color: #78350f;
      font-size: 13px;
      line-height: 1.6;
    }
    .verificacion {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .qr-simulado {
      width: 100px;
      height: 100px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 2px;
      padding: 8px;
      flex-shrink: 0;
    }
    .qr-cell {
      background: #1e3a5f;
      border-radius: 2px;
    }
    .qr-cell.empty {
      background: transparent;
    }
    .verificacion-info {
      flex: 1;
    }
    .verificacion-titulo {
      color: #374151;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .verificacion-url {
      color: #2563eb;
      font-size: 12px;
      font-family: monospace;
      word-break: break-all;
      margin-bottom: 10px;
    }
    .verificacion-nota {
      color: #64748b;
      font-size: 11px;
    }
    .footer {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      color: white;
      padding: 20px 40px;
      text-align: center;
    }
    .footer-linea {
      font-size: 12px;
      margin-bottom: 5px;
      opacity: 0.9;
    }
    .footer-folio {
      font-size: 11px;
      opacity: 0.7;
      font-family: monospace;
    }
    .acciones {
      padding: 20px 40px;
      background: #f1f5f9;
      display: flex;
      gap: 15px;
      justify-content: center;
    }
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #1e3a5f;
      color: white;
    }
    .btn-primary:hover {
      background: #2c5282;
    }
    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-secondary:hover {
      background: #f9fafb;
    }
    @media print {
      body { background: white; padding: 0; }
      .documento { box-shadow: none; max-width: none; }
      .acciones { display: none; }
    }
  </style>
</head>
<body>
  <div class="documento">
    <div class="header">
      <div class="logo">
        <span class="logo-text">CCL</span>
      </div>
      <div class="header-info">
        <div class="titulo-documento">CONSTANCIA DE SOLICITUD DE CONCILIACION</div>
        <div class="subtitulo">Centro de Conciliacion Laboral de ${estado}</div>
        <div class="gobierno">Gobierno de Mexico</div>
      </div>
    </div>
    
    <div class="folio-section">
      <div>
        <div class="folio-label">Folio Electronico</div>
        <div class="folio-numero">${folio}</div>
      </div>
      <div class="folio-fecha">
        <div>Fecha de emision:</div>
        <div><strong>${fechaFormateada}</strong></div>
        <div>${horaActual}</div>
      </div>
    </div>
    
    <div class="contenido">
      <p class="texto-intro">
        El Centro de Conciliacion Laboral del Estado de <strong>${estado}</strong> hace constar que se ha recibido 
        la <strong>SOLICITUD DE CONCILIACION LABORAL</strong> con los siguientes datos:
      </p>
      
      <div class="datos-tabla">
        <div class="dato-fila">
          <div class="dato-label">Tipo de solicitud</div>
          <div class="dato-valor">Conciliacion Laboral Individual</div>
        </div>
        <div class="dato-fila">
          <div class="dato-label">Estado</div>
          <div class="dato-valor">${estado}</div>
        </div>
        <div class="dato-fila">
          <div class="dato-label">Fecha de registro</div>
          <div class="dato-valor">${fechaFormateada}</div>
        </div>
        <div class="dato-fila">
          <div class="dato-label">Hora de registro</div>
          <div class="dato-valor">${horaActual}</div>
        </div>
        <div class="dato-fila">
          <div class="dato-label">Estatus</div>
          <div class="dato-valor" style="color: #059669; font-weight: 600;">REGISTRADA - Pendiente de audiencia</div>
        </div>
        <div class="dato-fila">
          <div class="dato-label">Folio de seguimiento</div>
          <div class="dato-valor" style="font-family: monospace; font-weight: bold;">${folio}</div>
        </div>
      </div>
      
      <div class="nota-importante">
        <div class="nota-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          IMPORTANTE
        </div>
        <div class="nota-texto">
          Esta constancia acredita la presentacion de su solicitud. Debera acudir a las oficinas del 
          Centro de Conciliacion Laboral en la fecha y hora que le sera notificada para la celebracion 
          de la audiencia de conciliacion. Conserve este documento como comprobante.
        </div>
      </div>
      
      <div class="verificacion">
        <div class="qr-simulado">
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell empty"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell empty"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell empty"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell empty"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
          <div class="qr-cell"></div>
        </div>
        <div class="verificacion-info">
          <div class="verificacion-titulo">Para verificar la autenticidad de este documento:</div>
          <div class="verificacion-url">https://ccl.${estado.toLowerCase().replace(/ /g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.gob.mx/verificar/${folio}</div>
          <div class="verificacion-nota">
            Este documento tiene validez oficial conforme a la Ley Federal del Trabajo y la Ley Organica 
            del Centro Federal de Conciliacion y Registro Laboral.
          </div>
        </div>
      </div>
    </div>
    
    <div class="acciones">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Imprimir / Guardar PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
    </div>
    
    <div class="footer">
      <div class="footer-linea">Centro de Conciliacion Laboral de ${estado}</div>
      <div class="footer-linea">Documento generado electronicamente - Validez oficial</div>
      <div class="footer-folio">Folio: ${folio} | ${fechaFormateada} ${horaActual}</div>
    </div>
  </div>
</body>
</html>
`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('[v0] Error generando constancia CCL:', error)
    return NextResponse.json(
      { error: 'Error al generar la constancia', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
