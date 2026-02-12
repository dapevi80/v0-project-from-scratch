import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AfiliadosSkinPreview() {
  return (
    <section className="rounded-2xl border bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
            LA
          </div>
          <div>
            <p className="text-sm font-semibold">Liquidame Legal</p>
            <p className="text-xs text-cyan-200">Skin afiliados</p>
          </div>
        </div>
        <Badge className="bg-cyan-600 text-black text-xs">Partner</Badge>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-cyan-900 bg-slate-900/60 p-5">
          <p className="text-xs text-cyan-300 uppercase">Hero</p>
          <h3 className="mt-2 text-xl font-semibold">Asistencia legal para tus clientes</h3>
          <p className="mt-1 text-sm text-slate-200">
            Personaliza la experiencia con tu marca y brinda seguimiento profesional.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs text-black">Iniciar demo</span>
            <span className="rounded-full border border-cyan-700 px-3 py-1 text-xs text-cyan-200">Conocer planes</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-cyan-300 uppercase">Perfil</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-cyan-900" />
            <div>
              <p className="text-sm font-semibold">Abogado afiliado</p>
              <p className="text-xs text-cyan-200">Modo público</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-cyan-100">
            <div className="rounded-lg border border-cyan-900 p-2 text-center">Leads</div>
            <div className="rounded-lg border border-cyan-900 p-2 text-center">Casos</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {['CRM', 'Automatización', 'Analítica'].map((tool) => (
          <Card key={tool} className="border-slate-800 bg-slate-900/60">
            <CardContent className="p-4 text-center text-sm font-medium text-cyan-100">{tool}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
