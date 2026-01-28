'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  Download, 
  Scale,
  CheckCircle2,
  BookOpen
} from 'lucide-react'

export default function LegalPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('terminos')
  
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'privacidad') {
      setActiveTab('privacidad')
    }
  }, [searchParams])
  
  const fechaActualizacion = '27 de enero de 2026'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="font-semibold">Documentos Legales</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Intro */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Marco Legal</h1>
          <p className="text-muted-foreground">
            Documentos legales que rigen el uso de la plataforma y la relación entre las partes
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: {fechaActualizacion}
          </p>
        </div>
        
        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('terminos')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Términos y Condiciones</h3>
                <p className="text-sm text-muted-foreground">Incluye contrato de servicios legales</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setActiveTab('privacidad')}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Aviso de Privacidad</h3>
                <p className="text-sm text-muted-foreground">Protección de datos personales</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Document Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="terminos" className="gap-2">
              <FileText className="w-4 h-4" />
              Términos y Condiciones
            </TabsTrigger>
            <TabsTrigger value="privacidad" className="gap-2">
              <Shield className="w-4 h-4" />
              Aviso de Privacidad
            </TabsTrigger>
          </TabsList>
          
          {/* Términos y Condiciones */}
          <TabsContent value="terminos">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Términos y Condiciones de Uso
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                    <a href="/documentos/terminos-y-condiciones.pdf" target="_blank" download>
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] p-6">
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-xl font-bold text-center mb-6">
                      TÉRMINOS Y CONDICIONES DE USO<br />
                      CONTRATO DE PRESTACIÓN DE SERVICIOS LEGALES
                    </h1>
                    
                    <p className="text-center text-sm text-muted-foreground mb-6">
                      Versión vigente a partir del {fechaActualizacion}
                    </p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold mt-6">DECLARACIONES</h2>
                    
                    <p><strong>I.</strong> <strong>BRAINSHIELD SC</strong> (en adelante "EL RESPONSABLE"), Sociedad Civil legalmente constituida conforme a las leyes mexicanas, con domicilio en Calle Valle de Tlacolula 117, Planta Alta, Valle de Aragón 3ra Sección, CP 55284, Ciudad de México, es propietaria y operadora de la plataforma digital denominada <strong>"¡Me corrieron!"</strong> (en adelante "LA PLATAFORMA"), marca comercial registrada ante el Instituto Mexicano de la Propiedad Industrial (IMPI).</p>
                    
                    <p><strong>II.</strong> LA PLATAFORMA facilita la conexión entre trabajadores y abogados especializados en derecho laboral, debidamente autorizados para ejercer la abogacía en los Estados Unidos Mexicanos, conforme a lo dispuesto por la Ley Reglamentaria del Artículo 5° Constitucional.</p>
                    
                    <p><strong>III.</strong> El <strong>USUARIO</strong> declara ser mayor de edad, con capacidad legal para contratar y obligarse en términos de la legislación civil aplicable.</p>
                    
                    <p><strong>IV.</strong> Las partes acuerdan sujetarse a los presentes términos y condiciones, los cuales constituyen un contrato vinculante entre el USUARIO, EL RESPONSABLE y los ABOGADOS que presten servicios a través de LA PLATAFORMA.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO I - DEFINICIONES</h2>
                    
                    <p><strong>Artículo 1.</strong> Para efectos del presente instrumento, se entenderá por:</p>
                    
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>RESPONSABLE:</strong> Brainshield SC, Sociedad Civil propietaria de la plataforma "¡Me corrieron!" y de los derechos de propiedad intelectual asociados.</li>
                      <li><strong>PLATAFORMA:</strong> El sistema digital "¡Me corrieron!" (mecorrieron.mx) que facilita la conexión entre trabajadores y abogados especializados en derecho laboral.</li>
                      <li><strong>USUARIO/TRABAJADOR:</strong> Persona física que utiliza LA PLATAFORMA para calcular su liquidación laboral y/o contratar servicios de asesoría legal.</li>
                      <li><strong>ABOGADO:</strong> Profesional del derecho con cédula profesional vigente, registrado en LA PLATAFORMA para prestar servicios legales.</li>
                      <li><strong>DESPACHO:</strong> Persona moral o física con actividad empresarial dedicada a la prestación de servicios legales.</li>
                      <li><strong>CASO:</strong> El asunto legal específico del TRABAJADOR que requiere representación o asesoría.</li>
                      <li><strong>BÓVEDA:</strong> Espacio digital seguro donde el USUARIO almacena sus documentos y cálculos.</li>
                      <li><strong>HONORARIOS:</strong> La contraprestación pactada por los servicios legales.</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO II - OBJETO DEL CONTRATO</h2>
                    
                    <p><strong>Artículo 2. Objeto.</strong> El presente contrato tiene por objeto establecer los términos y condiciones bajo los cuales:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>El USUARIO podrá utilizar las herramientas de LA PLATAFORMA;</li>
                      <li>El USUARIO podrá contratar servicios de asesoría y representación legal;</li>
                      <li>El ABOGADO prestará sus servicios profesionales al USUARIO.</li>
                    </ol>
                    
                    <p><strong>Artículo 3. Servicios de LA PLATAFORMA.</strong> LA PLATAFORMA ofrece:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li><strong>Calculadora de liquidación:</strong> Herramienta para estimar montos de liquidación conforme a la Ley Federal del Trabajo;</li>
                      <li><strong>Bóveda digital:</strong> Almacenamiento seguro de documentos;</li>
                      <li><strong>Conexión con abogados:</strong> Intermediación para la contratación de servicios legales;</li>
                      <li><strong>Seguimiento de casos:</strong> Herramientas para monitorear el avance de procedimientos.</li>
                    </ol>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO III - CONTRATO DE SERVICIOS LEGALES</h2>
                    
                    <p><strong>Artículo 4. Relación abogado-cliente.</strong> Al momento en que el USUARIO solicita la contratación de un ABOGADO a través de LA PLATAFORMA y este acepta, se establece una relación profesional abogado-cliente regida por:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>El Código de Ética Profesional de la Barra Mexicana de Abogados;</li>
                      <li>La Ley Reglamentaria del Artículo 5° Constitucional;</li>
                      <li>Las disposiciones aplicables del Código Civil;</li>
                      <li>Los presentes Términos y Condiciones.</li>
                    </ul>
                    
                    <p><strong>Artículo 5. Obligaciones del ABOGADO.</strong> El ABOGADO se obliga a:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Actuar con diligencia, lealtad y buena fe en la representación del USUARIO;</li>
                      <li>Mantener informado al USUARIO sobre el estado de su caso;</li>
                      <li>Guardar el secreto profesional respecto a toda información proporcionada;</li>
                      <li>Comparecer puntualmente a las audiencias y diligencias programadas;</li>
                      <li>Interponer los recursos legales que procedan en beneficio del USUARIO;</li>
                      <li>Rendir cuentas sobre los gastos y honorarios;</li>
                      <li>Entregar la documentación original al término de la representación.</li>
                    </ol>
                    
                    <p><strong>Artículo 6. Obligaciones del USUARIO.</strong> El USUARIO se obliga a:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Proporcionar información veraz y completa sobre su caso;</li>
                      <li>Entregar oportunamente los documentos requeridos;</li>
                      <li>Comparecer a las audiencias cuando sea necesario;</li>
                      <li>Pagar los honorarios pactados en tiempo y forma;</li>
                      <li>Mantener comunicación oportuna con su ABOGADO;</li>
                      <li>No realizar gestiones directas que puedan perjudicar su caso.</li>
                    </ol>
                    
                    <p><strong>Artículo 7. Honorarios.</strong></p>
                    <ol className="list-decimal pl-6 space-y-1">
