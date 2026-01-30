import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  if (!supabase || !admin) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: verification } = await admin
    .from('email_verifications')
    .select('email, verified_at')
    .eq('user_id', user.id)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    verified: Boolean(verification?.verified_at),
    email: verification?.email || null,
    verifiedAt: verification?.verified_at || null
  })
}
