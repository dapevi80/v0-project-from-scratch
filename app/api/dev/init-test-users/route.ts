import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Solo funciona en desarrollo
const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

const TEST_USERS = [
  { 
    email: 'guest123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'guest', 
    full_name: 'Usuario Invitado',
    phone: null
  },
  { 
    email: 'trabajador123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'worker', 
    full_name: 'Juan Perez Trabajador',
    phone: '5551234567'
  },
  { 
    email: 'guestabogado123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'guestlawyer', 
    full_name: 'Lic. Carlos Mendez',
    phone: '5559876543'
  },
  { 
    email: 'abogado123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'lawyer', 
    full_name: 'Lic. Maria Garcia Lopez',
    phone: '5551112233'
  },
  { 
    email: 'admin123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'admin', 
    full_name: 'Administrador Sistema',
    phone: '5550001111'
  },
  { 
    email: 'superadmin123@mecorrieron.mx', 
    password: 'Cancun2026', 
    role: 'superadmin', 
    full_name: 'Super Administrador',
    phone: '5550002222'
  },
]

export async function POST() {
  if (!isDev) {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  const results: Array<{ email: string; success: boolean; action: string; error?: string }> = []
  
  for (const userData of TEST_USERS) {
    try {
      // Buscar si el usuario ya existe
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === userData.email)
      
      let userId: string
      
      if (existingUser) {
        // Actualizar contrasena del usuario existente
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: userData.password,
          email_confirm: true,
          user_metadata: { 
            full_name: userData.full_name,
            role: userData.role
          }
        })
        
        if (updateError) {
          results.push({ email: userData.email, success: false, action: 'update_auth', error: updateError.message })
          continue
        }
        
        userId = existingUser.id
        results.push({ email: userData.email, success: true, action: 'updated_auth' })
      } else {
        // Crear nuevo usuario
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { 
            full_name: userData.full_name,
            role: userData.role
          }
        })
        
        if (createError || !newUser.user) {
          results.push({ email: userData.email, success: false, action: 'create_auth', error: createError?.message })
          continue
        }
        
        userId = newUser.user.id
        results.push({ email: userData.email, success: true, action: 'created_auth' })
      }
      
      // Crear o actualizar perfil - solo campos basicos que existen en la tabla profiles
      const profileData: Record<string, unknown> = {
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone || null,
        role: userData.role
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
      
      if (profileError) {
        results.push({ email: userData.email, success: false, action: 'profile', error: profileError.message })
        continue
      }
      
      // Para abogados, crear lawyer_profile
      if (userData.role === 'lawyer' || userData.role === 'guestlawyer') {
        const lawyerData = {
          user_id: userId,
          display_name: userData.full_name,
          status: userData.role === 'lawyer' ? 'verified' : 'submitted',
          is_active: userData.role === 'lawyer',
          bio: userData.role === 'lawyer' 
            ? 'Abogada especialista en derecho laboral con 8 años de experiencia.'
            : null,
          verified_at: userData.role === 'lawyer' ? new Date().toISOString() : null
        }
        
        const { error: lawyerError } = await supabase
          .from('lawyer_profiles')
          .upsert(lawyerData, { onConflict: 'user_id' })
        
        if (lawyerError) {
          results.push({ email: userData.email, success: false, action: 'lawyer_profile', error: lawyerError.message })
        } else {
          results.push({ email: userData.email, success: true, action: 'lawyer_profile_created' })
        }
      }
      
    } catch (error) {
      results.push({ 
        email: userData.email, 
        success: false, 
        action: 'unknown', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
  
  return NextResponse.json({ 
    message: 'Test users initialization complete',
    results 
  })
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint to initialize test users',
    users: TEST_USERS.map(u => ({ email: u.email, role: u.role })),
    password: 'Cancun2026'
  })
}
