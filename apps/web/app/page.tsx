import Link from 'next/link'
import { Shield, Calculator, Users, CheckCircle, ArrowRight, Phone, Scale, Clock, BadgeCheck } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mecorrieron.mx'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-900">MeCorrieron<span className="text-red-700">.mx</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Como funciona</a>
              <a href="#beneficios" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Beneficios</a>
              <a href="#testimonios" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Testimonios</a>
              <Link href="/abogados" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Para Abogados</Link>
            </nav>
            <div className="flex items-center gap-3">
              <a 
                href={`${APP_URL}/acceso`}
                className="text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                Iniciar sesion
              </a>
              <a 
                href={APP_URL}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Calcular gratis
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-white to-red-50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
              <BadgeCheck className="w-4 h-4" />
              +5,000 trabajadores ayudados
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
              Te despidieron?<br />
              <span className="text-red-700">Reclama lo que es tuyo</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
              Calcula tu liquidacion en menos de 2 minutos y conecta con abogados laborales expertos que pelean por ti. Sin costo inicial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href={APP_URL}
                className="w-full sm:w-auto px-8 py-4 bg-red-700 hover:bg-red-800 text-white text-lg font-semibold rounded-xl transition-all shadow-lg shadow-red-700/20 hover:shadow-xl hover:shadow-red-700/30 flex items-center justify-center gap-2"
              >
                Calcular mi liquidacion
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="tel:+525512345678"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-stone-50 text-stone-800 text-lg font-semibold rounded-xl border-2 border-stone-200 hover:border-stone-300 transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Llamar ahora
              </a>
            </div>
            <p className="text-sm text-stone-500 mt-4">
              100% confidencial. Sin compromiso. Respuesta en menos de 24 horas.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '$45M+', label: 'Recuperados para trabajadores' },
              { value: '5,000+', label: 'Casos atendidos' },
              { value: '95%', label: 'Tasa de exito' },
              { value: '24hrs', label: 'Tiempo de respuesta' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-red-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Como funciona</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              En 3 simples pasos puedes saber cuanto te corresponde y empezar tu reclamo
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calculator,
                step: '01',
                title: 'Calcula tu liquidacion',
                description: 'Ingresa los datos de tu empleo y obtén un estimado de lo que te corresponde por ley.',
              },
              {
                icon: Users,
                step: '02',
                title: 'Conecta con un abogado',
                description: 'Te asignamos un abogado laboral experto en tu estado que revisara tu caso sin costo.',
              },
              {
                icon: Shield,
                step: '03',
                title: 'Recupera tu dinero',
                description: 'Tu abogado negocia o demanda para que recibas la indemnización completa.',
              },
            ].map((item, i) => (
              <div key={i} className="relative p-8 bg-stone-50 rounded-2xl border border-stone-100 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                  {item.step}
                </div>
                <item.icon className="w-10 h-10 text-red-700 mb-4 mt-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a 
              href={APP_URL}
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl transition-colors"
            >
              Empezar ahora - Es gratis
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Por que elegirnos</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Somos la plataforma lider en Mexico para reclamos laborales
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle, title: 'Sin costo inicial', desc: 'Solo pagas si ganas tu caso. Sin sorpresas.' },
              { icon: Clock, title: 'Respuesta rapida', desc: 'Un abogado te contacta en menos de 24 horas.' },
              { icon: Shield, title: '100% confidencial', desc: 'Tu informacion esta protegida y segura.' },
              { icon: Scale, title: 'Abogados verificados', desc: 'Red de abogados con cedula profesional validada.' },
              { icon: Users, title: 'Seguimiento completo', desc: 'Accede al estado de tu caso en cualquier momento.' },
              { icon: BadgeCheck, title: 'Garantia de servicio', desc: 'Si no quedas satisfecho, te devolvemos tu dinero.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white rounded-xl border border-stone-200">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Maria G.', location: 'CDMX', text: 'Recupere $85,000 que mi empresa no queria pagarme. El abogado fue muy profesional y todo fue muy rapido.', amount: '$85,000' },
              { name: 'Roberto M.', location: 'Monterrey', text: 'Pense que no tenia caso pero el abogado encontro varias violaciones. Al final me pagaron mas de lo esperado.', amount: '$120,000' },
              { name: 'Ana L.', location: 'Guadalajara', text: 'Excelente servicio. Me mantuvieron informada en todo momento y el proceso fue muy transparente.', amount: '$65,000' },
            ].map((t, i) => (
              <div key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-stone-700 mb-4">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-900">{t.name}</div>
                    <div className="text-sm text-stone-500">{t.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-500">Recuperado</div>
                    <div className="font-bold text-green-600">{t.amount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-red-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            No dejes que se salgan con la suya
          </h2>
          <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
            Cada dia que pasa es dinero que pierdes. Calcula tu liquidacion ahora y da el primer paso para recuperar lo que te corresponde.
          </p>
          <a 
            href={APP_URL}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-stone-100 text-red-800 text-lg font-semibold rounded-xl transition-colors shadow-xl"
          >
            Calcular mi liquidacion gratis
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-stone-900 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">MeCorrieron.mx</span>
              </div>
              <p className="text-sm">
                La plataforma lider en Mexico para reclamos laborales por despido injustificado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li><a href={APP_URL} className="hover:text-white transition-colors">Calcular liquidacion</a></li>
                <li><a href={`${APP_URL}/acceso`} className="hover:text-white transition-colors">Consultar caso</a></li>
                <li><Link href="/abogados" className="hover:text-white transition-colors">Para abogados</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">Aviso de privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">Terminos y condiciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>contacto@mecorrieron.mx</li>
                <li>+52 55 1234 5678</li>
                <li>Lunes a Viernes 9am - 6pm</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} MeCorrieron.mx - Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
