// Servicio de Proxy Rotativo para AutoCCL
// Evita deteccion por parte de los portales SINACOL
import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface ProxyConfig {
  id: string
  region: string
  estado: string
  provider: string
  endpoint: string
  activo: boolean
  usosHoy: number
  maxUsosDia: number
}

export interface ProxyConnection {
  proxyUrl: string
  region: string
  estado: string
  proxyId: string
}

// Proveedores de proxy soportados
export const PROXY_PROVIDERS = {
  // Proxies residenciales mexicanos (parecen usuarios reales)
  BRIGHT_DATA: 'bright_data',
  OXYLABS: 'oxylabs',
  SMARTPROXY: 'smartproxy',
  
  // Proxies datacenter (mas rapidos pero mas detectables)
  ROTATING_PROXY: 'rotating_proxy',
  
  // VPN con IPs mexicanas
  NORD_VPN: 'nordvpn',
  EXPRESS_VPN: 'expressvpn'
}

// Obtener proxy disponible para una region/estado
export async function obtenerProxyDisponible(
  estado: string
): Promise<{ error: string | null; proxy: ProxyConnection | null }> {
  const supabase = await createClient()
  
  // Buscar proxy activo para el estado con usos disponibles
  const { data: proxies } = await supabase
    .from('proxy_config')
    .select('*')
    .eq('estado', estado)
    .eq('activo', true)
    .lt('usos_hoy', supabase.rpc('get_max_usos')) // usos_hoy < max_usos_dia
    .order('usos_hoy', { ascending: true })
    .limit(1)
  
  // Si no hay proxy para el estado, buscar por region
  if (!proxies || proxies.length === 0) {
    const { data: regionProxies } = await supabase
      .from('proxy_config')
      .select('*')
      .eq('activo', true)
      .order('usos_hoy', { ascending: true })
      .limit(1)
    
    if (!regionProxies || regionProxies.length === 0) {
      return { 
        error: 'No hay proxies disponibles. Intente mas tarde.', 
        proxy: null 
      }
    }
    
    return formatProxyConnection(regionProxies[0])
  }
  
  return formatProxyConnection(proxies[0])
}

// Formatea la conexion del proxy
function formatProxyConnection(proxyData: ProxyConfig): { error: string | null; proxy: ProxyConnection } {
  // En produccion, el endpoint contendria la URL real del proxy
  // Por ahora retornamos la estructura esperada
  
  return {
    error: null,
    proxy: {
      proxyUrl: proxyData.endpoint,
      region: proxyData.region,
      estado: proxyData.estado,
      proxyId: proxyData.id
    }
  }
}

// Registrar uso de proxy
export async function registrarUsoProxy(proxyId: string): Promise<void> {
  const supabase = await createClient()
  
  await supabase.rpc('incrementar_uso_proxy', { proxy_id: proxyId })
  
  // Actualizar ultimo uso
  await supabase
    .from('proxy_config')
    .update({ 
      ultimo_uso: new Date().toISOString(),
      usos_hoy: supabase.rpc('get_usos_hoy', { proxy_id: proxyId })
    })
    .eq('id', proxyId)
}

// Resetear contadores diarios (llamar con cron a medianoche)
export async function resetearContadoresDiarios(): Promise<void> {
  const supabase = await createClient()
  
  await supabase
    .from('proxy_config')
    .update({ usos_hoy: 0 })
    .neq('id', '00000000-0000-0000-0000-000000000000') // Actualizar todos
}

// Configuracion de proxy para Playwright
export function getPlaywrightProxyConfig(proxyConnection: ProxyConnection) {
  // Formato para Playwright browser context
  return {
    proxy: {
      server: proxyConnection.proxyUrl,
      // username y password se obtendrian de las credenciales encriptadas
    }
  }
}

// Estrategias de rotacion
export const ROTATION_STRATEGIES = {
  // Rotar por cada solicitud
  PER_REQUEST: 'per_request',
  
  // Rotar por estado (misma IP para mismo estado)
  PER_STATE: 'per_state',
  
  // Rotar por sesion de usuario
  PER_SESSION: 'per_session',
  
  // Rotacion inteligente basada en deteccion
  SMART: 'smart'
}

// Headers adicionales para parecer navegador real
export function getAntiDetectionHeaders() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ]
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  }
}

// Delays aleatorios para simular comportamiento humano
export function getHumanDelay(): number {
  // Entre 1 y 3 segundos con variacion
  return Math.floor(Math.random() * 2000) + 1000
}

export function getTypingDelay(): number {
  // Entre 50 y 150ms por caracter
  return Math.floor(Math.random() * 100) + 50
}
