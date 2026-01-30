import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function MecorrieronSkinPreview() {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            !m!
          </div>
          <div>
            <p className="text-sm font-semibold">mecorrieron.mx</p>
            <p className="text-xs text-muted-foreground">Skin oficial</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">Live UI</Badge>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-xs text-muted-foreground uppercase">Hero</p>
          <h3 className="mt-2 text-xl font-semibold">Tu derecho laboral, protegido</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Calcula tu liquidación, guarda evidencia y conecta con abogados verificados.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Comenzar</span>
            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Ver beneficios</span>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground uppercase">Perfil</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-200" />
            <div>
              <p className="text-sm font-semibold">Usuario Demo</p>
              <p className="text-xs text-muted-foreground">Perfil público</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border bg-slate-50 p-2 text-center">Casos</div>
            <div className="rounded-lg border bg-slate-50 p-2 text-center">Cálculos</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {['Calculadora', 'Bóveda', 'Buró (próx.)'].map((tool) => (
          <Card key={tool} className="border-muted/60">
            <CardContent className="p-4 text-center text-sm font-medium">{tool}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
