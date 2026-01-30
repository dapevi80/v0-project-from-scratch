'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redimirCuponIA } from '@/lib/ai/credits-system'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const codigo = (body.codigo as string | undefined)?.trim()

  if (!codigo) {
    return NextResponse.json({ ok: false, error: 'Codigo requerido' }, { status: 400 })
  }

  const result = await redimirCuponIA(user.id, codigo)

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, wallet: result.wallet })
}
