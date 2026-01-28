'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Empresas reales de Mexico por estado
const EMPRESAS = [
  // CDMX
  'Walmart de Mexico SAB de CV', 'Grupo Bimbo SAB de CV', 'America Movil SAB', 'BBVA Mexico SA', 'Liverpool SAB de CV',
  'Grupo Carso SAB de CV', 'Televisa SA de CV', 'Elektra SAB de CV', 'Grupo Sanborns', 'Palacio de Hierro',
  // Nuevo Leon  
  'FEMSA SAB de CV', 'Cemex SAB de CV', 'Alfa SAB de CV', 'Banorte SAB de CV', 'Ternium Mexico SA',
  'Grupo Villacero SA', 'Xignux SA de CV', 'Gruma SAB de CV', 'Arca Continental', 'Axtel SAB',
  // Jalisco
  'Jose Cuervo SA de CV', 'Grupo Modelo Guadalajara', 'Flexi SA de CV', 'Omnilife SA de CV', 'Continental Guadalajara',
  'HP Mexico SA de CV', 'Flextronics Guadalajara', 'Jabil Circuit', 'Intel Guadalajara', 'Oracle Mexico',
  // Estado de Mexico
  'Coca-Cola FEMSA', 'Nestle Mexico SA', 'La Moderna SA', 'Herdez SA de CV', 'Jumex SA de CV',
  'Kimberly Clark Mexico', 'Colgate Palmolive', 'Procter and Gamble Mexico', 'Unilever Mexico', 'Danone Mexico',
  // Guanajuato
  'General Motors de Mexico', 'Mazda Motor Mexico', 'Honda de Mexico', 'Volkswagen Guanajuato', 'Toyota Guanajuato',
  // Puebla
  'Volkswagen de Mexico SA', 'Audi Mexico SA de CV', 'Farmacias del Ahorro', 'Textiles de Puebla SA', 'Mabe Puebla',
  // Queretaro
  'Samsung Electronics Mexico', 'Kelloggs de Mexico', 'Bombardier Queretaro', 'Safran Mexico', 'ITP Aero Mexico',
  // Coahuila
  'Stellantis Mexico', 'General Motors Ramos Arizpe', 'Grupo Industrial Saltillo', 'AHMSA', 'Deacero SA',
  // Chihuahua
  'Foxconn Mexico SA', 'Lexmark Mexico', 'Bosch Mexico SA', 'BRP Mexico SA', 'Honeywell Mexico',
  // Baja California
  'Toyota Baja California', 'Hyundai Mexico', 'Samsung SDI Mexico', 'Skyworks Solutions', 'Plantronics Mexico',
  // Sonora
  'Ford Motor Company Mexico', 'Grupo Mexico SAB', 'Bachoco SAB de CV', 'Minera Fresnillo', 'Tetakawi SA',
  // Tamaulipas
  'Pemex Refineria Madero', 'LG Electronics Reynosa', 'Delphi Mexico SA', 'Aptiv Mexico', 'Caterpillar Mexico',
  // Veracruz
  'Grupo Lala SAB', 'Cerveceria Modelo Orizaba', 'TAMSA SA de CV', 'Pemex Coatzacoalcos', 'Braskem Idesa',
  // San Luis Potosi
  'BMW de Mexico SA', 'Continental Automotive SLP', 'ZF Friedrichshafen', 'Cummins Mexico', 'Draexlmaier Mexico',
  // Aguascalientes
  'Nissan Mexicana SA', 'Texas Instruments Mexico', 'Sensata Technologies', 'Jatco Mexico', 'Yazaki Mexico',
  // Yucatan
  'Grupo Kuo SAB', 'Bachoco Yucatan', 'Cerveceria Yucateca', 'Grupo Bepensa', 'Megamedia Yucatan',
  // Quintana Roo
  'Grupo Xcaret SA', 'Palace Resorts', 'Hotel Riu Cancun', 'Hard Rock Hotel Cancun', 'Barcelo Maya',
  // Sinaloa
  'Grupo Coppel SA de CV', 'Casa Ley SA de CV', 'Sukarne SA de CV', 'Bachoco Sinaloa', 'Agricola Tarriba',
  // Michoacan
  'Mission Produce Mexico', 'ArcelorMittal Lazaro Cardenas', 'Calavo Mexico', 'West Pak Avocado', 'Fresh Del Monte',
  // Otros estados
  'Fresnillo PLC Mexico', 'Penoles SAB de CV', 'Pemex Campeche', 'Schlumberger Mexico', 'Halliburton Mexico'
]

