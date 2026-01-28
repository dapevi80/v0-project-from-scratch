import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AyudaUrgenteButton } from '@/components/ayuda-urgente-button'
import { 
  MessageCircle, 
  UserCheck, 
  Lock, 
  Calculator, 
  MapPin, 
  Scale, 
  Banknote,
  Users,
  Briefcase,
  Shield,
  Eye,
  FileText,
  Calendar,
  CreditCard
} from 'lucide-react'

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-primary sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-destructive font-bold text-sm sm:text-lg">!m!</span>
            </div>
            <span className="text-sm sm:text-lg font-semibold text-foreground hidden sm:inline">mecorrieron.mx</span>
          </Link>
          
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Button asChild size="sm" variant="default" className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
              <Link href="/acceso">Iniciar</Link>
            </Button>
            <AyudaUrgenteButton className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* A) HERO */}
        <section className="py-12 sm:py-20 bg-white">
          <div className="container mx-auto px-4 text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              ¿Cómo funciona Me Corrieron?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ayuda urgente gratuita y acompañamiento hasta que recibas tu pago conforme a la Ley Federal del Trabajo de tu liquidación.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="default" className="text-sm">Plataforma intermediaria</Badge>
              <Badge variant="destructive" className="text-sm">Ayuda urgente 24/7</Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* B) QUÉ SOMOS */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">¿Qué somos?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Plataforma informática intermediaria</strong> que conecta trabajadores con profesionales legales.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Asociación civil</strong> de personas ayudando a personas: profesionistas socios y trabajadores clientes.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">No somos despacho</strong> ni damos representación legal directa. La asesoría la brinda el abogado asignado.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6 max-w-xl mx-auto">
              Disclaimer: La plataforma facilita la conexión y herramientas tecnológicas. La relación legal es directamente entre el trabajador y el abogado.
            </p>
          </div>
        </section>

        <Separator />

        {/* C) PARA QUIÉN ES */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">¿Para quién es?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Trabajadores */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Trabajadores</CardTitle>
                  <CardDescription>Despedidos o en riesgo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Herramientas gratis: buró de empresas, bóveda de evidencia, calculadora</p>
                  <p>Si decides contratar, firmas directamente con el abogado</p>
                </CardContent>
              </Card>

              {/* Abogados */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Abogados</CardTitle>
                  <CardDescription>Independientes certificados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Oficina virtual + asistente virtual para gestionar casos</p>
                  <p>Recibe casos verificados por ciudad/estado</p>
                </CardContent>
              </Card>

              {/* Admin */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Eye className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Operación</CardTitle>
                  <CardDescription>Control y auditoría</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Revisión y auditoría para que el flujo sea transparente</p>
                  <p>Protección y supervisión del proceso</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator />

        {/* D) EL FLUJO COMPLETO - Timeline */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">El proceso completo</h2>
            
            <div className="space-y-0">
              {[
                { step: 1, icon: MessageCircle, title: 'Pides ayuda', desc: 'Por WhatsApp o desde la app', color: 'destructive' },
                { step: 2, icon: UserCheck, title: 'Verificación', desc: 'Creas tu perfil (puede ser anónimo)', color: 'primary' },
                { step: 3, icon: Lock, title: 'Bóveda de evidencia', desc: 'Guardas tus pruebas de forma segura', color: 'primary' },
                { step: 4, icon: Calculator, title: 'Calculadora', desc: 'Estimación de tu liquidación según LFT', color: 'primary' },
                { step: 5, icon: MapPin, title: 'Asignación', desc: 'Abogado en tu ciudad o asesoría digital', color: 'primary' },
                { step: 6, icon: Scale, title: 'Conciliación o juicio', desc: 'Dirigido por tu abogado asignado', color: 'primary' },
                { step: 7, icon: Banknote, title: 'Cierre y pago', desc: 'Recibes tu arreglo', color: 'destructive' },
              ].map((item, index, arr) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.color === 'destructive' ? 'bg-destructive text-white' : 'bg-primary text-white'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    {index < arr.length - 1 && (
                      <div className="w-0.5 h-12 bg-border" />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className="text-xs text-muted-foreground mb-0.5">Paso {item.step}</p>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* E) QUÉ PUEDE HACER CADA ROL */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">¿Qué puedes hacer?</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="guest">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Invitado</Badge>
                    <span>Sin registro</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground pl-4">
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Ver buró de empresas (solo lectura)
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Bóveda de evidencia (guardado local)
                    </li>
                    <li className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Calculadora de liquidación
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="worker">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Trabajador</Badge>
                    <span>Con cuenta</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground pl-4">
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Panel de tu caso
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Chat con tu abogado
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Calendario de audiencias
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Firmas y documentos digitales
                    </li>
                    <li className="text-xs text-muted-foreground mt-2">+ Todo lo de invitado</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lawyer">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600">Abogado</Badge>
                    <span>Suscrito</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground pl-4">
                    <li className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Gestión de casos asignados
                    </li>
                    <li className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Calculadora avanzada
                    </li>
                    <li className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Panel de pagos y saldo para leads
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <Separator />

        {/* F) COSTOS */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Transparencia en costos</h2>
            <p className="text-center text-muted-foreground mb-8">Solo pagas si obtienes resultados</p>
            
            {/* Para Trabajadores */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Honorarios del Abogado
                </CardTitle>
                <CardDescription>Porcentaje sobre el arreglo que obtengas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* 25% Conciliación */}
                  <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-4xl font-bold text-blue-600">25%</p>
                    <p className="text-sm font-medium text-blue-800 mt-1">Conciliación</p>
                    <p className="text-xs text-blue-600 mt-2">Arreglo en Centro de Conciliación</p>
                  </div>
                  
                  {/* 35% Juicio/Sentencia */}
                  <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-4xl font-bold text-amber-600">35%</p>
                    <p className="text-sm font-medium text-amber-800 mt-1">Juicio o Sentencia</p>
                    <p className="text-xs text-amber-600 mt-2">Procedimiento en tribunales</p>
                  </div>
                </div>
                
                <Separator />
                
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Solo pagas si obtienes un arreglo favorable
                  </li>
                  <li className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    Métodos: efectivo, transferencia, depósito o tarjeta
                  </li>
                  <li className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    La representación legal la brinda el abogado asignado
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* G) SEGURIDAD / PRIVACIDAD */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Seguridad y privacidad</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Perfil anónimo</h3>
                <p className="text-sm text-muted-foreground">Verificado para evitar discriminación laboral</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Datos protegidos</h3>
                <p className="text-sm text-muted-foreground">Evidencia con controles de acceso</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Tu identidad</h3>
                <p className="text-sm text-muted-foreground">La empresa no ve tu nombre si eliges anonimato</p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* H) FAQ */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Preguntas frecuentes</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>¿Ustedes son abogados?</AccordionTrigger>
                <AccordionContent>
                  No. Somos una plataforma tecnológica que conecta trabajadores con abogados independientes certificados. La relación legal es directamente entre tú y el abogado.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger>¿Cuándo pago?</AccordionTrigger>
                <AccordionContent>
                  Solo pagas cuando obtienes un resultado. El 25% se descuenta del arreglo o indemnización que recibas al cerrar tu caso.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger>¿Puedo ser anónimo?</AccordionTrigger>
                <AccordionContent>
                  Sí. Puedes usar un perfil verificado pero anónimo. Tu empleador no verá tu identidad pública si así lo decides, protegiéndote de posibles represalias.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger>¿Qué pasa si no hay abogado en mi ciudad?</AccordionTrigger>
                <AccordionContent>
                  Te ofrecemos asesoría digital con abogados que pueden llevar tu caso de forma remota, o te conectamos con el abogado más cercano disponible.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger>¿Qué incluye la oficina virtual para abogados?</AccordionTrigger>
                <AccordionContent>
                  Incluye gestión de casos, calendario de audiencias, chat con clientes, calculadora avanzada, y un asistente virtual para organizar tu trabajo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger>¿Qué significa que el buró es solo lectura?</AccordionTrigger>
                <AccordionContent>
                  Como invitado puedes consultar información de empresas, pero no puedes agregar opiniones ni calificaciones. Para contribuir necesitas una cuenta verificada como trabajador.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <Separator />

        {/* I) CTA FINAL */}
        <section className="py-16 sm:py-24 bg-primary/5">
          <div className="container mx-auto px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">¿Listo para hacer valer tus derechos?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tienes solo 2 meses para reclamar después de un despido. No esperes más.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/acceso">Abrir la App</Link>
              </Button>
              <AyudaUrgenteButton className="text-base h-11 px-8" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">mecorrieron.mx</p>
          <p>Plataforma intermediaria - No somos despacho jurídico</p>
          <p>Basado en la Ley Federal del Trabajo de México</p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/legales/privacidad" className="hover:text-primary">Privacidad</Link>
            <Link href="/legales/terminos" className="hover:text-primary">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
