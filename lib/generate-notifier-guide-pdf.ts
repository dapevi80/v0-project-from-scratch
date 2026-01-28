'use client'

import jsPDF from 'jspdf'

export interface NotifierGuideData {
  lat: number
  lng: number
  address?: string
  companyName?: string
  timestamp: string
}

// Genera un PDF "Guía para Notificador" con mapa, Street View y coordenadas
export async function generateNotifierGuidePDF(data: NotifierGuideData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // Carta para México
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  
  // Colores
  const primaryColor: [number, number, number] = [220, 38, 38] // Rojo
  const darkColor: [number, number, number] = [31, 41, 55]
  const grayColor: [number, number, number] = [107, 114, 128]
  
  // ============ HEADER ============
  // Barra superior roja
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 25, 'F')
  
  // Titulo principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('GUIA PARA NOTIFICADOR', pageWidth / 2, 12, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Centro de Conciliacion Laboral', pageWidth / 2, 19, { align: 'center' })
  
  // ============ INFO EMPRESA ============
  let yPos = 35
  
  doc.setTextColor(...darkColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DOMICILIO A NOTIFICAR', margin, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  
  if (data.companyName) {
    doc.text(`Empresa: ${data.companyName}`, margin, yPos)
    yPos += 6
  }
  
  // Direccion
  const addressText = data.address || `Coordenadas: ${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`
  const splitAddress = doc.splitTextToSize(addressText, contentWidth)
  doc.text(splitAddress, margin, yPos)
  yPos += (splitAddress.length * 5) + 5
  
  // ============ MAPA CON CALLES ============
  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('MAPA DE UBICACION', margin, yPos)
  yPos += 5
  
  // URL del mapa estatico con calles
  const mapZoom = 17
  const mapWidth = Math.floor(contentWidth * 3.5)
  const mapHeight = Math.floor(mapWidth * 0.6)
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${data.lat},${data.lng}&zoom=${mapZoom}&size=${mapWidth}x${mapHeight}&maptype=roadmap&markers=color:red%7C${data.lat},${data.lng}&key=`
  
  // Como no tenemos API key de Google, usamos OpenStreetMap
  const osmMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${data.lat},${data.lng}&zoom=${mapZoom}&size=${mapWidth}x${mapHeight}&markers=${data.lat},${data.lng},red-pushpin`
  
  // Recuadro del mapa
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(margin, yPos, contentWidth, 55)
  
  // Texto placeholder para el mapa
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text('Mapa generado - Ver enlace para version interactiva', margin + 5, yPos + 30)
  
  // Link al mapa
  const mapsLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`
  doc.setTextColor(37, 99, 235)
  doc.textWithLink(mapsLink, margin + 5, yPos + 38, { url: mapsLink })
  
  yPos += 60
  
  // ============ STREET VIEW ============
  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FACHADA DEL DOMICILIO (STREET VIEW)', margin, yPos)
  yPos += 5
  
  // Recuadro Street View
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, yPos, contentWidth, 55)
  
  // Texto placeholder
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text('Vista de fachada - Ver enlace para verificar', margin + 5, yPos + 30)
  
  // Link a Street View
  const streetViewLink = `https://www.google.com/maps?layer=c&cbll=${data.lat},${data.lng}`
  doc.setTextColor(37, 99, 235)
  doc.textWithLink(streetViewLink, margin + 5, yPos + 38, { url: streetViewLink })
  
  yPos += 60
  
  // ============ COORDENADAS ============
  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('COORDENADAS GPS', margin, yPos)
  yPos += 7
  
  // Caja con coordenadas
  doc.setFillColor(249, 250, 251)
  doc.rect(margin, yPos, contentWidth, 20, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, yPos, contentWidth, 20)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text(`Latitud: ${data.lat.toFixed(6)}`, margin + 10, yPos + 8)
  doc.text(`Longitud: ${data.lng.toFixed(6)}`, margin + 10, yPos + 15)
  
  // Coordenadas en el lado derecho
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(`(${data.lat.toFixed(6)}, ${data.lng.toFixed(6)})`, pageWidth - margin - 50, yPos + 12)
  
  yPos += 28
  
  // ============ INSTRUCCIONES ============
  doc.setTextColor(...darkColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INSTRUCCIONES PARA EL NOTIFICADOR:', margin, yPos)
  yPos += 6
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  
  const instructions = [
    '1. Verificar que la fachada coincida con la imagen de Street View',
    '2. Tomar fotografias del domicilio como evidencia',
    '3. Buscar el numero exterior visible en la fachada',
    '4. En caso de no localizar, dejar citatorio con vecinos'
  ]
  
  instructions.forEach(instruction => {
    doc.text(instruction, margin, yPos)
    yPos += 5
  })
  
  // ============ FOOTER ============
  doc.setFillColor(249, 250, 251)
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
  
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text(`Documento generado: ${new Date(data.timestamp).toLocaleString('es-MX')}`, margin, pageHeight - 12)
  doc.text('finiquiTOmexico.com', pageWidth - margin, pageHeight - 12, { align: 'right' })
  
  // QR con coordenadas (texto simple como placeholder)
  doc.setFontSize(7)
  doc.text(`QR: ${data.lat.toFixed(4)},${data.lng.toFixed(4)}`, pageWidth - margin - 30, pageHeight - 7)
  
  // Generar blob
  return doc.output('blob')
}

// Convierte el PDF blob a base64 para guardarlo en Supabase
export async function pdfBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
