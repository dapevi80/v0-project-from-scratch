'use server'

import { createClient } from '@/lib/supabase/server'

// Nombres ficticios para generar usuarios
const NOMBRES = ['Juan', 'María', 'Carlos', 'Ana', 'José', 'Laura', 'Miguel', 'Carmen', 'Francisco', 'Patricia', 'Pedro', 'Rosa', 'Luis', 'Elena', 'Antonio', 'Guadalupe', 'Manuel', 'Teresa', 'Ricardo', 'Verónica']
const APELLIDOS_P = ['García', 'Hernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Jiménez', 'Ruiz', 'Vargas']
const APELLIDOS_M = ['Mendoza', 'Ortiz', 'Castro', 'Romero', 'Aguilar', 'Medina', 'Guerrero', 'Vega', 'Ramos', 'Chávez', 'Herrera', 'Navarro', 'Campos', 'Delgado', 'Domínguez', 'Núñez', 'Silva', 'Cortés', 'Mejía', 'Sandoval']
const EMPRESAS = ['Comercializadora del Norte SA de CV', 'Servicios Industriales MX', 'Grupo Empresarial Centro', 'Distribuidora Nacional SA', 'Construcciones y Proyectos', 'Alimentos y Bebidas SA', 'Tecnología Avanzada MX', 'Manufactura Industrial', 'Transportes Unidos SA', 'Consultores Profesionales']

// Códigos de entidad federativa para CURP
const ENTIDADES_CURP: Record<string, string> = {
  'Aguascalientes': 'AS', 'Baja California': 'BC', 'Baja California Sur': 'BS',
  'Campeche': 'CC', 'Chiapas': 'CS', 'Chihuahua': 'CH', 'Ciudad de México': 'DF',
  'Coahuila': 'CL', 'Colima': 'CM', 'Durango': 'DG', 'Guanajuato': 'GT',
  'Guerrero': 'GR', 'Hidalgo': 'HG', 'Jalisco': 'JC', 'Estado de México': 'MC',
  'Michoacán': 'MN', 'Morelos': 'MS', 'Nayarit': 'NT', 'Nuevo León': 'NL',
  'Oaxaca': 'OC', 'Puebla': 'PL', 'Querétaro': 'QT', 'Quintana Roo': 'QR',
  'San Luis Potosí': 'SP', 'Sinaloa': 'SL', 'Sonora': 'SR', 'Tabasco': 'TC',
  'Tamaulipas': 'TS', 'Tlaxcala': 'TL', 'Veracruz': 'VZ', 'Yucatán': 'YN',
  'Zacatecas': 'ZS', 'Federal': 'DF'
}

