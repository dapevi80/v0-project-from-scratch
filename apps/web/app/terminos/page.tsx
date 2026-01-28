import Link from 'next/link'
import { Scale, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terminos y Condiciones - MeCorrieron.mx',
  description: 'Terminos y condiciones de uso de la plataforma MeCorrieron.mx',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-800 rounded-lg flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Terminos y Condiciones</h1>
        </div>

        <div className="prose prose-stone max-w-none">
          <p className="text-stone-500 mb-8">Ultima actualizacion: Enero 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">1. Aceptacion de Terminos</h2>
            <p className="text-stone-600 mb-4">
              Al utilizar MeCorrieron.mx, usted acepta estos terminos y condiciones en su totalidad. 
              Si no esta de acuerdo con alguna parte, no utilice nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">2. Descripcion del Servicio</h2>
            <p className="text-stone-600 mb-4">
              MeCorrieron.mx es una plataforma tecnologica que conecta trabajadores con abogados 
              laborales. Proporcionamos herramientas de calculo estimativo y facilitamos la 
              comunicacion entre las partes.
            </p>
            <p className="text-stone-600 mb-4">
              <strong>Importante:</strong> No somos un despacho de abogados. Los calculos son 
              estimaciones y no constituyen asesoria legal. La relacion abogado-cliente se 
              establece directamente con el profesional asignado.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">3. Uso de la Plataforma</h2>
            <p className="text-stone-600 mb-4">El usuario se compromete a:</p>
            <ul className="list-disc list-inside text-stone-600 space-y-2">
              <li>Proporcionar informacion veraz y actualizada</li>
              <li>No utilizar la plataforma para fines ilegales</li>
              <li>No intentar acceder a sistemas no autorizados</li>
              <li>Respetar la confidencialidad de su cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">4. Costos y Pagos</h2>
            <p className="text-stone-600 mb-4">
              El uso inicial de la plataforma (calculo y consulta) es gratuito. Los honorarios 
              por servicios legales se acuerdan directamente entre el usuario y el abogado 
              asignado. MeCorrieron.mx puede cobrar una comision por la intermediacion exitosa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">5. Limitacion de Responsabilidad</h2>
            <p className="text-stone-600 mb-4">
              MeCorrieron.mx no garantiza resultados especificos en casos legales. Los calculos 
              son estimaciones basadas en la ley vigente y pueden variar. No somos responsables 
              por decisiones tomadas en base a nuestras estimaciones.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">6. Propiedad Intelectual</h2>
            <p className="text-stone-600 mb-4">
              Todo el contenido de la plataforma (disenos, textos, logos, codigo) es propiedad 
              de MeCorrieron.mx y esta protegido por leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">7. Modificaciones</h2>
            <p className="text-stone-600 mb-4">
              Nos reservamos el derecho de modificar estos terminos en cualquier momento. 
              Los cambios seran efectivos al publicarse en la plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">8. Ley Aplicable</h2>
            <p className="text-stone-600 mb-4">
              Estos terminos se rigen por las leyes de los Estados Unidos Mexicanos. 
              Cualquier disputa sera resuelta en los tribunales de la Ciudad de Mexico.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">9. Contacto</h2>
            <p className="text-stone-600">
              Para dudas sobre estos terminos:
              <br />
              <strong>Email:</strong> legal@mecorrieron.mx
              <br />
              <strong>Telefono:</strong> +52 55 1234 5678
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
