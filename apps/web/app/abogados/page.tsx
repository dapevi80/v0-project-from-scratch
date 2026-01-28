import Link from 'next/link'
import { Scale, ArrowRight, Users, DollarSign, Briefcase, CheckCircle, BarChart3, Shield, Clock, Zap } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecorrieron.mx'

export const metadata = {
  title: 'Para Abogados Laborales - MeCorrieron.mx',
  description: 'Unete a la red de abogados laborales de MeCorrieron.mx y recibe casos pre-calificados.',
}

export default function AbogadosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-900">MeCorrieron<span className="text-red-700">.mx</span></span>
            </Link>
            <a 
              href={`${APP_URL}/registro-abogados`}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Registrarme como abogado
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-red-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-300 rounded-full text-sm font-medium mb-6 border border-red-600/30">
              <Briefcase className="w-4 h-4" />
              Red de abogados laborales
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Recibe casos laborales<br />
              <span className="text-red-400">pre-calificados</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-300 mb-8 max-w-2xl">
              Unete a la red de abogados de MeCorrieron.mx. Te enviamos clientes que ya calcularon su liquidacion y estan listos para proceder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={`${APP_URL}/registro-abogados`}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Aplicar ahora
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#beneficios"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-xl border border-white/20 transition-all flex items-center justify-center"
              >
                Ver beneficios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Casos mensuales' },
              { value: '$45M+', label: 'Generados para abogados' },
              { value: '32', label: 'Estados cubiertos' },
              { value: '4.8/5', label: 'Satisfaccion clientes' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-red-700">{stat.value}</div>
                <div className="text-stone-600 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Por que unirte a MeCorrieron.mx
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Accede a una fuente constante de casos laborales sin gastar en publicidad
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                title: 'Clientes pre-calificados', 
                desc: 'Recibe solo casos que ya calcularon su liquidacion y estan comprometidos a proceder.' 
              },
              { 
                icon: DollarSign, 
                title: 'Sin cuotas mensuales', 
                desc: 'Solo pagas una comision cuando cierras un caso. Sin costos fijos ni sorpresas.' 
              },
              { 
                icon: BarChart3, 
                title: 'Dashboard de casos', 
                desc: 'Gestiona todos tus casos desde un solo lugar. Seguimiento, documentos y comunicacion.' 
              },
              { 
                icon: Shield, 
                title: 'Perfil verificado', 
                desc: 'Tu cedula profesional es validada, generando confianza con los clientes.' 
              },
              { 
                icon: Clock, 
                title: 'Ahorra tiempo', 
                desc: 'Los clientes llegan con toda la informacion de su caso ya capturada.' 
              },
              { 
                icon: Zap, 
                title: 'Notificaciones instantaneas', 
                desc: 'Recibe alertas en tiempo real cuando hay nuevos casos en tu zona.' 
              },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 hover:border-red-200 transition-all">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-red-700" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Como funciona</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Registrate y verifica tu cedula', desc: 'Completa tu perfil y sube tu documentacion. Validamos tu cedula profesional.' },
              { step: '2', title: 'Configura tu area de practica', desc: 'Selecciona los estados donde operas y tus especialidades laborales.' },
              { step: '3', title: 'Recibe casos asignados', desc: 'Te enviamos notificaciones cuando hay casos compatibles con tu perfil.' },
              { step: '4', title: 'Contacta al cliente', desc: 'Accede a la informacion del caso y contacta al trabajador directamente.' },
              { step: '5', title: 'Cierra el caso y factura', desc: 'Acuerda honorarios con el cliente. Nosotros cobramos solo si tu cobras.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex-shrink-0 w-10 h-10 bg-red-700 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">{item.title}</h3>
                  <p className="text-stone-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">Requisitos para unirte</h2>
            <div className="bg-stone-50 rounded-2xl p-8 border border-stone-200">
              <ul className="space-y-4">
                {[
                  'Cedula profesional vigente en Derecho',
                  'Experiencia minima de 2 anos en derecho laboral',
                  'Disponibilidad para atender casos en tu zona',
                  'Compromiso con la etica profesional',
                  'Acceso a internet y dispositivo movil',
                ].map((req, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-stone-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Empieza a recibir casos hoy
          </h2>
          <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
            El registro toma menos de 10 minutos. Una vez verificado, empezaras a recibir casos en tu zona.
          </p>
          <a 
            href={`${APP_URL}/registro-abogados`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-stone-100 text-red-800 text-lg font-semibold rounded-xl transition-colors shadow-xl"
          >
            Registrarme como abogado
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="py-8 bg-stone-900 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} MeCorrieron.mx - Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}