// Ciudades por estado
const CIUDADES: Record<string, string[]> = {
  'Aguascalientes': ['Aguascalientes', 'Jesús María', 'Calvillo'],
  'Baja California': ['Tijuana', 'Mexicali', 'Ensenada'],
  'Baja California Sur': ['La Paz', 'Los Cabos', 'Comondú'],
  'Campeche': ['Campeche', 'Ciudad del Carmen', 'Champotón'],
  'Chiapas': ['Tuxtla Gutiérrez', 'San Cristóbal', 'Tapachula'],
  'Chihuahua': ['Chihuahua', 'Ciudad Juárez', 'Cuauhtémoc'],
  'Ciudad de México': ['Benito Juárez', 'Coyoacán', 'Miguel Hidalgo', 'Cuauhtémoc', 'Tlalpan'],
  'Coahuila': ['Saltillo', 'Torreón', 'Monclova'],
  'Colima': ['Colima', 'Manzanillo', 'Tecomán'],
  'Durango': ['Durango', 'Gómez Palacio', 'Lerdo'],
  'Guanajuato': ['León', 'Guanajuato', 'Celaya', 'Irapuato'],
  'Guerrero': ['Acapulco', 'Chilpancingo', 'Iguala'],
  'Hidalgo': ['Pachuca', 'Tulancingo', 'Tula'],
  'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Puerto Vallarta'],
  'Estado de México': ['Toluca', 'Ecatepec', 'Naucalpan', 'Tlalnepantla'],
  'Michoacán': ['Morelia', 'Uruapan', 'Zamora'],
  'Morelos': ['Cuernavaca', 'Jiutepec', 'Cuautla'],
  'Nayarit': ['Tepic', 'Bahía de Banderas', 'Compostela'],
  'Nuevo León': ['Monterrey', 'San Pedro Garza García', 'Guadalupe', 'Apodaca'],
  'Oaxaca': ['Oaxaca de Juárez', 'Salina Cruz', 'Juchitán'],
  'Puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan'],
  'Querétaro': ['Querétaro', 'San Juan del Río', 'El Marqués'],
  'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Chetumal'],
  'San Luis Potosí': ['San Luis Potosí', 'Ciudad Valles', 'Soledad'],
  'Sinaloa': ['Culiacán', 'Mazatlán', 'Los Mochis'],
  'Sonora': ['Hermosillo', 'Ciudad Obregón', 'Nogales'],
  'Tabasco': ['Villahermosa', 'Cárdenas', 'Comalcalco'],
  'Tamaulipas': ['Tampico', 'Reynosa', 'Matamoros', 'Ciudad Victoria'],
  'Tlaxcala': ['Tlaxcala', 'Apizaco', 'Huamantla'],
  'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Poza Rica'],
  'Yucatán': ['Mérida', 'Valladolid', 'Tizimín'],
  'Zacatecas': ['Zacatecas', 'Fresnillo', 'Guadalupe'],
  'Federal': ['Ciudad de México']
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generarCURP(nombre: string, apellidoP: string, apellidoM: string, estado: string, sexo: 'H' | 'M'): string {
  const entidad = ENTIDADES_CURP[estado] || 'DF'
  const año = randomInt(70, 99)
  const mes = String(randomInt(1, 12)).padStart(2, '0')
  const dia = String(randomInt(1, 28)).padStart(2, '0')
  
  const primeraVocalApP = (apellidoP.slice(1).match(/[AEIOU]/i) || ['X'])[0].toUpperCase()
  const consonanteApP = (apellidoP.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/i) || ['X'])[0].toUpperCase()
  const consonanteApM = (apellidoM.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/i) || ['X'])[0].toUpperCase()
  const consonanteNom = (nombre.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/i) || ['X'])[0].toUpperCase()
  
  return `${apellidoP[0].toUpperCase()}${primeraVocalApP}${apellidoM[0].toUpperCase()}${nombre[0].toUpperCase()}${año}${mes}${dia}${sexo}${entidad}${consonanteApP}${consonanteApM}${consonanteNom}0${randomInt(0, 9)}`
}

function generarRFC(curp: string): string {
  return curp.slice(0, 10) + String(randomInt(100, 999))
}

function generarNSS(): string {
  return `${randomInt(10, 99)}${randomInt(10, 99)}${randomInt(10, 99)}${randomInt(1000, 9999)}${randomInt(0, 9)}`
}

export interface UsuarioPrueba {
  id?: string
  sesion_id: string
  estado: string
  nombre_completo: string
  curp: string
  rfc: string
  nss: string
  fecha_nacimiento: string
  sexo: 'H' | 'M'
  direccion: string
  ciudad: string
  codigo_postal: string
  telefono: string
  email: string
  empresa_nombre: string
  empresa_direccion: string
  puesto: string
  salario_diario: number
  fecha_ingreso: string
  fecha_despido: string
  antiguedad_dias: number
  tipo_despido: string
  monto_liquidacion: number
}

