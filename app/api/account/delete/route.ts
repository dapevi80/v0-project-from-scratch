import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  if (!supabase || !admin) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const confirm = Boolean(body?.confirm)

  if (!confirm) {
    return NextResponse.json({ error: 'Confirmación requerida' }, { status: 400 })
  }

  const { data: documentos } = await admin
    .from('documentos_boveda')
    .select('archivo_path')
    .eq('user_id', user.id)

  const paths = (documentos || [])
    .map((doc) => doc.archivo_path)
    .filter(Boolean)

  if (paths.length > 0) {
    await admin.storage.from('boveda').remove(paths)
  }

  await admin.from('documentos_boveda').delete().eq('user_id', user.id)
  await admin.from('boveda').delete().eq('user_id', user.id)
  await admin.from('calculos_liquidacion').delete().eq('user_id', user.id)
  await admin.from('ccl_user_accounts').delete().eq('user_id', user.id)
  await admin.from('sinacol_authorizations').delete().eq('user_id', user.id)
  await admin.from('notificaciones_email').delete().eq('destinatario', user.email || '')
  await admin.from('casos').delete().or(`user_id.eq.${user.id},abogado_id.eq.${user.id}`)
  await admin.from('lawyer_profiles').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}
