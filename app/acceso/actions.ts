'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Generar codigo de usuario unico
function generarCodigoUsuario() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let codigo = 'MC-'
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return codigo
}

// Registro rapido de usuario guest (solo nombre, email temporal generado)
export async function registrarUsuarioGuest(datos: {
  nombre: string
  codigoReferido?: string
}) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return { error: 'Configuracion de autenticacion incompleta.', data: null }
    }
    
    // Validacion minima - solo nombre
    if (!datos.nombre.trim()) {
      return { error: 'Por favor ingresa tu nombre', data: null }
    }
    
    const codigoUsuario = generarCodigoUsuario()
    const timestamp = Date.now()
    
    // Generar email temporal y contrasena automatica
    const guestId = `${codigoUsuario.toLowerCase().replace('-', '')}_${timestamp}`
    const tempEmail = `${guestId}@guest.mecorrieron.mx`
    const tempPassword = `Guest${timestamp.toString(36)}${Math.random().toString(36).slice(2, 10)}!`
    
    // Intentar con admin client primero (crea usuario ya confirmado)
    const adminClient = createAdminClient()

    const upsertGuestProfile = async (userId: string) => {
      const profileData = {
        id: userId,
        email: tempEmail,
        full_name: datos.nombre.trim(),
        role: 'guestworker',
        verification_status: 'pending',
        codigo_usuario: codigoUsuario,
        is_profile_public: true
      }

      if (adminClient) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })

        if (profileError) {
          return { error: profileError.message }
        }
        return { error: null }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })

      if (profileError) {
        return { error: profileError.message }
      }

      return { error: null }
    }
    
    if (adminClient) {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: datos.nombre.trim(),
          referred_by: datos.codigoReferido || null,
          user_code: codigoUsuario,
          is_guest: true
        }
      })
      
        if (!authError && authData.user) {
          const profileResult = await upsertGuestProfile(authData.user.id)
          if (profileResult.error) {
            return { error: profileResult.error, data: null }
          }

          // Registrar en arbol de referidos si tiene codigo
          if (datos.codigoReferido) {
            await adminClient
              .rpc('registrar_referido', { 
                p_nuevo_user_id: authData.user.id, 
                p_codigo_referido: datos.codigoReferido 
              })
          }
          
          // Login con el cliente normal para establecer la sesion
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: tempPassword
          })
          
          if (!signInError) {
            revalidatePath('/dashboard')
            return { 
              error: null, 
              data: { 
                success: true, 
                codigoUsuario, 
                redirectTo: '/dashboard',
                // Devolver credenciales para guardar en localStorage
                guestCredentials: {
                  email: tempEmail,
                  password: tempPassword,
                  nombre: datos.nombre.trim(),
                  codigoUsuario
                }
              } 
            }
          }
        }
      }
    
    // Fallback: usar signUp normal (requiere trigger de auto-confirmacion)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
      options: {
        data: {
          full_name: datos.nombre.trim(),
          referred_by: datos.codigoReferido || null,
          user_code: codigoUsuario,
          is_guest: true
        }
      }
    })
    
    if (signUpError) {
      return { error: signUpError.message, data: null }
    }
    
    // Si el signup devuelve sesion directamente, excelente
    if (signUpData.session && signUpData.user) {
      const profileResult = await upsertGuestProfile(signUpData.user.id)
      if (profileResult.error) {
        return { error: profileResult.error, data: null }
      }

      // Registrar en arbol de referidos si tiene codigo
      if (datos.codigoReferido) {
        await supabase
          .rpc('registrar_referido', { 
            p_nuevo_user_id: signUpData.user.id, 
            p_codigo_referido: datos.codigoReferido 
          })
      }
      
      revalidatePath('/dashboard')
      return { 
        error: null, 
        data: { 
          success: true, 
          codigoUsuario, 
          redirectTo: '/dashboard',
          guestCredentials: {
            email: tempEmail,
            password: tempPassword,
            nombre: datos.nombre.trim(),
            codigoUsuario
          }
        } 
      }
    }
    
    // Esperar un momento e intentar login
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword
    })
    
    if (loginError) {
      return { error: 'Cuenta creada. Por favor espera unos segundos e intenta de nuevo.', data: null }
    }
    
    if (signUpData.user) {
      const profileResult = await upsertGuestProfile(signUpData.user.id)
      if (profileResult.error) {
        return { error: profileResult.error, data: null }
      }
    }

    revalidatePath('/dashboard')
    return { 
      error: null, 
      data: { 
        success: true, 
        codigoUsuario, 
        redirectTo: '/dashboard',
        guestCredentials: {
          email: tempEmail,
          password: tempPassword,
          nombre: datos.nombre.trim(),
          codigoUsuario
        }
      } 
    }
  } catch (error) {
    return { error: 'Ha ocurrido un error. Intenta de nuevo.', data: null }
  }
}

// Resetear contraseñas de usuarios de prueba (solo desarrollo)
export async function resetTestUserPasswords() {
  const adminClient = createAdminClient()
  
  if (!adminClient) {
    return { error: 'Admin client not available', data: null }
  }
  
  const testUsers = [
    { email: 'admin123@mecorrieron.mx', password: 'Admin123!' },
    { email: 'guest123@mecorrieron.mx', password: 'Guest123!' },
    { email: 'abogado123@mecorrieron.mx', password: 'Abogado123!' },
    { email: 'superadmin123@mecorrieron.mx', password: 'Superadmin123!' },
    { email: 'trabajador123@mecorrieron.mx', password: 'Trabajador123!' },
  ]
  
  const results = []
  
  for (const user of testUsers) {
    // Buscar usuario por email
    const { data: users } = await adminClient.auth.admin.listUsers()
    const existingUser = users?.users?.find(u => u.email === user.email)
    
    if (existingUser) {
      const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: user.password
      })
      results.push({ email: user.email, success: !error, error: error?.message })
    } else {
      results.push({ email: user.email, success: false, error: 'User not found' })
    }
  }
  
  return { error: null, data: results }
}

// Login de usuario
export async function loginUsuario(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })
    
    if (error) {
      if (error.message.includes('Invalid login')) {
        return { error: 'Correo o contrasena incorrectos' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Por favor confirma tu correo electronico' }
      }
      return { error: error.message }
    }
    
    revalidatePath('/dashboard')
    return { error: null, redirectTo: '/dashboard' }
  } catch {
    return { error: 'Error de conexion. Por favor intenta de nuevo.' }
  }
}