const ESTADOS = [
  'Ciudad de Mexico', 'Estado de Mexico', 'Jalisco', 'Nuevo Leon', 'Puebla',
  'Guanajuato', 'Chihuahua', 'Michoacan', 'Veracruz', 'Baja California',
  'Tamaulipas', 'Coahuila', 'Sinaloa', 'Sonora', 'Queretaro',
  'Hidalgo', 'Morelos', 'Aguascalientes', 'Yucatan', 'Quintana Roo',
  'San Luis Potosi', 'Oaxaca', 'Tabasco', 'Chiapas', 'Guerrero',
  'Durango', 'Zacatecas', 'Nayarit', 'Tlaxcala', 'Colima',
  'Campeche', 'Baja California Sur'
]

const NOMBRES = [
  'Juan', 'Maria', 'Carlos', 'Ana', 'Jose', 'Laura', 'Miguel', 'Patricia', 'Francisco', 'Rosa',
  'Pedro', 'Carmen', 'Luis', 'Guadalupe', 'Jorge', 'Leticia', 'Roberto', 'Adriana', 'Fernando', 'Monica',
  'Ricardo', 'Veronica', 'Daniel', 'Elizabeth', 'Eduardo', 'Martha', 'Manuel', 'Sandra', 'Arturo', 'Claudia',
  'Alejandro', 'Gabriela', 'Raul', 'Diana', 'Oscar', 'Alejandra', 'Sergio', 'Angelica', 'Enrique', 'Beatriz'
]

const APELLIDOS = [
  'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
  'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Gutierrez', 'Chavez',
  'Ramos', 'Vargas', 'Castillo', 'Jimenez', 'Moreno', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Vega'
]

const PUESTOS = [
  'Operador de Produccion', 'Auxiliar Administrativo', 'Vendedor', 'Almacenista', 'Chofer',
  'Recepcionista', 'Cajero', 'Supervisor de Area', 'Tecnico de Mantenimiento', 'Vigilante',
  'Cocinero', 'Mesero', 'Limpieza General', 'Ejecutivo de Ventas', 'Contador',
  'Analista de Sistemas', 'Gerente de Tienda', 'Jefe de Almacen', 'Coordinador de Logistica', 'Asistente de Direccion'
]

const MOTIVOS_DESPIDO = [
  'Despido injustificado sin liquidacion',
  'Recorte de personal por reestructura',
  'Reduccion de salario sin previo aviso',
  'Acoso laboral del supervisor',
  'No pago de horas extras trabajadas',
  'Despido por embarazo',
  'Discriminacion por edad',
  'Falta de pago de aguinaldo',
  'No inscripcion al IMSS',
  'Despido por enfermedad',
  'Reduccion de jornada sin consentimiento',
  'Cambio de condiciones de trabajo',
  'Hostigamiento para renunciar',
  'No pago de vacaciones',
  'Despido durante incapacidad'
]

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1)
  const end = new Date(endYear, 11, 31)
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

