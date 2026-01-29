"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

// ===========================================
// OPCION 1: PUNO REVOLUCIONARIO
// La M estilizada como puno alzado con signos de exclamacion como rayos
// ===========================================

// Variante 1A: Puno minimalista con rayos
function LogoPunoMinimalista({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circulo de fondo */}
      <circle cx="24" cy="24" r="23" fill="#18181B" stroke="#27272A" strokeWidth="1"/>
      
      {/* Puno estilizado como M */}
      <g transform="translate(10, 12)">
        {/* La M como puno - dedos hacia arriba */}
        <path 
          d="M4 24 L4 14 L8 8 L8 14 L12 6 L12 14 L16 8 L16 14 L20 6 L20 14 L24 8 L24 24 Z" 
          fill="#DC2626" 
          stroke="#DC2626"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Pulgar */}
        <path 
          d="M4 18 L2 16 L2 20 L4 22" 
          fill="#DC2626" 
          stroke="#DC2626"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Rayos de energia (!) izquierdo */}
      <path d="M8 10 L6 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="6" cy="4" r="1.5" fill="#DC2626"/>
      
      {/* Rayos de energia (!) derecho */}
      <path d="M40 10 L42 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="42" cy="4" r="1.5" fill="#DC2626"/>
    </svg>
  )
}

// Variante 1B: M con aspecto de puno mas abstracto
function LogoPunoAbstracto({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo circular */}
      <circle cx="24" cy="24" r="23" fill="#18181B"/>
      
      {/* M estilizada con puntas como dedos alzados */}
      <path 
        d="M10 34 L10 20 L14 12 L18 22 L24 10 L30 22 L34 12 L38 20 L38 34" 
        stroke="#DC2626" 
        strokeWidth="3.5" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Rayo izquierdo */}
      <path d="M7 16 L5 10" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="5" cy="8" r="1.5" fill="#FCA5A5"/>
      
      {/* Rayo derecho */}
      <path d="M41 16 L43 10" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="43" cy="8" r="1.5" fill="#FCA5A5"/>
    </svg>
  )
}

// Variante 1C: Puno solido con M integrada
function LogoPunoSolido({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo */}
      <circle cx="24" cy="24" r="23" fill="#DC2626"/>
      
      {/* Puno/M en blanco */}
      <g transform="translate(8, 10)">
        {/* Forma de M que parece puno alzado */}
        <path 
          d="M2 28 L2 16 C2 14 3 12 5 12 L5 8 C5 6 6 5 8 5 L8 12 L10 6 C10 4 12 4 14 4 L16 4 C18 4 20 4 20 6 L22 12 L22 5 C24 5 25 6 25 8 L25 12 C27 12 28 14 28 16 L28 28 Z" 
          fill="white"
        />
      </g>
      
      {/* Signos de exclamacion como acentos */}
      <rect x="5" y="8" width="2" height="8" rx="1" fill="white"/>
      <circle cx="6" cy="19" r="1.5" fill="white"/>
      
      <rect x="41" y="8" width="2" height="8" rx="1" fill="white"/>
      <circle cx="42" cy="19" r="1.5" fill="white"/>
    </svg>
  )
}

// ===========================================
// OPCION 4: BALANZA CON M
// Balanza de justicia integrada con la M
// ===========================================

// Variante 4A: Balanza minimalista con M
function LogoBalanzaMinimalista({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo */}
      <circle cx="24" cy="24" r="23" fill="#18181B" stroke="#27272A" strokeWidth="1"/>
      
      {/* Poste central de la balanza (forma la parte central de la M) */}
      <line x1="24" y1="8" x2="24" y2="38" stroke="#DC2626" strokeWidth="2.5"/>
      
      {/* Brazos de la balanza (forman la V de la M) */}
      <line x1="24" y1="14" x2="10" y2="22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="14" x2="38" y2="22" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Platillos como ! */}
      {/* Platillo izquierdo */}
      <path d="M6 24 L14 24 L12 30 L8 30 Z" fill="#DC2626"/>
      <circle cx="10" cy="33" r="1.5" fill="#DC2626"/>
      
      {/* Platillo derecho */}
      <path d="M34 24 L42 24 L40 30 L36 30 Z" fill="#DC2626"/>
      <circle cx="38" cy="33" r="1.5" fill="#DC2626"/>
      
      {/* Base */}
      <path d="M18 38 L30 38 L28 40 L20 40 Z" fill="#DC2626"/>
    </svg>
  )
}

