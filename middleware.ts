import { NextResponse, type NextRequest } from 'next/server'

// Middleware simplificado - sin llamadas a Supabase para carga rapida
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
