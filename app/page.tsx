import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-primary">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-destructive font-bold text-sm sm:text-lg">!m!</span>
            </div>
            <span className="text-sm sm:text-lg font-semibold text-foreground hidden sm:inline">mecorrieron.mx</span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/como-funciona" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
              ¿Cómo funciona?
            </Link>
            <Button asChild size="sm" variant="default" className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
              <Link href="/acceso">Iniciar</Link>
            </Button>
            <AyudaUrgenteButton className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9" />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto leading-tight">
            Te despidieron injustamente.
            <br />
            <span className="text-primary">Nosotros te ayudamos.</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Conectamos trabajadores despedidos con abogados laborales certificados. 
            Calcula tu liquidación, reúne evidencia y haz valer tus derechos según la Ley Federal del Trabajo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/acceso">Calcular mi liquidación</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base bg-transparent">
              <Link href="/como-funciona">Cómo funciona</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div>
              <span className="block text-2xl font-bold text-foreground">100%</span>
              <span>Basado en la LFT</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-foreground">45 días</span>
              <span>Proceso de conciliación</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-foreground">25%</span>
              <span>Solo si ganas</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            mecorrieron.mx todos los derechos reservados 2026
          </p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="text-xs text-muted-foreground hover:text-foreground">
              Legal
            </Link>
            <Link href="/registro-abogados">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Abogados
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