// Variante 4B: M con balanza sutil
function LogoMBalanzaSutil({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo */}
      <circle cx="24" cy="24" r="23" fill="#18181B"/>
      
      {/* M principal */}
      <path 
        d="M8 36 L8 14 L16 26 L24 12 L32 26 L40 14 L40 36" 
        stroke="#DC2626" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Platillos pequenos en las puntas superiores */}
      <circle cx="8" cy="12" r="3" fill="#DC2626" fillOpacity="0.3" stroke="#DC2626" strokeWidth="1.5"/>
      <circle cx="40" cy="12" r="3" fill="#DC2626" fillOpacity="0.3" stroke="#DC2626" strokeWidth="1.5"/>
      
      {/* Punto de equilibrio en el centro */}
      <circle cx="24" cy="12" r="2" fill="#DC2626"/>
    </svg>
  )
}

// Variante 4C: Escudo con balanza y M
function LogoEscudoBalanza({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Escudo de fondo */}
      <path 
        d="M24 4 L42 10 L42 26 C42 34 34 42 24 46 C14 42 6 34 6 26 L6 10 Z" 
        fill="#18181B" 
        stroke="#DC2626" 
        strokeWidth="2"
      />
      
      {/* M con balanza integrada */}
      <g transform="translate(10, 12)">
        {/* Poste central */}
        <line x1="14" y1="4" x2="14" y2="24" stroke="#DC2626" strokeWidth="2"/>
        
        {/* Brazos */}
        <line x1="14" y1="8" x2="4" y2="14" stroke="#DC2626" strokeWidth="2"/>
        <line x1="14" y1="8" x2="24" y2="14" stroke="#DC2626" strokeWidth="2"/>
        
        {/* Piernas de la M */}
        <line x1="4" y1="14" x2="4" y2="24" stroke="#DC2626" strokeWidth="2"/>
        <line x1="24" y1="14" x2="24" y2="24" stroke="#DC2626" strokeWidth="2"/>
        
        {/* Platillos */}
        <ellipse cx="4" cy="16" rx="3" ry="1.5" fill="#DC2626" fillOpacity="0.5"/>
        <ellipse cx="24" cy="16" rx="3" ry="1.5" fill="#DC2626" fillOpacity="0.5"/>
      </g>
    </svg>
  )
}

// Variante 4D: Balanza moderna geometrica
function LogoBalanzaModerna({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo cuadrado redondeado */}
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#18181B"/>
      
      {/* M geometrica */}
      <path 
        d="M10 36 L10 16 L24 28 L38 16 L38 36" 
        stroke="#DC2626" 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Triangulo de equilibrio arriba */}
      <path d="M24 8 L28 14 L20 14 Z" fill="#DC2626"/>
      
      {/* Linea de la balanza */}
      <line x1="10" y1="14" x2="38" y2="14" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Puntos de los platillos */}
      <circle cx="10" cy="14" r="2.5" fill="#DC2626"/>
      <circle cx="38" cy="14" r="2.5" fill="#DC2626"/>
    </svg>
  )
}

// ===========================================
// COMPONENTE PRINCIPAL DE PREVIEW
// ===========================================