export function generarUsuarioPrueba(estado: string, sesionId: string): UsuarioPrueba {
  const sexo = Math.random() > 0.5 ? 'H' : 'M'
  const nombre = randomItem(NOMBRES)
  const apellidoP = randomItem(APELLIDOS_P)
  const apellidoM = randomItem(APELLIDOS_M)
  const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`
  
  const curp = generarCURP(nombre, apellidoP, apellidoM, estado, sexo)
  const rfc = generarRFC(curp)
  const nss = generarNSS()
  
  const ciudades = CIUDADES[estado] || ['Centro']
  const ciudad = randomItem(ciudades)
  
  // Fechas
  const hoy = new Date()
  const fechaDespido = new Date(hoy.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000)
  const antiguedadDias = randomInt(180, 5475) // 6 meses a 15 años
  const fechaIngreso = new Date(fechaDespido.getTime() - antiguedadDias * 24 * 60 * 60 * 1000)
  
  const añoNac = 1960 + randomInt(0, 35)
  const mesNac = randomInt(1, 12)
  const diaNac = randomInt(1, 28)
  
  const salarioDiario = randomInt(200, 800)
  const añosAntiguedad = antiguedadDias / 365
  
  // Calculo simplificado de liquidacion
  const tresMesesSalario = salarioDiario * 90
  const veintesDiasPorAño = salarioDiario * 20 * añosAntiguedad
  const primaAntiguedad = salarioDiario * 12 * Math.floor(añosAntiguedad)
  const vacaciones = salarioDiario * Math.min(20, 6 + Math.floor(añosAntiguedad))
  const aguinaldo = salarioDiario * 15 * (fechaDespido.getMonth() + 1) / 12
  const montoLiquidacion = Math.round(tresMesesSalario + veintesDiasPorAño + primaAntiguedad + vacaciones + aguinaldo)
  
  return {
    sesion_id: sesionId,
    estado,
    nombre_completo: nombreCompleto,
    curp,
    rfc,
    nss,
    fecha_nacimiento: `${añoNac}-${String(mesNac).padStart(2, '0')}-${String(diaNac).padStart(2, '0')}`,
    sexo,
    direccion: `Calle ${randomItem(['Juárez', 'Hidalgo', 'Morelos', 'Reforma', 'Independencia', 'Constitución'])} #${randomInt(100, 999)}, Col. ${randomItem(['Centro', 'Del Valle', 'Roma', 'Condesa', 'Industrial', 'Residencial'])}`,
    ciudad,
    codigo_postal: String(randomInt(10000, 99999)),
    telefono: `55${randomInt(10000000, 99999999)}`,
    email: `prueba.${estado.toLowerCase().replace(/ /g, '')}.${randomInt(1000, 9999)}@test.mecorrieron.mx`,
    empresa_nombre: randomItem(EMPRESAS),
    empresa_direccion: `Av. ${randomItem(['Industrial', 'Comercial', 'Principal', 'Central'])} #${randomInt(100, 9999)}, ${ciudad}, ${estado}`,
    puesto: randomItem(['Operador', 'Auxiliar', 'Vendedor', 'Supervisor', 'Técnico', 'Administrativo', 'Chofer', 'Almacenista']),
    salario_diario: salarioDiario,
    fecha_ingreso: fechaIngreso.toISOString().split('T')[0],
    fecha_despido: fechaDespido.toISOString().split('T')[0],
    antiguedad_dias: antiguedadDias,
    tipo_despido: 'injustificado',
    monto_liquidacion: montoLiquidacion
  }
}

export async function iniciarSesionDiagnostico(ejecutadoPor: string): Promise<{ sesionId: string; error?: string }> {
  const supabase = await createClient()
  
  // Verificar que es superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', ejecutadoPor)
    .single()
  
  if (profile?.role !== 'superadmin') {
    return { sesionId: '', error: 'Solo superadmin puede ejecutar diagnósticos' }
  }
  
  // Limpiar sesiones expiradas
  await supabase.rpc('limpiar_diagnosticos_expirados')
  
  // Contar pruebas del día
  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('ccl_diagnostico_sesiones')
    .select('*', { count: 'exact', head: true })
    .eq('ejecutado_por', ejecutadoPor)
    .gte('created_at', hoyInicio.toISOString())
  
  if ((count || 0) >= 3) {
    return { sesionId: '', error: 'Límite de 3 pruebas diarias alcanzado' }
  }
  
  // Crear nueva sesión
  const { data: sesion, error } = await supabase
    .from('ccl_diagnostico_sesiones')
    .insert({
      ejecutado_por: ejecutadoPor,
      estado: 'iniciando',
      total_portales: 33,
      portales_exitosos: 0,
      portales_fallidos: 0,
      portales_pendientes: 33
    })
    .select()
    .single()
  
  if (error) {
    return { sesionId: '', error: error.message }
  }
  
  return { sesionId: sesion.id }
}

