// Base de conocimiento de derecho laboral mexicano
const KNOWLEDGE_BASE = {
  despido: {
    keywords: ["despido", "despidieron", "corrieron", "echaron", "botaron"],
    response: `**Sobre el despido en México:**

Si te despidieron, tienes derechos importantes:

1. **Despido justificado** - El patrón debe tener una razón válida según el Art. 47 de la Ley Federal del Trabajo
2. **Despido injustificado** - Tienes derecho a:
   - 3 meses de salario (indemnización constitucional)
   - 20 días por año trabajado (indemnización)
   - Salarios caídos
   - Partes proporcionales de aguinaldo, vacaciones y prima vacacional

**¿Qué hacer?**
- Guarda toda la evidencia (contratos, recibos de nómina, mensajes)
- No firmes nada sin leerlo bien
- Tienes 2 meses para demandar ante la Junta de Conciliación

¿Te gustaría saber más sobre algún punto específico?`,
  },
  finiquito: {
    keywords: ["finiquito", "liquidacion", "liquidación", "indemnizacion", "indemnización"],
    response: `**Sobre finiquito y liquidación:**

Son conceptos diferentes:

**Finiquito** (renuncia voluntaria o término de contrato):
- Salarios pendientes
- Aguinaldo proporcional
- Vacaciones y prima vacacional proporcional
- Prima de antigüedad (si tienes 15+ años)

**Liquidación** (despido injustificado):
Todo lo del finiquito MÁS:
- 3 meses de salario
- 20 días por año trabajado
- Salarios caídos

**Importante:**
- NO firmes si no estás de acuerdo con los montos
- Verifica los cálculos antes de firmar
- Pide desglose por concepto

¿Necesitas que te explique cómo calcular algún concepto?`,
  },
  vacaciones: {
    keywords: ["vacaciones", "prima vacacional", "dias de descanso"],
    response: `**Vacaciones según la Ley Federal del Trabajo:**

Días mínimos por antigüedad (reforma 2023):
- 1 año: 12 días
- 2 años: 14 días
- 3 años: 16 días
- 4 años: 18 días
- 5 años: 20 días
- 6-10 años: 22 días
- 11-15 años: 24 días

**Prima vacacional:** Mínimo 25% sobre el salario de vacaciones

**Importante:**
- Las vacaciones NO se pueden compensar con dinero mientras trabajes
- Si no las tomas, se acumulan
- Al terminar la relación laboral, te deben pagar las vacaciones no disfrutadas

¿Tienes más preguntas sobre tus vacaciones?`,
  },
  aguinaldo: {
    keywords: ["aguinaldo", "navidad", "diciembre"],
    response: `**Aguinaldo en México:**

**¿Cuánto te corresponde?**
- Mínimo 15 días de salario
- Se paga antes del 20 de diciembre

**Si no trabajaste el año completo:**
- Te corresponde la parte proporcional
- Se calcula dividiendo 15 días entre 365 y multiplicando por los días trabajados

**Ejemplo:** Si trabajaste 6 meses = 7.5 días de aguinaldo

**Importante:**
- Es obligatorio aunque no esté en tu contrato
- No importa si renunciaste o te despidieron
- Si no te lo pagan, puedes demandarlo

¿Necesitas ayuda para calcular tu aguinaldo?`,
  },
  contrato: {
    keywords: ["contrato", "firmar", "condiciones", "temporal", "planta"],
    response: `**Sobre contratos de trabajo:**

**Tipos de contrato:**
1. **Por tiempo indeterminado** - El más común y mejor para ti
2. **Por tiempo determinado** - Solo para trabajos temporales específicos
3. **Por obra determinada** - Para proyectos específicos

**El contrato debe incluir:**
- Nombre y domicilio del patrón y trabajador
- Duración de la relación laboral
- Servicios que vas a prestar
- Lugar de trabajo
- Duración de la jornada
- Salario
- Día y forma de pago
- Prestaciones

**Importante:**
- Si no hay contrato escrito, la ley te protege igual
- El patrón tiene la carga de probar las condiciones
- Guarda copia de todo lo que firmes

¿Tienes dudas sobre tu contrato?`,
  },
  jornada: {
    keywords: ["horas", "jornada", "horario", "extras", "overtime", "tiempo extra"],
    response: `**Jornada de trabajo en México:**

**Tipos de jornada:**
- **Diurna** (6am-8pm): Máximo 8 horas
- **Nocturna** (8pm-6am): Máximo 7 horas
- **Mixta**: Máximo 7.5 horas

**Horas extra:**
- Las primeras 9 horas a la semana: se pagan DOBLE
- Después de 9 horas extra: se pagan TRIPLE
- Máximo 3 horas diarias de tiempo extra
- Máximo 3 veces por semana

**Descanso:**
- Al menos 1 día de descanso por cada 6 trabajados
- Si trabajas en tu día de descanso: salario doble + lo normal

¿Te están haciendo trabajar más de lo legal?`,
  },
  acoso: {
    keywords: ["acoso", "hostigamiento", "discriminacion", "maltrato", "mobbing"],
    response: `**Acoso y hostigamiento laboral:**

**¿Qué es acoso laboral?**
Conductas que dañan tu dignidad, integridad física o psicológica.

**Puede incluir:**
- Humillaciones constantes
- Aislamiento social
- Sobrecarga o falta de trabajo intencional
- Amenazas
- Discriminación

**Qué hacer:**
1. Documenta todo (fechas, testigos, mensajes)
2. Reporta a recursos humanos por escrito
3. Guarda copia del reporte
4. Si no actúan, puedes demandar

**Importante:**
- Es causal de rescisión (puedes renunciar y reclamar indemnización)
- Puedes denunciar ante PROFEDET (gratis)
- No tienes que aguantar maltrato

¿Necesitas orientación sobre tu caso específico?`,
  },
  embarazo: {
    keywords: ["embarazo", "embarazada", "maternidad", "lactancia", "prenatal"],
    response: `**Derechos durante el embarazo:**

**No te pueden despedir** por estar embarazada. Es discriminación.

**Tus derechos:**
- **Licencia de maternidad:** 6 semanas antes y 6 después del parto (con goce de sueldo)
- **Lactancia:** 2 reposos de 30 min al día durante 6 meses
- **No trabajo pesado:** Desde el mes 5 de embarazo
- **Incapacidad por IMSS:** Si estás inscrita

**Si te despiden estando embarazada:**
- La liquidación es MAYOR
- El patrón debe probar que NO fue por el embarazo
- Demanda inmediatamente

**Importante:**
- Informa a tu patrón por escrito
- Guarda tu control prenatal
- No firmes renuncia bajo presión

¿Tu patrón está violando estos derechos?`,
  },
  imss: {
    keywords: ["imss", "seguro", "afiliacion", "semanas", "incapacidad"],
    response: `**Seguro Social (IMSS):**

**Tus derechos:**
- Atención médica para ti y tu familia
- Incapacidades pagadas
- Pensión por invalidez o vejez
- Guarderías

**Si no te tienen dado de alta:**
- Tu patrón está cometiendo un delito
- Puedes demandarlo
- Tienes derecho al reconocimiento retroactivo

**Cómo verificar tu afiliación:**
1. Entra a imss.gob.mx
2. Busca "Mi perfil IMSS"
3. Con tu CURP puedes ver tu historial

**Semanas cotizadas importantes:**
- 500 semanas: Pensión mínima
- 1,000 semanas: Pensión completa

¿Tienes problemas con tu afiliación al IMSS?`,
  },
  salario: {
    keywords: ["salario", "sueldo", "pago", "nomina", "nómina", "minimo"],
    response: `**Sobre tu salario:**

**Salario mínimo 2024:**
- General: $248.93 diarios
- Zona Libre Frontera Norte: $374.89 diarios

**Tus derechos:**
- Pago en efectivo, no en especie
- Pago mínimo semanal (máximo 15 días)
- Recibir nómina/recibo de pago
- No descuentos mayores al 30% de tu salario

**Qué debe incluir tu pago:**
- Salario base
- Horas extra (si aplica)
- Comisiones (si aplica)
- Aguinaldo proporcional en diciembre

**Si no te pagan:**
- Primero solicita por escrito
- Si no responden, puedes demandar
- Tienes derecho a salarios caídos

¿Te deben salarios o hay irregularidades en tu pago?`,
  },
}