export function LogoOptionsPreview() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const options = [
    {
      id: "1a",
      name: "Puno Minimalista",
      description: "M estilizada como puno alzado con dedos hacia arriba. Los signos de exclamacion son rayos de energia.",
      category: "Opcion 1: Puno Revolucionario",
      component: LogoPunoMinimalista,
      pros: ["Muy distintivo", "Mensaje claro de lucha", "Memorable"],
      cons: ["Puede parecer agresivo", "Menos profesional"]
    },
    {
      id: "1b", 
      name: "Puno Abstracto",
      description: "M con puntas que sugieren dedos alzados. Mas sutil, mantiene legibilidad de la letra.",
      category: "Opcion 1: Puno Revolucionario",
      component: LogoPunoAbstracto,
      pros: ["Balance entre mensaje y legibilidad", "Moderno", "Versatil"],
      cons: ["El puno es menos obvio"]
    },
    {
      id: "1c",
      name: "Puno Solido",
      description: "Puno claramente definido con M integrada. Fondo rojo impactante.",
      category: "Opcion 1: Puno Revolucionario", 
      component: LogoPunoSolido,
      pros: ["Muy impactante", "Identidad fuerte", "Reconocible"],
      cons: ["Muy politico", "Puede alienar algunos usuarios"]
    },
    {
      id: "4a",
      name: "Balanza Minimalista",
      description: "Balanza de justicia donde el poste es la M y los platillos son signos de exclamacion.",
      category: "Opcion 4: Balanza con M",
      component: LogoBalanzaMinimalista,
      pros: ["Muy juridico", "Profesional", "Simbolismo claro"],
      cons: ["Menos unico", "Puede parecer generico"]
    },
    {
      id: "4b",
      name: "M con Balanza Sutil",
      description: "M prominente con pequenos platillos en las puntas. Equilibrio visual.",
      category: "Opcion 4: Balanza con M",
      component: LogoMBalanzaSutil,
      pros: ["M muy legible", "Elegante", "Profesional pero moderno"],
      cons: ["Balanza poco visible a tamanos pequenos"]
    },
    {
      id: "4c",
      name: "Escudo Balanza",
      description: "M con balanza dentro de un escudo protector. Transmite seguridad y justicia.",
      category: "Opcion 4: Balanza con M",
      component: LogoEscudoBalanza,
      pros: ["Transmite proteccion", "Muy profesional", "Unico"],
      cons: ["Mas complejo", "Puede perder detalle en tamanos pequenos"]
    },
    {
      id: "4d",
      name: "Balanza Moderna",
      description: "Diseno geometrico con M y balanza integradas. Muy limpio y contemporaneo.",
      category: "Opcion 4: Balanza con M",
      component: LogoBalanzaModerna,
      pros: ["Muy moderno", "Limpio", "Funciona en todos los tamanos"],
      cons: ["Menos emotivo"]
    }
  ]

  const option1 = options.filter(o => o.category.includes("Opcion 1"))
  const option4 = options.filter(o => o.category.includes("Opcion 4"))

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Opciones de Logo - mecorrieron.mx</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explora las variantes de las opciones 1 (Puno Revolucionario) y 4 (Balanza con M). 
            Haz clic en cualquier opcion para seleccionarla.
          </p>
        </div>

        {/* Opcion 1: Puno Revolucionario */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-semibold">Opcion 1: Puno Revolucionario</h2>
          </div>
          <p className="text-muted-foreground">
            La M estilizada como un puno alzado simboliza la lucha por los derechos laborales. 
            Los signos de exclamacion se transforman en rayos de energia o impacto.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {option1.map((option) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedOption === option.id ? 'ring-2 ring-red-600' : ''
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    {selectedOption === option.id && (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo preview en diferentes tamanos */}
                  <div className="flex items-center justify-center gap-4 py-6 bg-muted/50 rounded-lg">
                    <option.component size={64} />
                    <option.component size={40} />
                    <option.component size={24} />
                  </div>
                  
                  {/* Preview en header mockup */}
                  <div className="bg-zinc-900 rounded-lg p-3 flex items-center gap-3">
                    <option.component size={32} />
                    <span className="text-white font-semibold text-sm">mecorrieron.mx</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {option.pros.map((pro, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                          + {pro}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {option.cons.map((con, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-200">
                          - {con}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Opcion 4: Balanza con M */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-semibold">Opcion 4: Balanza con M</h2>
          </div>
          <p className="text-muted-foreground">
            La balanza de justicia se integra con la M, representando equilibrio y derechos laborales. 
            Mas profesional y juridico, ideal para transmitir confianza.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {option4.map((option) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedOption === option.id ? 'ring-2 ring-red-600' : ''
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{option.name}</CardTitle>
                    {selectedOption === option.id && (
                      <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Logo preview */}
                  <div className="flex items-center justify-center gap-3 py-4 bg-muted/50 rounded-lg">
                    <option.component size={56} />
                    <option.component size={32} />
                  </div>
                  
                  {/* Preview en header mockup */}
                  <div className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2">
                    <option.component size={28} />
                    <span className="text-white font-semibold text-xs">mecorrieron.mx</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {option.pros.slice(0, 2).map((pro, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200">
                          + {pro}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparacion lado a lado */}
        {selectedOption && (
          <section className="space-y-6 pt-8 border-t">
            <h2 className="text-2xl font-semibold text-center">Tu seleccion actual</h2>
            <div className="flex justify-center">
              {options.filter(o => o.id === selectedOption).map(option => (
                <Card key={option.id} className="max-w-md">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-center gap-6">
                      <option.component size={80} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{option.name}</h3>
                      <p className="text-sm text-muted-foreground">{option.category}</p>
                    </div>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Usar este logo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default LogoOptionsPreview