function generatePhone(): string {
  const prefix = ['55', '81', '33', '656', '614', '844', '999', '998', '667', '662']
  return `${random(prefix)}${randomInt(1000000, 9999999)}`
}

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'SUPABASE_SERVICE_ROLE_KEY no configurado' 
      }, { status: 500 })
    }
    
    // Obtener el superadmin como referidor raiz (puede no existir)
    const { data: superadminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'superadmin')
      .maybeSingle()
    
    const superadminId = superadminProfile?.id || null
    
    // Obtener el abogado de prueba (puede no existir)
    const { data: lawyerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'lawyer')
      .maybeSingle()
    
    const lawyerId = lawyerProfile?.id || null
    
    // Generar 100 cotizaciones en memoria primero (mucho mas rapido)
    const cotizacionesData = []
    const cotizacionesParaCasos: { index: number; status: string; motivo: string; anos: number }[] = []
    
    for (let i = 0; i < 100; i++) {
      const nombre = random(NOMBRES)
      const apellidoP = random(APELLIDOS)
      const apellidoM = random(APELLIDOS)
      const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`
      const estado = random(ESTADOS)
      const empresa = random(EMPRESAS)
      const puesto = random(PUESTOS)
      const salario = randomInt(6000, 45000)
      const antiguedad = randomInt(1, 180)
      const fechaIngreso = randomDate(2015, 2024)
      const fechaDespido = randomDate(2024, 2025)
      const motivo = random(MOTIVOS_DESPIDO)
      const anosAntiguedad = antiguedad / 12
      const indemnizacion = Math.round(salario * 3 + (salario * 20 * anosAntiguedad / 365) + salario)
      const statusOptions = ['nueva', 'nueva', 'nueva', 'contactada', 'en_proceso', 'completada']
      const status = random(statusOptions)
      
      cotizacionesData.push({
        nombre_trabajador: nombreCompleto,
        telefono: generatePhone(),
        estado: estado,
        empresa_nombre: empresa,
        puesto: puesto,
        salario_mensual: salario,
        antiguedad_meses: antiguedad,
        fecha_ingreso: fechaIngreso,
        fecha_despido: fechaDespido,
        motivo_separacion: motivo,
        indemnizacion_estimada: indemnizacion,
        status: status,
        referido_por: superadminId,
        created_at: randomDate(2024, 2025) + 'T' + randomInt(8, 22) + ':' + randomInt(10, 59) + ':00Z'
      })
      
      // Marcar cuales tendran caso (40% de los que no son "nueva")
      if (Math.random() < 0.4 && status !== 'nueva') {
        cotizacionesParaCasos.push({ index: i, status, motivo, anos: anosAntiguedad })
      }
    }
    
    // BATCH INSERT: Insertar todas las cotizaciones de una vez
    const { data: cotizaciones, error: cotError } = await supabase
      .from('cotizaciones')
      .insert(cotizacionesData)
      .select('id')
    
    if (cotError) {
      return NextResponse.json({ success: false, error: `Error cotizaciones: ${cotError.message}` }, { status: 500 })
    }
    
    const cotizacionIds = cotizaciones?.map(c => c.id) || []
    
    // Preparar casos para batch insert
    const casosData = cotizacionesParaCasos.map(c => {
      const caseStatus = random(['verificado', 'en_revision', 'asignado', 'en_proceso'])
      return {
        cotizacion_id: cotizacionIds[c.index],
        status: caseStatus,
        assigned_lawyer_id: (caseStatus === 'asignado' || caseStatus === 'en_proceso') ? lawyerId : null,
        priority: random(['baja', 'media', 'alta', 'urgente']),
        notas_internas: c.motivo + '. Trabajador con ' + c.anos.toFixed(1) + ' años de antiguedad.',
        created_at: new Date().toISOString()
      }
    }).filter(c => c.cotizacion_id) // Solo los que tienen cotizacion_id valido
    
    // BATCH INSERT: Insertar todos los casos de una vez
    let casosCreados = 0
    if (casosData.length > 0) {
      const { data: casos, error: caseError } = await supabase
        .from('cases')
        .insert(casosData)
        .select('id')
      
      if (!caseError && casos) {
        casosCreados = casos.length
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Simulacion creada exitosamente`,
      data: {
        cotizaciones_creadas: cotizacionIds.length,
        casos_creados: casosCreados,
        superadmin_referidor: superadminId,
        abogado_asignado: lawyerId
      }
    })
    
  } catch (error) {
    console.error('Error en simulacion:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST para crear datos de simulacion',
    endpoint: '/api/dev/create-simulation-data'
  })
}