<li>Los honorarios serán pactados entre el USUARIO y el ABOGADO previo a la aceptación del caso;</li>
  <li>Podrán pactarse honorarios de resultado (cuota litis) conforme a la legislación aplicable y acuerdo entre las partes;</li>
  <li>Los gastos y costas del procedimiento correrán por cuenta del USUARIO, salvo pacto en contrario;</li>
  <li>El ABOGADO proporcionará al USUARIO un desglose claro de los costos antes de iniciar cualquier acción legal.</li>
  </ol>
                    
                    <p><strong>Artículo 8. Terminación de la relación.</strong> La relación abogado-cliente podrá terminar por:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Conclusión del asunto;</li>
                      <li>Renuncia del ABOGADO (con causa justificada y previo aviso);</li>
                      <li>Revocación del mandato por el USUARIO;</li>
                      <li>Incumplimiento de las obligaciones de cualquiera de las partes;</li>
                      <li>Mutuo acuerdo;</li>
                      <li><strong>Revocación por parte de LA PLATAFORMA</strong> en caso de mala conducta profesional, reportes de usuarios, violación a los presentes términos, o cualquier conducta que atente contra los intereses del USUARIO o el buen nombre de LA PLATAFORMA.</li>
                    </ul>
                    
                    <p><strong>Artículo 8 Bis. Revocación de casos por LA PLATAFORMA.</strong> EL RESPONSABLE se reserva el derecho de revocar la asignación de un caso al ABOGADO cuando:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Existan reportes fundados de mala conducta profesional por parte de los USUARIOS;</li>
                      <li>Se detecte negligencia en el manejo del caso;</li>
                      <li>El ABOGADO incumpla reiteradamente sus obligaciones;</li>
                      <li>Se compruebe falsedad en la información proporcionada por el ABOGADO;</li>
                      <li>Existan quejas ante el Colegio de Abogados correspondiente o autoridad competente;</li>
                      <li>Se violen las disposiciones del Código de Ética Profesional.</li>
                    </ul>
                    <p>En caso de revocación, LA PLATAFORMA facilitará la transición del caso a otro ABOGADO, salvaguardando los intereses del USUARIO.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO IV - USO DE LA PLATAFORMA</h2>
                    
                    <p><strong>Artículo 9. Registro.</strong> Para utilizar LA PLATAFORMA, el USUARIO deberá:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Crear una cuenta proporcionando información veraz;</li>
                      <li>Aceptar los presentes Términos y Condiciones;</li>
                      <li>Aceptar el Aviso de Privacidad.</li>
                    </ol>
                    
                    <p><strong>Artículo 10. Cuenta de usuario.</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>El USUARIO es responsable de mantener la confidencialidad de sus credenciales;</li>
                      <li>Toda actividad realizada desde su cuenta se presumirá realizada por el USUARIO;</li>
                      <li>El USUARIO debe notificar inmediatamente cualquier uso no autorizado.</li>
                    </ul>
                    
                    <p><strong>Artículo 11. Prohibiciones.</strong> Queda prohibido al USUARIO:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Proporcionar información falsa o engañosa;</li>
                      <li>Utilizar LA PLATAFORMA para fines ilícitos;</li>
                      <li>Intentar vulnerar la seguridad del sistema;</li>
                      <li>Reproducir o distribuir el contenido sin autorización;</li>
                      <li>Suplantar la identidad de terceros.</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO V - CÁLCULOS Y ESTIMACIONES</h2>
                    
                    <p><strong>Artículo 12. Naturaleza de los cálculos.</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Los cálculos generados por LA PLATAFORMA son <strong>estimaciones</strong> basadas en la información proporcionada;</li>
                      <li>No constituyen una garantía de los montos a obtener en un procedimiento;</li>
                      <li>LA PLATAFORMA no se hace responsable por diferencias entre lo calculado y lo obtenido.</li>
                    </ul>
                    
                    <p><strong>Artículo 12 Bis. Determinación de montos finales.</strong> Los montos definitivos que el USUARIO pueda obtener dependerán exclusivamente de:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Mutuo arreglo conciliatorio prejudicial:</strong> Acuerdo alcanzado entre las partes antes de iniciar procedimiento ante autoridad;</li>
                      <li><strong>Convenio conciliatorio judicial:</strong> Acuerdo alcanzado ante el Centro de Conciliación Laboral o autoridad competente;</li>
                      <li><strong>Laudo o sentencia:</strong> Resolución dictada por el Tribunal Laboral competente.</li>
                    </ul>
                    <p>LA PLATAFORMA no tiene injerencia en la determinación de dichos montos, los cuales son establecidos por las partes de mutuo acuerdo o por la autoridad jurisdiccional correspondiente conforme a derecho.</p>
                    
                    <p><strong>Artículo 13. Prescripción.</strong> LA PLATAFORMA informará al USUARIO sobre los plazos de prescripción aplicables conforme a:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>Artículo 517, fracción I, LFT:</strong> 30 días para acciones de separación;</li>
                      <li><strong>Artículo 518, LFT:</strong> 60 días para acciones derivadas de despido.</li>
                    </ul>
                    <p>Dichos plazos son establecidos por la autoridad y la Ley Federal del Trabajo, no por LA PLATAFORMA.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO VI - RESPONSABILIDAD</h2>
                    
                    <p><strong>Artículo 14. Limitación de responsabilidad.</strong></p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>LA PLATAFORMA actúa como intermediario entre USUARIOS y ABOGADOS;</li>
                      <li>La responsabilidad profesional recae directamente en el ABOGADO que presta el servicio;</li>
                      <li>LA PLATAFORMA no garantiza resultados en los procedimientos legales;</li>
                      <li>LA PLATAFORMA no será responsable por daños indirectos o consecuenciales.</li>
                    </ul>
                    
                    <p><strong>Artículo 15. Disponibilidad.</strong> LA PLATAFORMA se esforzará por mantener el servicio disponible, pero no garantiza disponibilidad ininterrumpida.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO VII - PROPIEDAD INTELECTUAL</h2>
                    
                    <p><strong>Artículo 16.</strong> Todos los derechos de propiedad intelectual sobre LA PLATAFORMA, incluyendo marcas, diseños, software y contenido, pertenecen a sus titulares y están protegidos por la legislación aplicable.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">CAPÍTULO VIII - DISPOSICIONES FINALES</h2>
                    
                    <p><strong>Artículo 17. Modificaciones.</strong> LA PLATAFORMA podrá modificar estos términos notificando a los USUARIOS con 15 días de anticipación. El uso continuado implica aceptación.</p>
                    
                    <p><strong>Artículo 18. Legislación aplicable.</strong> El presente contrato se rige por las leyes de los Estados Unidos Mexicanos.</p>
                    
                    <p><strong>Artículo 19. Jurisdicción.</strong> Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.</p>
                    
                    <p><strong>Artículo 20. Nulidad parcial.</strong> Si alguna disposición fuere declarada nula, las demás conservarán su validez.</p>
                    
                    <p><strong>Artículo 21. Acuerdo completo.</strong> Estos términos constituyen el acuerdo completo entre las partes respecto al uso de LA PLATAFORMA.</p>
                    
                    <hr className="my-6" />
                    
                    <div className="bg-muted p-4 rounded-lg mt-6">
                      <p className="text-sm text-center">
                        <strong>ACEPTACIÓN</strong><br />
                        Al crear una cuenta o utilizar LA PLATAFORMA, el USUARIO declara haber leído, entendido y aceptado íntegramente los presentes Términos y Condiciones, manifestando su consentimiento expreso para obligarse conforme a los mismos.
                      </p>
                    </div>
                    
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aviso de Privacidad */}
          <TabsContent value="privacidad">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Aviso de Privacidad Integral
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                    <a href="/documentos/aviso-de-privacidad.pdf" target="_blank" download>
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] p-6">
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-xl font-bold text-center mb-6">
                      AVISO DE PRIVACIDAD INTEGRAL
                    </h1>
                    
                    <p className="text-center text-sm text-muted-foreground mb-6">
                      En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento
                    </p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">I. IDENTIDAD Y DOMICILIO DEL RESPONSABLE</h2>
                    
                    <p><strong>BRAINSHIELD SC</strong> (en adelante "EL RESPONSABLE"), Sociedad Civil legalmente constituida, con domicilio en Calle Valle de Tlacolula 117, Planta Alta, Valle de Aragón 3ra Sección, CP 55284, Ciudad de México, es responsable del tratamiento de sus datos personales.</p>
                    
                    <p>EL RESPONSABLE es propietario de la plataforma digital <strong>"¡Me corrieron!"</strong> (mecorrieron.mx), marca comercial registrada ante el Instituto Mexicano de la Propiedad Industrial (IMPI).</p>
                    
                    <p><strong>Contacto para asuntos de privacidad y derechos ARCO:</strong></p>
                    <ul className="list-disc pl-6">
                      <li>Correo electrónico: <a href="mailto:legal@mecorrieron.mx" className="text-primary">legal@mecorrieron.mx</a></li>
                      <li>Domicilio: Calle Valle de Tlacolula 117, Planta Alta, Valle de Aragón 3ra Sección, CP 55284, Ciudad de México</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">II. DATOS PERSONALES RECABADOS</h2>
                    
                    <p><strong>A. Datos de identificación:</strong></p>
                    <ul className="list-disc pl-6">
                      <li>Nombre completo</li>
                      <li>CURP</li>
                      <li>RFC (cuando aplique)</li>
                      <li>Número de identificación oficial (INE/Pasaporte)</li>
                      <li>Fotografía</li>
                      <li>Firma</li>
                    </ul>
                    
                    <p><strong>B. Datos de contacto:</strong></p>
                    <ul className="list-disc pl-6">
                      <li>Número telefónico</li>
                      <li>Número de WhatsApp</li>
                      <li>Correo electrónico</li>
                      <li>Domicilio</li>
                    </ul>
                    
                    <p><strong>C. Datos laborales:</strong></p>
                    <ul className="list-disc pl-6">
                      <li>Nombre del empleador</li>
                      <li>Puesto desempeñado</li>
                      <li>Fecha de ingreso y salida</li>
                      <li>Salario y prestaciones</li>
                      <li>Causa de terminación laboral</li>
                      <li>Documentos laborales (contratos, recibos de nómina, etc.)</li>
                    </ul>
                    
                    <p><strong>D. Datos financieros:</strong></p>
                    <ul className="list-disc pl-6">
                      <li>Información bancaria para depósitos (cuando aplique)</li>
                      <li>Historial de pagos en la plataforma</li>
                    </ul>
                    
                    <p><strong>E. Datos sensibles:</strong></p>
                    <p>Podemos recabar datos sensibles relacionados con su caso laboral, incluyendo:</p>
                    <ul className="list-disc pl-6">
                      <li>Estado de salud (en casos de incapacidad o enfermedad laboral)</li>
                      <li>Afiliación sindical</li>
                      <li>Información sobre embarazo o maternidad (en casos de discriminación)</li>
                    </ul>
                    <p className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                      <strong>Nota:</strong> Los datos sensibles serán tratados con estricta confidencialidad y únicamente para los fines específicos de su caso legal, requiriendo su consentimiento expreso.
                    </p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">III. FINALIDADES DEL TRATAMIENTO</h2>
                    
                    <p><strong>A. Finalidades primarias (necesarias):</strong></p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Crear y administrar su cuenta de usuario</li>
                      <li>Realizar cálculos de liquidación laboral</li>
                      <li>Almacenar documentos en su bóveda digital</li>
                      <li>Conectarle con abogados especializados</li>
                      <li>Facilitar la prestación de servicios legales</li>
                      <li>Dar seguimiento a su caso</li>
                      <li>Generar documentos legales</li>
                      <li>Procesar pagos y facturación</li>
                      <li>Cumplir obligaciones legales</li>
                      <li>Atender requerimientos de autoridades</li>
                    </ol>
                    
                    <p><strong>B. Finalidades secundarias (opcionales):</strong></p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Enviar comunicaciones promocionales</li>
                      <li>Realizar encuestas de satisfacción</li>
                      <li>Elaborar estadísticas (de forma anonimizada)</li>
                      <li>Mejorar nuestros servicios</li>
                    </ol>
                    <p>Si no desea que sus datos se utilicen para finalidades secundarias, puede indicarlo enviando un correo a: <a href="mailto:legal@mecorrieron.mx" className="text-primary">legal@mecorrieron.mx</a></p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">IV. TRANSFERENCIA DE DATOS</h2>
                    
                    <p>Sus datos personales podrán ser transferidos a:</p>
                    
                    <table className="w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">Destinatario</th>
                          <th className="border p-2 text-left">Finalidad</th>
                          <th className="border p-2 text-left">Consentimiento</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">Abogados registrados</td>
                          <td className="border p-2">Prestación de servicios legales</td>
                          <td className="border p-2">Necesario</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Despachos asociados</td>
                          <td className="border p-2">Coordinación de casos</td>
                          <td className="border p-2">Necesario</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Autoridades laborales</td>
                          <td className="border p-2">Cumplimiento legal</td>
                          <td className="border p-2">No requerido por ley</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Tribunales</td>
                          <td className="border p-2">Procedimientos jurisdiccionales</td>
                          <td className="border p-2">No requerido por ley</td>
                        </tr>
                        <tr>
                          <td className="border p-2">Proveedores de servicios</td>
                          <td className="border p-2">Almacenamiento y procesamiento</td>
                          <td className="border p-2">Necesario</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">V. DERECHOS ARCO</h2>
                    
                    <p>Usted tiene derecho a:</p>
                    <ul className="list-disc pl-6">
                      <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                      <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                      <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos</li>
                      <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                    </ul>
                    
                    <p>También puede:</p>
                    <ul className="list-disc pl-6">
                      <li>Revocar su consentimiento</li>
                      <li>Limitar el uso o divulgación de sus datos</li>
                      <li>Solicitar la portabilidad de sus datos</li>
                    </ul>
                    
                    <p><strong>Procedimiento para ejercer derechos ARCO:</strong></p>
                    <ol className="list-decimal pl-6 space-y-1">
                      <li>Envíe su solicitud a: <a href="mailto:legal@mecorrieron.mx" className="text-primary">legal@mecorrieron.mx</a></li>
                      <li>Incluya: nombre completo, correo de contacto, descripción clara de lo que solicita, documentos que acrediten su identidad</li>
                      <li>Responderemos en un plazo máximo de 20 días hábiles</li>
                      <li>La respuesta se enviará al correo proporcionado</li>
                    </ol>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">VI. MEDIDAS DE SEGURIDAD</h2>
                    
                    <p>Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger sus datos:</p>
                    <ul className="list-disc pl-6">
                      <li>Cifrado de datos en tránsito y reposo (SSL/TLS)</li>
                      <li>Acceso restringido mediante autenticación</li>
                      <li>Monitoreo de actividad sospechosa</li>
                      <li>Respaldos periódicos</li>
                      <li>Capacitación al personal sobre protección de datos</li>
                      <li>Acuerdos de confidencialidad con terceros</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">VII. USO DE COOKIES Y TECNOLOGÍAS DE RASTREO</h2>
                    
                    <p>Utilizamos cookies para:</p>
                    <ul className="list-disc pl-6">
                      <li>Mantener su sesión activa</li>
                      <li>Recordar sus preferencias</li>
                      <li>Analizar el uso de la plataforma</li>
                      <li>Mejorar la experiencia de usuario</li>
                    </ul>
                    <p>Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad.</p>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">VIII. CONSERVACIÓN DE DATOS</h2>
                    
                    <p>Conservaremos sus datos durante:</p>
                    <ul className="list-disc pl-6">
                      <li><strong>Datos de cuenta:</strong> Mientras mantenga su cuenta activa</li>
                      <li><strong>Datos de casos:</strong> 10 años después de concluido el caso (obligación legal)</li>
                      <li><strong>Datos fiscales:</strong> 5 años (obligación fiscal)</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">IX. MODIFICACIONES AL AVISO</h2>
                    
                    <p>Nos reservamos el derecho de modificar este aviso. Las modificaciones se notificarán mediante:</p>
                    <ul className="list-disc pl-6">
                      <li>Publicación en la plataforma</li>
                      <li>Correo electrónico</li>
                      <li>Notificación en la aplicación</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <h2 className="text-lg font-semibold">X. AUTORIDAD</h2>
                    
                    <p>Si considera que sus derechos han sido vulnerados, puede presentar una queja ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI):</p>
                    <ul className="list-disc pl-6">
                      <li>Sitio web: www.inai.org.mx</li>
                      <li>Teléfono: 800 835 4324</li>
                    </ul>
                    
                    <hr className="my-6" />
                    
                    <div className="bg-muted p-4 rounded-lg mt-6">
                      <p className="text-sm text-center">
                        <strong>CONSENTIMIENTO</strong><br />
                        Al proporcionar sus datos personales y utilizar nuestra plataforma, usted manifiesta haber leído y comprendido el presente Aviso de Privacidad, y otorga su consentimiento expreso para el tratamiento de sus datos personales, incluyendo los datos sensibles, conforme a los términos aquí establecidos.
                      </p>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground mt-6">
                      Última actualización: {fechaActualizacion}
                    </p>
                    
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Footer info */}
        <div className="mt-8 p-4 bg-muted rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Documentos revisados legalmente</p>
              <p className="text-muted-foreground">
                Estos documentos han sido elaborados conforme a la legislación mexicana vigente, 
                incluyendo la Ley Federal del Trabajo, el Código Civil Federal, y la Ley Federal 
                de Protección de Datos Personales en Posesión de los Particulares.
              </p>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            <p><strong>¡Me corrieron!</strong> es una marca registrada ante el IMPI</p>
            <p>Propiedad de <strong>Brainshield SC</strong></p>
            <p className="mt-1">
              Calle Valle de Tlacolula 117, Planta Alta, Valle de Aragón 3ra Sección, CP 55284, Ciudad de México
            </p>
            <p>Contacto: <a href="mailto:legal@mecorrieron.mx" className="text-primary">legal@mecorrieron.mx</a></p>
          </div>
        </div>
      </main>
    </div>
  )
}