// Detectar tema del mensaje
function detectTopic(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  for (const [topic, data] of Object.entries(KNOWLEDGE_BASE)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return topic
    }
  }
  return null
}

// Generar respuesta para documento
function generateDocumentResponse(documentContext: string, documentName: string): string {
  const lowerContext = documentContext.toLowerCase()
  const lowerName = documentName.toLowerCase()
  
  // Detectar tipo de documento
  if (lowerContext.includes("citatorio") || lowerName.includes("citatorio")) {
    return `**Análisis del documento: ${documentName}**

Este parece ser un **citatorio oficial**. Aquí te explico lo importante:

1. **Fecha de comparecencia:** Busca la fecha y hora en el documento - es OBLIGATORIO asistir
2. **Lugar:** Generalmente es una Junta de Conciliación o Centro de Conciliación
3. **Motivo:** Lee por qué te citan - puede ser para conciliación, audiencia, etc.

**Consejos:**
- NO faltes a la cita, puede perjudicarte
- Llega temprano con identificación
- Si puedes, ve con un abogado
- Guarda copia del citatorio

¿Necesitas que te explique alguna parte específica del documento?`
  }
  
  if (lowerContext.includes("despido") || lowerName.includes("despido")) {
    return `**Análisis del documento: ${documentName}**

Este documento parece estar relacionado con un **despido**. Puntos importantes:

1. **Revisa la fecha** del despido - tienes 2 meses para demandar
2. **Verifica el motivo** - ¿dice por qué te despidieron?
3. **Busca tu firma** - ¿ya lo firmaste? ¿Qué dice lo que firmaste?

**Derechos por despido injustificado:**
- 3 meses de indemnización
- 20 días por año trabajado
- Partes proporcionales de prestaciones

¿Qué parte del documento te genera dudas?`
  }
  
  if (lowerContext.includes("finiquito") || lowerContext.includes("liquidacion") || 
      lowerName.includes("finiquito") || lowerName.includes("liquidacion")) {
    return `**Análisis del documento: ${documentName}**

Este parece ser un documento de **finiquito o liquidación**. Revisa:

1. **Desglose de conceptos** - ¿aparece cada concepto por separado?
2. **Cálculos** - Verifica que los montos sean correctos
3. **Fecha de inicio y término** - ¿coinciden con tu historial?

**Conceptos que deberían aparecer:**
- Salarios pendientes
- Aguinaldo proporcional
- Vacaciones proporcionales
- Prima vacacional
- (Si es liquidación) Indemnización

**IMPORTANTE:** NO firmes si no estás de acuerdo con los montos.

¿Quieres que te ayude a verificar si los cálculos están bien?`
  }
  
  // Respuesta genérica para documentos
  return `**Análisis del documento: ${documentName}**

He revisado el documento. Para darte una mejor orientación, dime:

1. ¿Qué tipo de documento crees que es?
2. ¿Cuál es tu situación laboral actual?
3. ¿Qué parte te genera dudas?

**Recuerda:**
- Guarda siempre copia de todos tus documentos laborales
- No firmes nada sin entenderlo completamente
- Si tienes dudas, consulta con un abogado laboral

¿En qué puedo ayudarte específicamente?`
}

