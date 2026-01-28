import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminClient = createAdminClient()
  
  if (!adminClient) {
    return NextResponse.json({ error: 'Admin client not available' }, { status: 500 })
  }
  
  const testUsers = [
    { email: 'admin123@mecorrieron.mx', password: 'Admin123!' },
    { email: 'guest123@mecorrieron.mx', password: 'Guest123!' },
    { email: 'abogado123@mecorrieron.mx', password: 'Abogado123!' },
    { email: 'superadmin123@mecorrieron.mx', password: 'Superadmin123!' },
    { email: 'trabajador123@mecorrieron.mx', password: 'Trabajador123!' },
  ]
  
  const results = []
  
  // Obtener lista de usuarios
  const { data: usersData } = await adminClient.auth.admin.listUsers()
  
  for (const testUser of testUsers) {
    const existingUser = usersData?.users?.find(u => u.email === testUser.email)
    
    if (existingUser) {
      const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: testUser.password
      })
      results.push({ 
        email: testUser.email, 
        success: !error, 
        error: error?.message,
        password: testUser.password
      })
    } else {
      results.push({ email: testUser.email, success: false, error: 'User not found' })
    }
  }
  
  return NextResponse.json({ 
    message: 'Passwords reset complete',
    results 
  })
}
