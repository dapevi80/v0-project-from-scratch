import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TEST_USERS, TEST_PASSWORD } from '@/lib/types'

// Cliente admin con service_role key para crear usuarios
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: Request) {
  try {
    // Verificar secret para evitar ejecuciones no autorizadas
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== process.env.SEED_SECRET && secret !== 'mecorrieron2026') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getAdminClient()
    const results: Array<{ email: string; success: boolean; error?: string }> = []

    for (const user of TEST_USERS) {
      try {
        // Crear usuario con Supabase Auth Admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: TEST_PASSWORD,
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            role: user.role,
            full_name: user.full_name
          }
        })

        if (error) {
          // Si el usuario ya existe, intentar actualizar
          if (error.message.includes('already exists') || error.message.includes('already been registered')) {
            results.push({ 
              email: user.email, 
              success: true, 
              error: 'User already exists - skipped' 
            })
          } else {
            results.push({ 
              email: user.email, 
              success: false, 
              error: error.message 
            })
          }
        } else {
          results.push({ 
            email: user.email, 
            success: true 
          })
        }
      } catch (err) {
        results.push({ 
          email: user.email, 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Seed completed: ${successCount} success, ${failCount} failed`,
      results
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with ?secret=mecorrieron2026 to seed test users',
    users: TEST_USERS.map(u => ({ email: u.email, role: u.role }))
  })
}
