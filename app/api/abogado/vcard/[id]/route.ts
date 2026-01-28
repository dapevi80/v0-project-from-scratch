'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  // Obtener datos del abogado
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!profile) {
    return NextResponse.json({ error: 'Abogado no encontrado' }, { status: 404 })
  }
  
  const { data: lawyerProfile } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  // Generar vCard 3.0
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.full_name}`,
    `N:${profile.full_name.split(' ').slice(1).join(' ')};${profile.full_name.split(' ')[0]};;;`,
    profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : '',
    profile.email ? `EMAIL:${profile.email}` : '',
    lawyerProfile?.cedula_profesional ? `NOTE:Cedula Profesional: ${lawyerProfile.cedula_profesional}` : '',
    `ORG:mecorrieron.mx - Abogado Verificado`,
    `TITLE:Abogado Laboralista`,
    lawyerProfile?.universidad ? `X-UNIVERSITY:${lawyerProfile.universidad}` : '',
    `URL:https://mecorrieron.mx/abogado/${id}`,
    'END:VCARD'
  ].filter(line => line !== '').join('\r\n')
  
  // Retornar como archivo descargable
  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.full_name.replace(/\s+/g, '_')}.vcf"`,
    },
  })
}
