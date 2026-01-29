// Extraer información clave del texto del documento (sin IA externa)
function extractKeyInfo(text: string): string {
  const lowerText = text.toLowerCase()

  // Detectar tipo de documento y generar resumen apropiado
  if (
    lowerText.includes("citatorio") ||
    lowerText.includes("conciliacion") ||
    lowerText.includes("audiencia")
  ) {
    const fechaMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)
    return fechaMatch
      ? `Citatorio o notificación oficial. Fecha importante: ${fechaMatch[0]}. No faltes.`
      : "Citatorio oficial. Revisa la fecha de comparecencia."
  }

  if (
    lowerText.includes("despido") ||
    lowerText.includes("terminacion") ||
    lowerText.includes("rescision")
  ) {
    return "Documento relacionado con despido o terminación laboral. Revisa los motivos y fechas."
  }

  if (lowerText.includes("finiquito") || lowerText.includes("liquidacion")) {
    return "Documento de finiquito o liquidación. Verifica que los montos estén correctos antes de firmar."
  }

  if (lowerText.includes("demanda") || lowerText.includes("laudo")) {
    return "Documento de demanda o juicio laboral. Consulta con tu abogado los siguientes pasos."
  }

  if (lowerText.includes("contrato")) {
    return "Contrato laboral. Revisa las condiciones y prestaciones acordadas."
  }

  if (text.length > 500) {
    return "Documento legal guardado. Usa el asistente IA para entenderlo mejor."
  }

  return "Documento escaneado correctamente. Usa el asistente para obtener ayuda."
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Texto requerido" }, { status: 400 })
    }

    if (text.length < 50) {
      return Response.json({ summary: "Texto muy corto para analizar." })
    }

    const summary = extractKeyInfo(text)

    return Response.json({ summary })
  } catch (error) {
    console.error("Error generando resumen:", error)
    return Response.json({
      summary: "Documento guardado. Usa el asistente para más información.",
    })
  }
}
