'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Datos completos de abogados mexicanos ficticios con CURP y RFC simulados
const abogadosData = [
  // 10 GUESTLAWYER - Pendientes de verificar (documentos subidos, esperando revision)
  { nombre: 'Roberto Hernandez Martinez', genero: 'M', fechaNac: '1985-03-15', estado: 'DF' },
  { nombre: 'Patricia Gomez Sanchez', genero: 'F', fechaNac: '1990-07-22', estado: 'JC' },
  { nombre: 'Fernando Torres Rodriguez', genero: 'M', fechaNac: '1982-11-08', estado: 'NL' },
  { nombre: 'Alejandra Ruiz Lopez', genero: 'F', fechaNac: '1988-04-30', estado: 'JC' },
  { nombre: 'Miguel Angel Flores Garcia', genero: 'M', fechaNac: '1979-09-12', estado: 'DF' },
  { nombre: 'Carmen Diaz Fernandez', genero: 'F', fechaNac: '1991-01-25', estado: 'PU' },
  { nombre: 'Jorge Luis Ramirez Perez', genero: 'M', fechaNac: '1986-06-18', estado: 'GU' },
  { nombre: 'Ana Maria Morales Jimenez', genero: 'F', fechaNac: '1993-12-03', estado: 'QR' },
  { nombre: 'Eduardo Castro Vargas', genero: 'M', fechaNac: '1984-08-27', estado: 'CH' },
  { nombre: 'Gabriela Mendoza Cruz', genero: 'F', fechaNac: '1987-02-14', estado: 'VE' },
  // 10 GUESTLAWYER - Sin documentos completos (perfil incompleto)
  { nombre: 'Ricardo Ortiz Reyes', genero: 'M', fechaNac: '1980-05-09', estado: 'DF' },
  { nombre: 'Laura Elena Silva Gutierrez', genero: 'F', fechaNac: '1992-10-17', estado: 'MC' },
  { nombre: 'Oscar Navarro Dominguez', genero: 'M', fechaNac: '1983-07-21', estado: 'NL' },
  { nombre: 'Monica Aguilar Romero', genero: 'F', fechaNac: '1989-03-06', estado: 'JC' },
  { nombre: 'David Herrera Castillo', genero: 'M', fechaNac: '1981-11-30', estado: 'SO' },
  { nombre: 'Veronica Luna Espinoza', genero: 'F', fechaNac: '1994-09-02', estado: 'BS' },
  { nombre: 'Arturo Vazquez Medina', genero: 'M', fechaNac: '1978-04-11', estado: 'TA' },
  { nombre: 'Rosa Maria Delgado Vega', genero: 'F', fechaNac: '1990-12-28', estado: 'CO' },
  { nombre: 'Carlos Alberto Ramos Soto', genero: 'M', fechaNac: '1985-01-19', estado: 'SI' },
  { nombre: 'Diana Contreras Fuentes', genero: 'F', fechaNac: '1991-08-05', estado: 'YU' }
]

const nombresAbogados = abogadosData.map(abogado => abogado.nombre)

// Universidades mexicanas
const universidades = [
  'UNAM - Facultad de Derecho', 'Universidad Panamericana', 'ITAM', 'Universidad Iberoamericana',
  'Escuela Libre de Derecho', 'Universidad Anahuac', 'Tecnologico de Monterrey', 'Universidad La Salle',
  'Universidad Autonoma de Guadalajara', 'Universidad Autonoma de Nuevo Leon', 'BUAP',
  'Universidad de Guanajuato', 'Universidad Autonoma de Yucatan', 'Universidad Veracruzana'
]

// Estados de Mexico
const estadosMexico = [
  'Ciudad de Mexico', 'Estado de Mexico', 'Jalisco', 'Nuevo Leon', 'Puebla', 'Guanajuato',
  'Chihuahua', 'Veracruz', 'Baja California', 'Tamaulipas', 'Coahuila', 'Sinaloa',
  'Sonora', 'Queretaro', 'Yucatan', 'Quintana Roo', 'San Luis Potosi', 'Michoacan'
]

