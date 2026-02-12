'use client'

import { useMemo, useState } from 'react'
import { BookOpen, Bookmark, Search, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Topic = {
  id: string
  title: string
  description: string
  highlight: string
  index: string[]
}

const TOPICS: Topic[] = [
  {
    id: 'despidos',
    title: 'Despidos',
    description: 'Conceptos clave sobre causas, indemnizaciones y derechos del trabajador.',
    highlight: 'Artículos 47, 48 y 50 LFT',
    index: [
      'Concepto de despido y tipos',
      'Indemnización constitucional (3 meses)',
      'Salarios caídos y reinstalación',
      'Despido injustificado vs. justificado',
      'Documentos probatorios recomendados',
    ],
  },
  {
    id: 'contratos',
    title: 'Contratos Laborales',
    description: 'Tipos de contrato, cláusulas esenciales y obligaciones de las partes.',
    highlight: 'Artículos 20 al 35 LFT',
    index: [
      'Relación laboral vs. prestación de servicios',
      'Contrato individual y colectivo',
      'Duración: por obra, tiempo o capacitación',
      'Cláusulas indispensables',
      'Respaldo documental (recibos y anexos)',
    ],
  },
  {
    id: 'prestaciones',
    title: 'Prestaciones de Ley',
    description: 'Lista de prestaciones mínimas y cómo se calculan.',
    highlight: 'Artículos 76, 80, 87 y 132 LFT',
    index: [
      'Aguinaldo, vacaciones y prima vacacional',
      'Reparto de utilidades (PTU)',
      'Seguridad social y beneficios obligatorios',
      'Jornadas, descansos y horas extra',
      'Checklist de cumplimiento básico',
    ],
  },
  {
    id: 'rescisions',
    title: 'Rescisiones',
    description: 'Causas de rescisión y procedimientos sin responsabilidad.',
    highlight: 'Artículos 46 al 52 LFT',
    index: [
      'Rescisión por parte del patrón',
      'Rescisión por parte del trabajador',
      'Aviso de rescisión y formalidades',
      'Pruebas y documentación necesaria',
      'Efectos legales y finiquitos',
    ],
  },
  {
    id: 'procedimientos',
    title: 'Procedimientos',
    description: 'Ruta práctica para iniciar y dar seguimiento a un proceso laboral.',
    highlight: 'LFT + CCL',
    index: [
      'Preparación del caso',
      'Conciliación previa obligatoria',
      'Etapas del procedimiento laboral',
      'Audiencia preliminar y juicio',
      'Ejecución de laudos',
    ],
  },
  {
    id: 'conciliacion',
    title: 'Reglas de la Conciliación',
    description: 'Guía del proceso ante el Centro de Conciliación Laboral (CCL).',
    highlight: 'Lineamientos CCL y DOF',
    index: [
      'Solicitud y requisitos básicos',
      'Fechas clave y plazos relevantes',
      'Acuerdo conciliatorio y efectos',
      'Consejos para preparar la audiencia',
      'Errores frecuentes a evitar',
    ],
  },
  {
    id: 'acoso',
    title: 'Acoso y Bullying Laboral',
    description: 'Identifica conductas, evidencia y acciones recomendadas.',
    highlight: 'NOM-035 + LFT',
    index: [
      'Definiciones y señales de alerta',
      'Recolección de evidencia',
      'Canales internos y externos',
      'Medidas de protección',
      'Reparación del daño',
    ],
  },
  {
    id: 'jurisprudencias',
    title: 'Jurisprudencias',
    description: 'Criterios relevantes y cambios jurisprudenciales laborales.',
    highlight: 'Suprema Corte + Tribunales',
    index: [
      'Cómo leer una jurisprudencia',
      'Cambios recientes destacados',
      'Jurisprudencias sobre despidos',
      'Criterios sobre prestaciones',
      'Repositorio y estudio temático',
    ],
  },
]

export default function BibliotecaLegalPage() {
  const [selectedTopic, setSelectedTopic] = useState<Topic>(TOPICS[0])
  const [search, setSearch] = useState('')

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return []
    return TOPICS.flatMap(topic =>
      topic.index
        .filter(item => item.toLowerCase().includes(normalized))
        .map(item => ({ topic, item }))
    )
  }, [search])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-amber-200 px-4 py-1 text-sm text-amber-700 shadow-sm">
            <BookOpen className="h-4 w-4" />
            Biblioteca Legal · guía simplificada
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Biblioteca Legal</h1>
          <p className="text-slate-600 max-w-3xl">
            Herramienta gratuita con resúmenes, apuntes y rutas de estudio basadas en la Ley Federal del
            Trabajo (LFT), actualizaciones del Diario Oficial (DOF) y jurisprudencias laborales. Se organiza
            como biblioteca de estudio para consultar temas clave en minutos.
          </p>
        </header>

        <Card className="border-amber-200 bg-white/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Buscador legal</h2>
              <p className="text-sm text-slate-500">Busca palabras clave en todo el índice temático.</p>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej: indemnización, rescisión, audiencia..."
                className="pl-9 bg-white"
              />
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className={`text-left transition-all ${
                selectedTopic.id === topic.id
                  ? 'scale-[1.02] ring-2 ring-amber-300'
                  : 'hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              <Card className="h-full border-dashed border-slate-200 bg-white/90">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900">{topic.title}</CardTitle>
                    <Bookmark className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-500">{topic.highlight}</p>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">{topic.description}</CardContent>
              </Card>
            </button>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Tema activo
                </Badge>
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  Fuente: LFT + DOF
                </Badge>
              </div>
              <CardTitle className="text-2xl text-slate-900">{selectedTopic.title}</CardTitle>
              <p className="text-slate-600">{selectedTopic.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700">
                <p className="font-medium text-amber-800">Apunte rápido</p>
                <p>
                  Este módulo se nutre de la Ley Federal del Trabajo y se actualiza con criterios del Diario
                  Oficial y jurisprudencias vigentes para mantener la información al día.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ScrollText className="h-4 w-4 text-amber-500" />
                  Índice de estudio
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {selectedTopic.index.map(item => (
                    <li key={item} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <span>{item}</span>
                      <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800">
                        Citar
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Actualizaciones recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2">
                  Se sincroniza diariamente con DOF y jurisprudencias. Aquí verás cambios relevantes al
                  iniciar sesión.
                </p>
                <ul className="space-y-2">
                  <li>• Nuevos criterios sobre despido injustificado.</li>
                  <li>• Actualización de lineamientos de conciliación.</li>
                  <li>• Jurisprudencias destacadas sobre prestaciones.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Resultados de búsqueda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {search.trim() ? (
                  <>
                    <p>
                      {searchResults.length} resultado(s) para <span className="font-semibold">"{search}"</span>.
                    </p>
                    <ul className="space-y-2">
                      {searchResults.length === 0 && (
                        <li className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          No encontramos coincidencias. Intenta con otra palabra.
                        </li>
                      )}
                      {searchResults.map(result => (
                        <li key={`${result.topic.id}-${result.item}`} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                          <p className="font-medium text-slate-700">{result.item}</p>
                          <p className="text-xs text-slate-500">{result.topic.title}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    Usa el buscador para localizar artículos o conceptos específicos.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
