// Funcion para calcular calidad basada en caracteristicas del PDF
// Umbral minimo bajado a 50% para permitir mas documentos
function calculatePDFQuality(base64: string, fileName: string): number {
  const sizeInBytes = (base64.length * 3) / 4
  const sizeInKB = sizeInBytes / 1024

  // Base inicial mas alta (60 en lugar de 50)
  let quality = 60

  // Bonus por tamano (documentos mas grandes suelen tener mejor calidad)
  if (sizeInKB > 500) quality += 15
  else if (sizeInKB > 200) quality += 12
  else if (sizeInKB > 100) quality += 8
  else if (sizeInKB > 50) quality += 5
  // Ya no penalizamos documentos pequenos tan severamente
  else if (sizeInKB < 20) quality -= 5

  // Detectar marcadores de texto en el PDF (indica PDF nativo, no escaneado)
  const hasTextMarkers =
    base64.includes("VGV4dA") || // "Text" en base64
    base64.includes("Rm9udA") || // "Font" en base64
    base64.includes("L1R5cGU") // "/Type" en base64
  if (hasTextMarkers) quality += 20

  // Bonus por nombre de archivo que indica documento oficial
  const officialTerms = [
    "constancia", "acta", "contrato", "carta", "oficio",
    "notificacion", "citatorio", "despido", "finiquito",
    "liquidacion", "demanda", "nomina", "recibo", "pago",
    "imss", "infonavit", "rfc", "curp", "ine", "credencial"
  ]
  const matchedTerms = officialTerms.filter(term => 
    fileName.toLowerCase().includes(term)
  )
  quality += Math.min(15, matchedTerms.length * 5)

  // Asegurar que cualquier PDF valido tenga al menos 50%
  return Math.min(100, Math.max(50, quality))
}

// Generar resumen basado en el nombre del archivo (sin IA externa)
function generateLocalSummary(fileName: string): string {
  const lowerName = fileName.toLowerCase()

  if (lowerName.includes("despido") || lowerName.includes("terminacion")) {
    return "Documento sobre terminación laboral. Revisa fechas y montos con tu abogado."
  }
  if (lowerName.includes("finiquito") || lowerName.includes("liquidacion")) {
    return "Documento de liquidación. Verifica que los montos sean correctos."
  }
  if (lowerName.includes("contrato")) {
    return "Contrato laboral. Revisa condiciones y prestaciones."
  }
  if (lowerName.includes("constancia") || lowerName.includes("carta")) {
    return "Constancia o carta oficial. Guárdala como evidencia."
  }
  if (lowerName.includes("citatorio") || lowerName.includes("audiencia")) {
    return "Citatorio oficial. Revisa la fecha y lugar de comparecencia."
  }
  if (lowerName.includes("demanda")) {
    return "Demanda laboral. Consulta con tu abogado los siguientes pasos."
  }
  if (lowerName.includes("acta")) {
    return "Acta oficial. Documento importante para tu caso."
  }

  return "Documento guardado en tu bóveda. Usa el asistente IA para analizarlo."
}

export async function POST(request: Request) {
  try {
    const { pdfBase64, fileName } = await request.json()

    if (!pdfBase64) {
      return Response.json({ error: "PDF requerido" }, { status: 400 })
    }

    const quality = calculatePDFQuality(pdfBase64, fileName)
    let summary = ""

    // Generar resumen si la calidad es >= 50% (bajado de 95%)
    if (quality >= 50) {
      summary = generateLocalSummary(fileName)
    }

    return Response.json({
      text: `Documento: ${fileName}`,
      summary,
      quality,
    })
  } catch (error) {
    console.error("Error procesando PDF:", error)
    return Response.json({
      text: "",
      summary: "",
      quality: 0,
    })
  }
}
