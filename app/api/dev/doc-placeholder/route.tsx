import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'ine'
  const name = searchParams.get('name') || 'Nombre Completo'
  const curp = searchParams.get('curp') || 'XXXX000000XXXXXX00'
  const cedula = searchParams.get('cedula') || '00000000'
  const rfc = searchParams.get('rfc') || 'XXXX000000XXX'
  const universidad = searchParams.get('universidad') || 'Universidad'
  const genero = searchParams.get('genero') || 'M'

  // Colores basados en el tipo de documento
  const colors: Record<string, { bg: string; accent: string; text: string }> = {
    ine: { bg: '#f0f5e8', accent: '#006847', text: '#1a1a1a' },
    cedula: { bg: '#fff8e7', accent: '#8B4513', text: '#1a1a1a' },
    titulo: { bg: '#f5f0ff', accent: '#4B0082', text: '#1a1a1a' },
    constancia: { bg: '#e8f4f8', accent: '#1a5276', text: '#1a1a1a' },
    foto: { bg: '#f0f0f0', accent: '#333333', text: '#1a1a1a' }
  }

  const color = colors[type] || colors.ine

  if (type === 'foto') {
    // Foto de perfil simulada
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.bg,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              backgroundColor: color.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 72,
              fontWeight: 'bold',
            }}
          >
            {genero === 'F' ? 'F' : 'M'}
          </div>
        </div>
      ),
      { width: 200, height: 200 }
    )
  }

  // Documentos rectangulares
  const titles: Record<string, string> = {
    ine: 'INSTITUTO NACIONAL ELECTORAL',
    cedula: 'CEDULA PROFESIONAL',
    titulo: 'TITULO PROFESIONAL',
    constancia: 'CONSTANCIA DE SITUACION FISCAL'
  }

  const subtitles: Record<string, string> = {
    ine: 'CREDENCIAL PARA VOTAR',
    cedula: 'SECRETARIA DE EDUCACION PUBLICA',
    titulo: universidad.toUpperCase(),
    constancia: 'SERVICIO DE ADMINISTRACION TRIBUTARIA'
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: color.bg,
          padding: 30,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: `3px solid ${color.accent}`,
            paddingBottom: 15,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold', color: color.accent, letterSpacing: 2 }}>
            {titles[type]}
          </div>
          <div style={{ fontSize: 12, color: color.text, marginTop: 5 }}>
            {subtitles[type]}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#666', width: 80 }}>NOMBRE:</span>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: color.text }}>{name.toUpperCase()}</span>
          </div>
          
          {type === 'ine' && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>CURP:</span>
                <span style={{ fontSize: 12, color: color.text }}>{curp}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>CLAVE:</span>
                <span style={{ fontSize: 12, color: color.text }}>{Math.floor(Math.random() * 900000000 + 100000000)}</span>
              </div>
            </>
          )}
          
          {type === 'cedula' && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>CEDULA:</span>
                <span style={{ fontSize: 12, color: color.text }}>{cedula}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>CARRERA:</span>
                <span style={{ fontSize: 12, color: color.text }}>LICENCIATURA EN DERECHO</span>
              </div>
            </>
          )}
          
          {type === 'titulo' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: color.text, textAlign: 'center', width: '100%' }}>
                  LICENCIADO EN DERECHO
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 20 }}>
                Expedido el {new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}
              </div>
            </>
          )}
          
          {type === 'constancia' && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>RFC:</span>
                <span style={{ fontSize: 12, color: color.text }}>{rfc}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#666', width: 80 }}>REGIMEN:</span>
                <span style={{ fontSize: 11, color: color.text }}>ACTIVIDADES PROFESIONALES</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `2px solid ${color.accent}`,
            paddingTop: 10,
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 8, color: '#999' }}>DOCUMENTO DE SIMULACION</span>
          <span style={{ fontSize: 8, color: '#999' }}>NO VALIDO</span>
        </div>
      </div>
    ),
    { width: 400, height: 250 }
  )
}
