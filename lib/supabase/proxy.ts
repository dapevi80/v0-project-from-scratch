import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check for API routes and static assets
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Envolver todo en try-catch para manejar cualquier error de red
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return supabaseResponse
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    // Use getSession instead of getUser for faster response in middleware
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Rutas que requieren autenticación estricta
    const strictProtectedPaths = ['/admin', '/pagos']
    const isStrictProtected = strictProtectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
    
    if (isStrictProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/acceso'
      return NextResponse.redirect(url)
    }
    
    if (request.nextUrl.pathname === '/acceso' && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch {
    // Cualquier error (red, config, etc.) - continuar sin autenticación
    // Las páginas manejan el modo invitado
  }

  return supabaseResponse
}
