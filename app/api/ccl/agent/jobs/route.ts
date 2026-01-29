import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/ccl/agent/jobs
 * Lista los jobs del agente del usuario actual
 */
export async function GET(request: NextRequest) {
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

    // Parámetros de query
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // pending, running, completed, failed, cancelled
    const casoId = searchParams.get('casoId')

    // Construir query
    let query = supabase
      .from('ccl_agent_jobs')
      .select(`
        id,
        caso_id,
        status,
        current_step,
        progress,
        error,
        created_at,
        started_at,
        completed_at,
        caso:casos(id, folio, empresa_nombre)
      `)
      .eq('abogado_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (casoId) {
      query = query.eq('caso_id', casoId)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error listando jobs:', error)
      return NextResponse.json(
        { error: 'Error obteniendo jobs' },
        { status: 500 }
      )
    }

    // Contar totales por status
    const { data: counts } = await supabase
      .from('ccl_agent_jobs')
      .select('status')
      .eq('abogado_id', user.id)

    const statusCounts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total: counts?.length || 0
    }

    counts?.forEach(job => {
      if (job.status in statusCounts) {
        statusCounts[job.status as keyof typeof statusCounts]++
      }
    })

    return NextResponse.json({
      jobs: jobs || [],
      counts: statusCounts
    })

  } catch (error) {
    console.error('Error en API de jobs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