export async function generarUsuariosPrueba(sesionId: string): Promise<{ usuarios: UsuarioPrueba[]; error?: string }> {
  const supabase = await createClient()
  
  const estados = Object.keys(ENTIDADES_CURP)
  const usuarios: UsuarioPrueba[] = []
  
  for (const estado of estados) {
    const usuario = generarUsuarioPrueba(estado, sesionId)
    usuarios.push(usuario)
  }
  
  // Insertar usuarios en batch
  const { data, error } = await supabase
    .from('ccl_diagnostico_usuarios')
    .insert(usuarios)
    .select()
  
  if (error) {
    return { usuarios: [], error: error.message }
  }
  
  // Actualizar estado de sesión
  await supabase
    .from('ccl_diagnostico_sesiones')
    .update({ estado: 'usuarios_generados' })
    .eq('id', sesionId)
  
  return { usuarios: data as UsuarioPrueba[] }
}

export async function obtenerEstadoSesion(sesionId: string) {
  const supabase = await createClient()
  
  const { data: sesion } = await supabase
    .from('ccl_diagnostico_sesiones')
    .select('*')
    .eq('id', sesionId)
    .single()
  
  const { data: usuarios } = await supabase
    .from('ccl_diagnostico_usuarios')
    .select('*')
    .eq('sesion_id', sesionId)
  
  const { data: resultados } = await supabase
    .from('ccl_diagnostico_resultados')
    .select('*')
    .eq('sesion_id', sesionId)
  
  return { sesion, usuarios, resultados }
}

export async function registrarResultado(
  sesionId: string,
  usuarioId: string,
  estado: string,
  resultado: {
    conectividad: boolean
    formulario_detectado: boolean
    envio_exitoso: boolean
    pdf_obtenido: boolean
    tiempo_respuesta_ms: number
    error_mensaje?: string
    url_portal?: string
    pdf_base64?: string
  }
) {
  const supabase = await createClient()
  
  // Determinar status
  let status = 'error'
  if (resultado.pdf_obtenido) {
    status = 'exito'
  } else if (resultado.conectividad && resultado.formulario_detectado) {
    status = 'parcial'
  } else if (!resultado.conectividad) {
    status = 'no_accesible'
  }
  
  // Insertar resultado
  await supabase
    .from('ccl_diagnostico_resultados')
    .insert({
      sesion_id: sesionId,
      usuario_id: usuarioId,
      estado,
      status,
      conectividad: resultado.conectividad,
      formulario_detectado: resultado.formulario_detectado,
      envio_exitoso: resultado.envio_exitoso,
      pdf_obtenido: resultado.pdf_obtenido,
      tiempo_respuesta_ms: resultado.tiempo_respuesta_ms,
      error_mensaje: resultado.error_mensaje,
      url_portal: resultado.url_portal,
      pdf_base64: resultado.pdf_base64
    })
  
  // Actualizar contadores de sesión
  const { data: conteo } = await supabase
    .from('ccl_diagnostico_resultados')
    .select('status')
    .eq('sesion_id', sesionId)
  
  const exitosos = conteo?.filter(r => r.status === 'exito').length || 0
  const fallidos = conteo?.filter(r => r.status !== 'exito').length || 0
  const pendientes = 33 - (conteo?.length || 0)
  
  await supabase
    .from('ccl_diagnostico_sesiones')
    .update({
      portales_exitosos: exitosos,
      portales_fallidos: fallidos,
      portales_pendientes: pendientes,
      estado: pendientes === 0 ? 'completado' : 'en_progreso'
    })
    .eq('id', sesionId)
}

export async function obtenerPortalCCL(estado: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('ccl_portales')
    .select('*')
    .eq('estado', estado)
    .eq('activo', true)
    .single()
  
  return data
}

export async function obtenerHistorialSesiones(userId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('ccl_diagnostico_sesiones')
    .select('*')
    .eq('ejecutado_por', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return data || []
}
