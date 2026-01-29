import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/ccl/agent/status/[jobId]
 * Obtiene el estado actual de un job del agente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener el job
    const { data: job, error: jobError } = await supabase
      .from('ccl_agent_jobs')
      .select(`
        *,
        caso:casos(id, folio, empresa_nombre)
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (job.abogado_id !== user.id) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'No tienes permisos para ver este job' },
          { status: 403 }
        )
      }
    }

    // Obtener logs recientes
    const { data: logs } = await supabase
      .from('ccl_agent_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      job: {
        id: job.id,
        casoId: job.caso_id,
        caso: job.caso,
        status: job.status,
        currentStep: job.current_step,
        progress: job.progress,
        error: job.error,
        resultado: job.resultado,
        metadata: job.metadata,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        createdAt: job.created_at
      },
      logs: logs?.reverse() || []
    })

  } catch (error) {
    console.error('Error obteniendo estado del job:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ccl/agent/status/[jobId]
 * Cancela un job en ejecución
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el job existe y pertenece al usuario
    const { data: job } = await supabase
      .from('ccl_agent_jobs')
      .select('id, abogado_id, status')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json(
        { error: 'Job no encontrado' },
        { status: 404 }
      )
    }

    if (job.abogado_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar este job' },
        { status: 403 }
      )
    }

    if (!['pending', 'running'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Este job ya no puede ser cancelado' },
        { status: 400 }
      )
    }

    // Cancelar el job
    await supabase
      .from('ccl_agent_jobs')
      .update({
        status: 'cancelled',
        current_step: 'cancelado_por_usuario',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Agregar log
    await supabase
      .from('ccl_agent_logs')
      .insert({
        job_id: jobId,
        level: 'warning',
        message: 'Job cancelado por el usuario'
      })

    return NextResponse.json({
      success: true,
      message: 'Job cancelado'
    })

  } catch (error) {
    console.error('Error cancelando job:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
