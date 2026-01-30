import { NextResponse, type NextRequest } from 'next/server'

// Middleware simplificado - sin llamadas a Supabase para carga rapida
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname === '/diseños' || pathname === '/dise%C3%B1os') {
    const url = request.nextUrl.clone()
    url.pathname = '/disenos'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/diseños', '/dise%C3%B1os'],
}