export async function POST(request: Request) {
  try {
    const { messages, documentContext, documentName, mode } = await request.json()
    
    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1]?.content || ""
    
    let response = ""
    
    // Si hay contexto de documento, analizar el documento
    if (mode === "document" && documentContext && messages.length <= 1) {
      response = generateDocumentResponse(documentContext, documentName || "Documento")
    } else {
      // Detectar tema y responder
      const topic = detectTopic(lastMessage)
      
      if (topic && KNOWLEDGE_BASE[topic as keyof typeof KNOWLEDGE_BASE]) {
        response = KNOWLEDGE_BASE[topic as keyof typeof KNOWLEDGE_BASE].response
      } else {
        // Respuesta genérica
        response = `Gracias por tu pregunta. Como asistente especializado en **derecho laboral mexicano**, puedo ayudarte con:

- **Despidos** y liquidaciones
- **Finiquitos** y cálculos
- **Vacaciones** y aguinaldo
- **Contratos** de trabajo
- **Jornadas** y horas extra
- **Acoso laboral**
- **Derechos** durante el embarazo
- **IMSS** y seguro social
- **Salarios** y pagos

¿Sobre cuál de estos temas necesitas información?

*Nota: Mis respuestas son orientativas. Para casos específicos, te recomiendo consultar con un abogado laboral.*`
      }
    }
    
    // Simular streaming con chunks
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Enviar respuesta en chunks para simular streaming
        const words = response.split(" ")
        let currentChunk = ""
        
        for (let i = 0; i < words.length; i++) {
          currentChunk += words[i] + " "
          
          // Enviar cada 3-5 palabras
          if (i % 4 === 0 || i === words.length - 1) {
            const data = {
              type: "text-delta",
              textDelta: currentChunk,
            }
            controller.enqueue(encoder.encode(`0:${JSON.stringify(data)}\n`))
            currentChunk = ""
            
            // Pequeña pausa para efecto de escritura
            await new Promise(resolve => setTimeout(resolve, 20))
          }
        }
        
        // Mensaje de finalización
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))
        controller.close()
      },
    })
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    })
  } catch (error) {
    console.error("Error en asistente legal:", error)
    return Response.json(
      { error: "Error procesando la solicitud" },
      { status: 500 }
    )
  }
}
