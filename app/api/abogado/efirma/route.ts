'use server'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const cerFile = formData.get('cer') as File | null
    const keyFile = formData.get('key') as File | null
    const password = formData.get('password') as string | null
    
    if (!cerFile || !keyFile || !password) {
      return NextResponse.json({ error: 'Faltan archivos o contraseña' }, { status: 400 })
    }
    
    // Validar extensiones
    if (!cerFile.name.endsWith('.cer')) {
      return NextResponse.json({ error: 'El archivo de certificado debe ser .cer' }, { status: 400 })
    }
    if (!keyFile.name.endsWith('.key')) {
      return NextResponse.json({ error: 'El archivo de llave debe ser .key' }, { status: 400 })
    }
    
    // Subir archivo .cer
    const cerBuffer = await cerFile.arrayBuffer()
    const { error: cerError } = await supabase.storage
      .from('private-documents')
      .upload(`${user.id}/efirma/certificado.cer`, cerBuffer, {
        contentType: 'application/x-x509-ca-cert',
        upsert: true
      })
    
    if (cerError) {
      console.error('Error uploading .cer:', cerError)
      return NextResponse.json({ error: 'Error al subir certificado' }, { status: 500 })
    }
    
    // Subir archivo .key
    const keyBuffer = await keyFile.arrayBuffer()
    const { error: keyError } = await supabase.storage
      .from('private-documents')
      .upload(`${user.id}/efirma/llave.key`, keyBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      })
    
    if (keyError) {
      console.error('Error uploading .key:', keyError)
      return NextResponse.json({ error: 'Error al subir llave privada' }, { status: 500 })
    }
    
    // Guardar configuración en la base de datos (contraseña encriptada)
    // NOTA: En producción debes encriptar la contraseña antes de guardarla
    const { error: dbError } = await supabase
      .from('lawyer_efirma')
      .upsert({
        lawyer_id: user.id,
        cer_path: `${user.id}/efirma/certificado.cer`,
        key_path: `${user.id}/efirma/llave.key`,
        password_hash: password, // TODO: Encriptar en producción
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'lawyer_id'
      })
    
    if (dbError) {
      console.error('Error saving efirma config:', dbError)
      return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'e.firma configurada correctamente' 
    })
    
  } catch (error) {
    console.error('Error processing efirma upload:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  try {
    // Eliminar archivos
    await supabase.storage
      .from('private-documents')
      .remove([
        `${user.id}/efirma/certificado.cer`,
        `${user.id}/efirma/llave.key`
      ])
    
    // Eliminar registro de BD
    await supabase
      .from('lawyer_efirma')
      .delete()
      .eq('lawyer_id', user.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing efirma:', error)
    return NextResponse.json({ error: 'Error al eliminar configuración' }, { status: 500 })
  }
}
