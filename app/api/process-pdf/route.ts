// Función para calcular calidad basada en características del PDF
function calculatePDFQuality(base64: string, fileName: string): number {
  const sizeInBytes = (base64.length * 3) / 4
  const sizeInKB = sizeInBytes / 1024

  let quality = 50

  if (sizeInKB > 500) quality += 20
  else if (sizeInKB > 200) quality += 15
  else if (sizeInKB > 100) quality += 10
  else if (sizeInKB < 50) quality -= 10

  const hasTextMarkers =
    base64.includes("VGV4dA") || base64.includes("Rm9udA")
  if (hasTextMarkers) quality += 25

  const officialTerms = [
    "constancia",
    "acta",
    "contrato",
    "carta",
    "oficio",
    "notificacion",
    "citatorio",
    "despido",
    "finiquito",
    "liquidacion",
    "demanda",
  ]
  if (officialTerms.some((term) => fileName.toLowerCase().includes(term))) {
    quality += 5
  }

  return Math.min(100, Math.max(0, quality))
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

    // Solo generar resumen si la calidad es >= 95%
    if (quality >= 95) {
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