// Especialidades
const especialidades = ['laboral', 'civil', 'mercantil', 'familiar', 'penal', 'fiscal', 'administrativo']

// Despachos ficticios
const nombresDespachos = [
  'Hernandez & Asociados', 'Bufete Juridico Torres', 'Corporativo Legal MX', 'Asesoria Integral Gomez',
  'Despacho Ramirez Partners', 'Legal Solutions Mexico', 'Abogados Unidos del Norte', 'Consultoria Legal Premium',
  'Firma Juridica Morales', 'Centro de Asesoria Legal', 'Despacho Especializado en Laboral', 'Juridico Empresarial SA'
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateCedula(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

function generatePhone(): string {
  const ladas = ['55', '33', '81', '222', '477', '999', '656', '614', '998', '664']
  return ladas[Math.floor(Math.random() * ladas.length)] + Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 7)
}

// Generar CURP simulado
function generateCURP(nombre: string, fechaNac: string, genero: string, estado: string): string {
  const partes = nombre.split(' ')
  const apellido1 = partes[partes.length - 2] || 'XX'
  const apellido2 = partes[partes.length - 1] || 'XX'
  const nombreP = partes[0] || 'X'
  
  const fecha = fechaNac.replace(/-/g, '').slice(2)
  const consonantes = 'BCDFGHJKLMNPQRSTVWXYZ'
  
  return `${apellido1[0]}${apellido1[1] || 'X'}${apellido2[0]}${nombreP[0]}${fecha}${genero}${estado}${consonantes[Math.floor(Math.random() * consonantes.length)]}${consonantes[Math.floor(Math.random() * consonantes.length)]}${consonantes[Math.floor(Math.random() * consonantes.length)]}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`.toUpperCase()
}

// Generar RFC simulado
function generateRFC(nombre: string, fechaNac: string): string {
  const partes = nombre.split(' ')
  const apellido1 = partes[partes.length - 2] || 'XX'
  const apellido2 = partes[partes.length - 1] || 'XX'
  const nombreP = partes[0] || 'X'
  
  const fecha = fechaNac.replace(/-/g, '').slice(2)
  const homoclave = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
  
  return `${apellido1[0]}${apellido1[1] || 'X'}${apellido2[0]}${nombreP[0]}${fecha}${homoclave}`.toUpperCase()
}

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno' 
      }, { status: 500 })
    }
    
    let createdProfiles = 0
    let createdLawyerProfiles = 0
    const errors: string[] = []
    
    for (let i = 0; i < 20; i++) {
      const abogado = abogadosData[i]
      const nombreCompleto = `Lic. ${abogado.nombre}`
      const email = `abogado.sim${i + 1}@mecorrieron.mx`
      const password = 'SimulacionAbogado2026'
      
      // Primeros 10: documentos completos, listos para revision
      // Ultimos 10: documentos incompletos, perfil parcial
      const tieneDocumentosCompletos = i < 10
      const verificationStatus = tieneDocumentosCompletos ? 'pending' : 'incomplete'
      
      try {
        let userId: string | null = null
        
        // 1. Primero verificar si ya existe el perfil en profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        
        if (existingProfile) {
          // Usuario ya existe, usar su ID
          userId = existingProfile.id
        } else {
          // 2. Intentar crear usuario - si falla por existir, buscarlo y eliminarlo primero
          let { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: nombreCompleto,
              role: 'guestlawyer'
            }
          })
          
          if (authError && (authError.message.includes('already') || authError.message.includes('exists') || authError.code === 'email_exists')) {
            // Usuario existe en auth pero no en profiles - buscar y eliminar para recrear limpio
            const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            const existingUser = users?.users?.find(u => u.email === email)
            
            if (existingUser) {
              // Eliminar usuario existente y sus datos
              await supabase.from('lawyer_profiles').delete().eq('user_id', existingUser.id)
              await supabase.from('profiles').delete().eq('id', existingUser.id)
              await supabase.auth.admin.deleteUser(existingUser.id)
              
              // Reintentar crear
              const retry = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: nombreCompleto, role: 'guestlawyer' }
              })
              authData = retry.data
              authError = retry.error
            }
          }
          
          if (authError) {
            errors.push(`Error auth ${email}: ${authError.message}`)
            continue
          }
          
          if (authData?.user) {
            userId = authData.user.id
          }
        }
        
        if (!userId) {
          errors.push(`No se pudo obtener ID para ${email}`)
          continue
        }
        const curp = generateCURP(abogado.nombre, abogado.fechaNac, abogado.genero, abogado.estado)
        const rfc = generateRFC(abogado.nombre, abogado.fechaNac)
        const cedula = generateCedula()
        const phone = generatePhone()
        
        // Fecha de creacion aleatoria en los ultimos 30 dias
        const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        
        // 2. Crear perfil en profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email,
            full_name: nombreCompleto,
            phone,
            role: 'guestlawyer',
            verification_status: verificationStatus,
            created_at: createdAt
          }, { onConflict: 'id' })
        
        if (profileError) {
          errors.push(`Error creando profile para ${email}: ${profileError.message}`)
          continue
        }
        
        createdProfiles++
        
        // 3. Crear lawyer_profile con datos variados
        const estadosOp = randomItems(estadosMexico, 1, 4)
        const specs = randomItems(especialidades, 1, 3)
        const anosExp = Math.floor(Math.random() * 20) + 2
        const hasDespacho = Math.random() > 0.5
        const universidad = randomItem(universidades)
        
        const lawyerData: Record<string, unknown> = {
          user_id: userId,
          display_name: nombreCompleto,
          cedula_profesional: tieneDocumentosCompletos ? cedula : null,
          universidad: universidad,
          especialidades: specs,
          estados_operacion: estadosOp,
          anos_experiencia: anosExp,
          verification_status: verificationStatus,
          is_available: false,
          bio: `Abogado con ${anosExp} años de experiencia especializado en derecho ${specs.join(', ')}. Egresado de ${universidad}. Brindo atencion en ${estadosOp.join(', ')}.`,
          firm_name: hasDespacho ? randomItem(nombresDespachos) : null,
          whatsapp: '52' + phone,
          horario_atencion: Math.random() > 0.5 ? 'Lunes a Viernes 9:00 - 18:00' : 'Lunes a Sabado 10:00 - 19:00',
          created_at: createdAt
        }
        
        // Agregar datos de identificacion solo si tiene documentos completos
        if (tieneDocumentosCompletos) {
          // URLs simuladas de documentos (en produccion serian URLs de storage)
          const baseDocUrl = '/api/dev/doc-placeholder'
          Object.assign(lawyerData, {
            curp,
            rfc,
            ine_url: `${baseDocUrl}?type=ine&name=${encodeURIComponent(abogado.nombre)}&curp=${curp}`,
            cedula_url: `${baseDocUrl}?type=cedula&name=${encodeURIComponent(abogado.nombre)}&cedula=${cedula}`,
            titulo_url: `${baseDocUrl}?type=titulo&name=${encodeURIComponent(abogado.nombre)}&universidad=${encodeURIComponent(universidad)}`,
            constancia_fiscal_url: `${baseDocUrl}?type=constancia&name=${encodeURIComponent(abogado.nombre)}&rfc=${rfc}`,
            foto_perfil_url: `${baseDocUrl}?type=foto&name=${encodeURIComponent(abogado.nombre)}&genero=${abogado.genero}`,
            documentos_completos: true,
            fecha_envio_documentos: createdAt
          })
        }
        
        const { error: lawyerError } = await supabase
          .from('lawyer_profiles')
          .upsert(lawyerData, { onConflict: 'user_id' })
        
        if (lawyerError) {
          errors.push(`Error creando lawyer_profile para ${email}: ${lawyerError.message}`)
          continue
        }
        
        createdLawyerProfiles++
        
      } catch (err) {
        errors.push(`Error general para abogado ${i + 1}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        profiles_creados: createdProfiles,
        lawyer_profiles_creados: createdLawyerProfiles,
        password_comun: 'SimulacionAbogado2026',
        errores: errors
      }
    })
    
  } catch (error) {
    console.error('Error en simulacion de abogados:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
