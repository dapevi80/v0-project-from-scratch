/**
 * Helper para manejo seguro de variables de entorno
 * No rompe el build si faltan variables - muestra UI de configuracion faltante
 */

type EnvConfig = {
  key: string
  required: boolean
  fallback?: string
}

const ENV_VARS: EnvConfig[] = [
  // Publicas (disponibles en cliente)
  { key: 'NEXT_PUBLIC_APP_ENV', required: false, fallback: 'development' },
  { key: 'NEXT_PUBLIC_APP_NAME', required: false, fallback: 'mecorrieron' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true },
  
  // Privadas (solo servidor)
  { key: 'SUPABASE_SERVICE_ROLE_KEY', required: false },
  { key: 'GOOGLE_MAPS_API_KEY', required: false },
]

/**
 * Obtiene una variable de entorno con fallback opcional
 * NO lanza error si falta - retorna undefined o fallback
 */
export function getEnv(key: string, fallback?: string): string | undefined {
  const value = process.env[key]
  return value || fallback
}

/**
 * Verifica si una variable de entorno esta configurada
 */
export function hasEnv(key: string): boolean {
  return Boolean(process.env[key])
}

/**
 * Obtiene el estado de todas las variables de entorno requeridas
 * Util para mostrar UI de "Configuracion faltante"
 */
export function getEnvStatus(): { 
  isConfigured: boolean
  missing: string[]
  configured: string[] 
} {
  const missing: string[] = []
  const configured: string[] = []
  
  for (const env of ENV_VARS) {
    if (env.required) {
      if (hasEnv(env.key)) {
        configured.push(env.key)
      } else {
        missing.push(env.key)
      }
    }
  }
  
  return {
    isConfigured: missing.length === 0,
    missing,
    configured
  }
}

/**
 * Helper para verificar configuracion en el servidor
 * Retorna true si todas las variables requeridas estan configuradas
 */
export function isServerConfigured(): boolean {
  const requiredServerVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  return requiredServerVars.every(key => hasEnv(key))
}

/**
 * Obtiene la URL base de la aplicacion
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // En servidor, usar variable de entorno o fallback
  return process.env.NEXT_PUBLIC_APP_URL || 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
         'http://localhost:3000'
}

/**
 * Obtiene el entorno actual
 */
export function getAppEnv(): 'development' | 'staging' | 'production' {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'development'
  if (env === 'prod' || env === 'production') return 'production'
  if (env === 'staging' || env === 'stage') return 'staging'
  return 'development'
}

/**
 * Verifica si estamos en produccion
 */
export function isProduction(): boolean {
  return getAppEnv() === 'production'
}
