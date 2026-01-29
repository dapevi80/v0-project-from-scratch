import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { iniciarAgenteCCL } from '@/lib/ccl/agent/ccl-agent'

/**
 * POST /api/ccl/agent/run
 * Inicia el agente de IA para generar una solicitud CCL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const { casoId, modalidadPreferida, skipValidacion } = body

    if (!casoId) {
      return NextResponse.json(
        { error: 'Se requiere casoId' },
        { status: 400 }
      )
    }

    // Verificar que el caso existe y pertenece al usuario
    const { data: caso, error: casoError } = await supabase
      .from('casos')
      .select('id, worker_id')
      .eq('id', casoId)
      .single()

    if (casoError || !caso) {
      return NextResponse.json(
        { error: 'Caso no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos (debe ser el abogado asignado o el trabajador)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAbogado = profile?.role === 'abogado'
    const isWorker = caso.worker_id === user.id

    if (!isAbogado && !isWorker) {
      return NextResponse.json(
        { error: 'No tienes permisos para este caso' },
        { status: 403 }
      )
    }

    // Verificar que no hay un job activo para este caso
    const { data: activeJob } = await supabase
      .from('ccl_agent_jobs')
      .select('id, status')
      .eq('caso_id', casoId)
      .in('status', ['pending', 'running'])
      .single()

    if (activeJob) {
      return NextResponse.json(
        { 
          error: 'Ya hay un proceso activo para este caso',
          jobId: activeJob.id,
          status: activeJob.status
        },
        { status: 409 }
      )
    }

    // Iniciar el agente
    const result = await iniciarAgenteCCL(casoId, {
      modalidadPreferida,
      skipValidacion
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: 'Agente iniciado. El proceso continuará en segundo plano.'
    })

  } catch (error) {
    console.error('Error iniciando agente CCL:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
