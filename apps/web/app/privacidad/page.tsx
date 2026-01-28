import Link from 'next/link'
import { Scale, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Aviso de Privacidad - MeCorrieron.mx',
  description: 'Conoce como protegemos y utilizamos tu informacion personal.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header simple */}
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
          <h1 className="text-3xl font-bold text-stone-900">Aviso de Privacidad</h1>
        </div>

        <div className="prose prose-stone max-w-none">
          <p className="text-stone-500 mb-8">Ultima actualizacion: Enero 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">1. Identidad del Responsable</h2>
            <p className="text-stone-600 mb-4">
              MeCorrieron.mx (en adelante "la Plataforma") con domicilio en Ciudad de Mexico, Mexico, 
              es responsable del tratamiento de sus datos personales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">2. Datos Personales Recabados</h2>
            <p className="text-stone-600 mb-4">Para brindar nuestros servicios, recabamos:</p>
            <ul className="list-disc list-inside text-stone-600 space-y-2">
              <li>Datos de identificacion: nombre, telefono, correo electronico</li>
              <li>Datos laborales: empresa, puesto, salario, fechas de empleo</li>
              <li>Datos del caso: motivo de separacion, documentos relacionados</li>
              <li>Datos de uso: informacion sobre como utiliza nuestra plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">3. Finalidades del Tratamiento</h2>
            <p className="text-stone-600 mb-4">Sus datos personales seran utilizados para:</p>
            <ul className="list-disc list-inside text-stone-600 space-y-2">
              <li>Calcular estimaciones de liquidacion laboral</li>
              <li>Conectarlo con abogados laborales especializados</li>
              <li>Dar seguimiento a su caso</li>
              <li>Enviar comunicaciones relacionadas con su solicitud</li>
              <li>Mejorar nuestros servicios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">4. Transferencia de Datos</h2>
            <p className="text-stone-600 mb-4">
              Sus datos podran ser compartidos con abogados laborales registrados en nuestra 
              plataforma para la atencion de su caso. Esta transferencia es necesaria para 
              la prestacion del servicio solicitado.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">5. Derechos ARCO</h2>
            <p className="text-stone-600 mb-4">
              Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento 
              de sus datos personales (derechos ARCO). Para ejercer estos derechos, envie un 
              correo a: privacidad@mecorrieron.mx
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">6. Seguridad</h2>
            <p className="text-stone-600 mb-4">
              Implementamos medidas de seguridad tecnicas, administrativas y fisicas para 
              proteger sus datos personales contra dano, perdida, alteracion, destruccion 
              o uso no autorizado.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">7. Contacto</h2>
            <p className="text-stone-600">
              Para cualquier duda sobre este Aviso de Privacidad, contactenos en:
              <br />
              <strong>Email:</strong> privacidad@mecorrieron.mx
              <br />
              <strong>Telefono:</strong> +52 55 1234 5678
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
